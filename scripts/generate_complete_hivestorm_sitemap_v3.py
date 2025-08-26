#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
IT-ERA — HIVESTORM Sitemap Guardian v3 (self-contained)
USO: esegui questo file DALLA CARTELLA /scripts/ del progetto.
Il programma risale automaticamente alla root del progetto (cartella padre).

Funzioni:
- Legge robots.txt (regole globali User-agent: *)
- Scansiona web/public/content per file HTML
- Normalizza URL (drop .html su prefissi configurati; rimuove /index /index.html)
- Prune 404/410 e pagine vuote (contenuto minimo)
- Log rimozioni in logs/sitemap-removed-YYYYMMDD.txt
- Scrittura ATOMICA in web/sitemap.xml (target principale richiesto)
- Report sintetico in logs/sitemap-report-YYYYMMDD-HHMMSS.md
- (Opzionale) copia anche in public/sitemap.xml per compatibilità strumenti
"""

import os
import re
import sys
import shutil
import logging
from pathlib import Path
from datetime import datetime
import xml.etree.ElementTree as ET
from xml.dom import minidom
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError
import concurrent.futures

# ===================== CONFIG (tutto interno, niente export) =====================

# Dominio di produzione
BASE_URL: str = "https://it-era.it"

# Prefissi da scansionare (relativi alla ROOT del progetto)
SCAN_DIRS: list[str] = ["web", "public", "content"]  # modifica se serve

# Cartelle importanti (relative alla ROOT del progetto)
PUBLIC_DIR_NAME: str = "public"
WEB_DIR_NAME: str    = "web"
LOG_DIR_NAME: str    = "logs"

# Normalizzazione URL
DROP_HTML_PREFIXES: list[str] = ["/pages-generated/"]  # rimuovi .html sotto questi prefissi
KEEP_HTML_EXACT: set[str] = set([
    # "/chi-siamo.html",  # se vuoi preservare .html su path specifici, aggiungili qui
])

# Soglie/timeout
HEAD_WORKERS: int = 16          # parallelismo per HEAD
HEAD_TIMEOUT: float = 4.0       # secondi
MIN_CHARS: int = 50             # minimo caratteri testo (senza tag) per NON considerare la pagina "vuota"

# Scrivere una copia anche in public/sitemap.xml? (utile per alcuni tool)
WRITE_COPY_IN_PUBLIC: bool = True

# ================================================================================
# NON MODIFICARE DA QUI IN GIÙ SE NON SAI COSA STAI FACENDO :)
# ================================================================================

def base_dirs():
    """
    Risolve le directory base a partire dalla POSIZIONE DI QUESTO FILE:
    /scripts/<questo_file>.py  → ROOT = cartella padre
    """
    scripts_dir = Path(__file__).resolve().parent
    base_dir = scripts_dir.parent  # root progetto
    public_dir = (base_dir / PUBLIC_DIR_NAME).resolve()
    web_dir = (base_dir / WEB_DIR_NAME).resolve()
    log_dir = (base_dir / LOG_DIR_NAME).resolve()
    return base_dir, public_dir, web_dir, log_dir

# =============== LOGGING ===============
def setup_logging():
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s [%(levelname)s] %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )

# =============== FILE DISCOVERY ===============
def list_html_files(base_dir: Path) -> list[Path]:
    html_exts = (".html", ".htm")
    files: list[Path] = []
    for rel in SCAN_DIRS:
        d = (base_dir / rel).resolve()
        if not d.exists():
            logging.warning(f"Directory non trovata e ignorata: {d}")
            continue
        count = 0
        logging.info(f"Scanning directory: {d}")
        for f in d.rglob("*"):
            if f.is_file() and f.suffix.lower() in html_exts:
                files.append(f.resolve())
                count += 1
        logging.info(f"Trovati {count} file HTML in {d}")
    return sorted(files)

def strip_tags(text: str) -> str:
    return re.sub(r"<[^>]+>", "", text or "")

def is_empty_file(path: Path) -> bool:
    try:
        if path.stat().st_size < 32:
            return True
        text = path.read_text(encoding="utf-8", errors="ignore")
        return len(strip_tags(text).strip()) < MIN_CHARS
    except Exception:
        return True

# =============== Robots.txt (global '*') ===============
class RobotsRules:
    def __init__(self):
        self.allow_prefixes: set[str] = set()
        self.disallow_prefixes: set[str] = set()
        self.disallow_regex: list[re.Pattern] = []
        self.loaded = False

    def load(self, robots_path: Path):
        if not robots_path.exists():
            logging.warning(f"robots.txt non trovato: {robots_path} — nessun filtro robots applicato")
            return

        section = "*"  # applichiamo solo regole globali
        for raw in robots_path.read_text(encoding="utf-8", errors="ignore").splitlines():
            line = raw.strip()
            if not line or line.startswith("#"):
                continue
            key, _, val = line.partition(":")
            k = key.strip().lower()
            v = val.strip()
            if k == "user-agent":
                section = v.lower()
            elif section == "*" and k in ("allow", "disallow"):
                # pattern complessi → regex
                if v.endswith("$") or "*" in v or "\\" in v:
                    pattern = v.replace(".", r"\.").replace("*", ".*")
                    if not pattern.startswith("/"):
                        pattern = "/" + pattern
                    try:
                        rgx = re.compile(pattern + ("$" if v.endswith("$") else ""))
                        if k == "disallow":
                            self.disallow_regex.append(rgx)
                        else:
                            self.allow_prefixes.add(v)
                    except re.error:
                        logging.warning(f"Ignoro pattern robots non valido: {v}")
                else:
                    p = v if v.startswith("/") else "/" + v
                    if k == "disallow":
                        self.disallow_prefixes.add(p)
                    else:
                        self.allow_prefixes.add(p)

        self.loaded = True
        logging.info("robots.txt caricato (regole globali '*').")
        if self.allow_prefixes:
            logging.info(f"Allow (prefix): {sorted(self.allow_prefixes)}")
        if self.disallow_prefixes or self.disallow_regex:
            logging.info(f"Disallow (prefix): {sorted(self.disallow_prefixes)}")
            logging.info(f"Disallow (regex): {[r.pattern for r in self.disallow_regex]}")

    def is_blocked(self, path: str) -> bool:
        if not path.startswith("/"):
            path = "/" + path
        # Allow ha priorità
        for pref in self.allow_prefixes:
            if path.startswith(pref):
                return False
        # Disallow per prefisso
        for pref in self.disallow_prefixes:
            if path.startswith(pref):
                return True
        # Disallow per regex
        for rgx in self.disallow_regex:
            if rgx.search(path):
                return True
        return False

# =============== URL UTILS ===============
def normalize_path(path: str) -> str:
    if not path.startswith("/"):
        path = "/" + path

    # whitelist: preserva .html per path specifici
    if path in KEEP_HTML_EXACT:
        pass
    else:
        # /index o /index.html → /
        path = re.sub(r"/index(?:\.html)?$", "/", path)

        # drop .html solo sotto prefissi specificati
        for prefix in DROP_HTML_PREFIXES:
            if path.startswith(prefix) and path.endswith(".html"):
                path = path[:-5]  # rimuove ".html"
                break

    # normalizza doppie slash
    path = re.sub(r"//+", "/", path)
    return path

def to_url(path: str) -> str:
    return BASE_URL.rstrip("/") + path

def head_status(url: str) -> int:
    try:
        req = Request(url, method="HEAD", headers={"User-Agent": "SitemapGuardian/3.0"})
        with urlopen(req, timeout=HEAD_TIMEOUT) as resp:
            return resp.status
    except HTTPError as e:
        return e.code
    except URLError:
        return 0
    except Exception:
        return 0

def atomic_write_text(path: Path, data: str):
    tmp = path.with_suffix(path.suffix + ".tmp")
    path.parent.mkdir(parents=True, exist_ok=True)
    tmp.write_text(data, encoding="utf-8")
    tmp.replace(path)

# =============== CORE ===============
def build_candidates(base_dir: Path, public_dir: Path, robots: RobotsRules):
    html_files = list_html_files(base_dir)
    logging.info(f"Totale file HTML scoperti: {len(html_files)}")
    candidates = []

    for f in html_files:
        # path relativo alla ROOT progetto
        rel = "/" + str(f.relative_to(base_dir)).replace("\\", "/")
        # Se proviene da /public, togli il prefisso /public dal path URL
        if rel.startswith("/public/"):
            rel = rel[len("/public"):]  # mantiene lo slash iniziale
        p_norm = normalize_path(rel)

        # filtro robots
        if robots.is_blocked(p_norm):
            continue

        url = to_url(p_norm)
        lastmod = datetime.utcfromtimestamp(f.stat().st_mtime).strftime("%Y-%m-%d")
        candidates.append((url, lastmod, f, p_norm))

    return candidates, len(html_files)

def prune_and_validate(candidates):
    removed = []
    kept_local = []

    # 1) filtro locale: vuote/leggibilità
    for (url, lastmod, f, p_norm) in candidates:
        try:
            if f.stat().st_size < 32:
                removed.append((url, "EMPTY_SMALL"))
                continue
            txt = f.read_text(encoding="utf-8", errors="ignore")
            if len(strip_tags(txt).strip()) < MIN_CHARS:
                removed.append((url, "EMPTY_LOCAL"))
                continue
        except Exception:
            removed.append((url, "READ_ERROR"))
            continue
        kept_local.append((url, lastmod))

    # 2) HEAD remoto
    final = []
    total = len(kept_local)
    if total == 0:
        return final, removed

    logging.info(f"Validazione HEAD su {total} URL…")
    step = max(1, total // 14)  # ~7% progress

    with concurrent.futures.ThreadPoolExecutor(max_workers=HEAD_WORKERS) as ex:
        futs = {ex.submit(head_status, url): (url, lastmod) for (url, lastmod) in kept_local}
        done = 0
        for fut in concurrent.futures.as_completed(futs):
            done += 1
            if done % step == 0 or done == total:
                logging.info(f"Progresso validazione: {done}/{total}")
            url, lastmod = futs[fut]
            status = fut.result()
            if status in (200, 301, 302):   # accettiamo 2xx e 3xx "leggeri"
                final.append((url, lastmod))
            elif status in (404, 410):
                removed.append((url, f"HTTP_{status}"))
            else:
                final.append((url, lastmod))  # prudente: mantieni per evitare falsi negativi
    logging.info(f"HEAD complete: validi {len(final)}/{total}")
    return final, removed

def write_log(log_dir: Path, removed):
    if not removed:
        return None
    ts = datetime.utcnow().strftime("%Y%m%d")
    log_path = log_dir / f"sitemap-removed-{ts}.txt"
    lines = [f"{datetime.utcnow().isoformat()}Z {reason} {url}" for (url, reason) in removed]
    with log_path.open("a", encoding="utf-8") as fh:
        fh.write("\n".join(lines) + "\n")
    return str(log_path)

def write_report(log_dir: Path, total_html: int, candidates_count: int, kept_count: int, removed_count: int, log_file: str | None):
    ts = datetime.utcnow().strftime("%Y%m%d-%H%M%S")
    rpt = log_dir / f"sitemap-report-{ts}.md"
    body = [
        f"# IT-ERA Sitemap v3 — Report ({ts})",
        "",
        f"- Base URL: {BASE_URL}",
        f"- Total HTML files scanned: **{total_html}**",
        f"- Candidates after robots filter: **{candidates_count}**",
        f"- Kept in sitemap: **{kept_count}**",
        f"- Removed: **{removed_count}**",
        f"- Removal log: `{log_file or 'n/a'}`",
        "",
        "## Note",
        "- Robots.txt (regole globali '*') applicato.",
        "- URL normalizzati (extensionless su prefissi, /index rimosso).",
        "- HEAD pruning 404/410.",
        "- Scrittura atomica in web/sitemap.xml.",
        "- (Opzionale) copia anche in public/sitemap.xml se abilitato.",
    ]
    rpt.write_text("\n".join(body), encoding="utf-8")
    return str(rpt)

def write_sitemap_atomic_web(web_dir: Path, entries: list[tuple[str, str]]) -> str:
    """Scrive ATOMICAMENTE la sitemap in /web/sitemap.xml (target principale)."""
    urlset = ET.Element("urlset", attrib={"xmlns": "http://www.sitemaps.org/schemas/sitemap/0.9"})
    for (loc, lastmod) in entries:
        u = ET.SubElement(urlset, "url")
        ET.SubElement(u, "loc").text = loc
        ET.SubElement(u, "lastmod").text = lastmod
        ET.SubElement(u, "changefreq").text = "weekly"
        ET.SubElement(u, "priority").text = "0.6"

    xml_str = ET.tostring(urlset, encoding="unicode")
    pretty = minidom.parseString(xml_str).toprettyxml(indent="  ")
    pretty = "\n".join([ln for ln in pretty.splitlines() if ln.strip()])

    out_path = (web_dir / "sitemap.xml").resolve()
    tmp = out_path.with_suffix(out_path.suffix + ".tmp")
    web_dir.mkdir(parents=True, exist_ok=True)

    tmp.write_text(pretty, encoding="utf-8")
    if out_path.exists():
        out_path.unlink()
    tmp.replace(out_path)
    return str(out_path)

def maybe_write_public_copy(public_dir: Path, web_sitemap_path: str):
    if not WRITE_COPY_IN_PUBLIC:
        return None
    try:
        public_dir.mkdir(parents=True, exist_ok=True)
        dst = (public_dir / "sitemap.xml").resolve()
        # scrittura atomica anche qui
        tmp = dst.with_suffix(dst.suffix + ".tmp")
        tmp.write_text(Path(web_sitemap_path).read_text(encoding="utf-8"), encoding="utf-8")
        if dst.exists():
            dst.unlink()
        tmp.replace(dst)
        return str(dst)
    except Exception as e:
        logging.warning(f"Copy in public/sitemap.xml fallita: {e}")
        return None

# =============== MAIN ===============
def main():
    setup_logging()
    base_dir, public_dir, web_dir, log_dir = base_dirs()

    logging.info("🚀 Avvio IT-ERA Sitemap Generation v3 (self-contained)")
    logging.info(f"ROOT: {base_dir}")
    logging.info(f"Cartelle scan: {SCAN_DIRS}")
    logging.info(f"WEB dir target: {web_dir}")
    logging.info(f"PUBLIC dir: {public_dir}")
    logging.info(f"LOG dir: {log_dir}")

    # robots
    robots = RobotsRules()
    robots.load(public_dir / "robots.txt")

    # candidati
    candidates, total_html = build_candidates(base_dir, public_dir, robots)
    logging.info(f"📊 Candidati post-robots: {len(candidates)} (su {total_html} file)")

    kept, removed = prune_and_validate(candidates)
    logging.info(f"🎯 URL finali in sitemap: {len(kept)} — rimossi: {len(removed)}")

    log_file = write_log(log_dir, removed)
    web_path = write_sitemap_atomic_web(web_dir, kept)
    logging.info(f"✅ Sitemap scritta (atomica) in: {web_path}")

    public_copy = maybe_write_public_copy(public_dir, web_path)
    if public_copy:
        logging.info(f"✅ Copia sitemap anche in: {public_copy}")

    rpt = write_report(log_dir, total_html, len(candidates), len(kept), len(removed), log_file)
    logging.info(f"📝 Report: {rpt}")
    logging.info("🎉 Completato!")

if __name__ == "__main__":
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        print("\nInterrotto.")
        sys.exit(130)


#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Audit dei draft V3 in web/pages-draft/*.v3.html secondo specifica.
- Nessuna modifica ai file sorgente.
- Output: JSON/HTML in web/reports/ e preview HTML in web/pages/seo-status.preview.html
- Exit code 1 solo in presenza di errori critici (mancanza title/h1/canonical/robots o JSON-LD assente)
"""
import sys
import os
import re
import json
import hashlib
from pathlib import Path
from datetime import datetime
from html import unescape

try:
    from bs4 import BeautifulSoup  # type: ignore
except Exception:
    BeautifulSoup = None

BASE = Path(__file__).resolve().parents[1]
DRAFT_DIR = BASE / 'web/pages-draft'
REPORT_DIR = BASE / 'web/reports'
PAGES_DIR = BASE / 'web/pages'
DATA_DIR = BASE / 'data'
MASTER_CSV = DATA_DIR / 'comuni_master.csv'

REPORT_JSON = REPORT_DIR / 'draft_v3_audit.json'
REPORT_HTML = REPORT_DIR / 'draft_v3_audit.html'
PREVIEW_HTML = PAGES_DIR / 'seo-status.preview.html'

SERVIZI_LABEL = {
    'assistenza-it': 'Assistenza IT',
    'sicurezza-informatica': 'Sicurezza Informatica',
    'cloud-storage': 'Cloud Storage',
}

CRITICAL_KEYS = {'title', 'h1', 'canonical', 'robots', 'ld_any'}

# Utils

def sha1_file(path: Path) -> str:
    h = hashlib.sha1()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def length_in_range(s: str, lo: int, hi: int) -> bool:
    n = len(s.strip())
    return lo <= n <= hi


def load_master_index():
    """Return dicts keyed by filename base for province/servizio/slug."""
    import csv
    idx = {}
    prov_map = {}
    serv_map = {}
    try:
        with MASTER_CSV.open('r', encoding='utf-8') as f:
            r = csv.DictReader(f)
            for row in r:
                slug_full = row.get('slug_completo') or f"{row.get('servizio_slug')}-{row.get('slug_comune')}"
                idx[slug_full] = {
                    'comune': row.get('comune',''),
                    'provincia': row.get('provincia',''),
                    'servizio': row.get('servizio_slug',''),
                    'slug': row.get('slug_comune',''),
                }
                prov_map.setdefault(row.get('provincia',''), set()).add(row.get('slug_comune',''))
                serv_map.setdefault(row.get('servizio_slug',''), set()).add(row.get('slug_comune',''))
    except FileNotFoundError:
        pass
    return idx, prov_map, serv_map


def parse_json_ld(soup: 'BeautifulSoup'):
    """Extract JSON-LD blocks; return dict with flags and counts."""
    ld_blocks = soup.find_all('script', attrs={'type': 'application/ld+json'}) if soup else []
    flags = {
        'ld_localbusiness': False,
        'ld_service': False,
        'ld_faq': False,
        'ld_breadcrumb': False,
        'ld_any': False,
    }
    lb_ok = sv_ok = fq_ok = bc_ok = False
    try:
        for tag in ld_blocks:
            try:
                txt = tag.string or tag.get_text() or ''
                if not txt.strip():
                    continue
                data = json.loads(txt)
            except Exception:
                # Tenta a estrarre array/dizionario ripulendo commenti o trailing
                try:
                    data = json.loads(unescape(txt))
                except Exception:
                    continue
            def walk(node):
                nonlocal lb_ok, sv_ok, fq_ok, bc_ok
                if isinstance(node, dict):
                    t = (node.get('@type') or '').lower()
                    if t == 'localbusiness':
                        loc = node.get('address', {}) or {}
                        if isinstance(loc, dict):
                            locality = (loc.get('addressLocality') or '').strip()
                            region = (loc.get('addressRegion') or '')
                        else:
                            locality = ''
                            region = ''
                        area = node.get('areaServed')
                        lb_ok = bool(locality) and (str(region).strip().lower() == 'lombardia') and (area is not None)
                    elif t == 'service':
                        st = (node.get('serviceType') or '').lower()
                        # accetta varianti case e spazi
                        sv_ok = any(k in st for k in ['assistenza', 'sicurezza', 'cloud'])
                    elif t == 'faqpage':
                        me = node.get('mainEntity') or []
                        if isinstance(me, list):
                            fq_ok = len(me) >= 2
                    elif t == 'breadcrumblist':
                        items = node.get('itemListElement') or []
                        # Almeno Home → Categoria → Pagina
                        bc_ok = isinstance(items, list) and len(items) >= 3
                elif isinstance(node, list):
                    for x in node:
                        walk(x)
            walk(data)
    finally:
        flags['ld_localbusiness'] = lb_ok
        flags['ld_service'] = sv_ok
        flags['ld_faq'] = fq_ok
        flags['ld_breadcrumb'] = bc_ok
        flags['ld_any'] = any([lb_ok, sv_ok, fq_ok, bc_ok])
        return flags


def find_single_h1(soup: 'BeautifulSoup'):
    h1s = soup.find_all('h1') if soup else []
    return h1s[0].get_text(strip=True) if len(h1s) == 1 else None, len(h1s)


def extract_meta(soup: 'BeautifulSoup', name: str) -> str:
    if not soup:
        return ''
    tag = soup.find('meta', attrs={'name': name})
    return (tag.get('content') or '').strip() if tag else ''


def extract_og(soup: 'BeautifulSoup', prop: str) -> str:
    if not soup:
        return ''
    tag = soup.find('meta', attrs={'property': prop})
    return (tag.get('content') or '').strip() if tag else ''


def extract_canonical(soup: 'BeautifulSoup') -> str:
    if not soup:
        return ''
    link = soup.find('link', attrs={'rel': 'canonical'})
    return (link.get('href') or '').strip() if link else ''


def get_last_modified(path: Path) -> str:
    ts = path.stat().st_mtime
    return datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')


def audit_file(path: Path, master_idx):
    html = path.read_text(encoding='utf-8', errors='replace')
    if BeautifulSoup is None:
        return None, ['BeautifulSoup non installato'], []
    soup = BeautifulSoup(html, 'html.parser')
    errors = []
    warnings = []

    # filename info
    base = path.name  # es: assistenza-it-bergamo.v3.html
    basename = base.replace('.v3.html', '')
    slug_full = basename  # servizio-slug

    # mappa master
    meta_master = master_idx.get(slug_full, {})
    servizio = meta_master.get('servizio') or slug_full.split('-')[0]
    provincia = meta_master.get('provincia') or ''
    comune = meta_master.get('comune') or ''
    slug_comune = meta_master.get('slug') or slug_full.split('-', 1)[-1]

    # Title
    title_tag = soup.find('title')
    title = title_tag.get_text(strip=True) if title_tag else ''
    title_ok = bool(title) and (comune.lower() in title.lower() if comune else True)
    if not title:
        errors.append('TITLE mancante')
    elif comune and (comune.lower() not in title.lower()):
        warnings.append('TITLE non contiene città')

    # H1 unico
    h1_text, h1_count = find_single_h1(soup)
    h1_ok = (h1_count == 1) and (h1_text is not None) and (comune.lower() in h1_text.lower() or any(k in (h1_text or '').lower() for k in ['assistenza','sicurezza','cloud']))
    if h1_count == 0:
        errors.append('H1 mancante')
    elif h1_count > 1:
        errors.append('H1 multipli')
    elif not h1_ok:
        warnings.append('H1 presente ma non coerente con città/servizio')

    # Meta description
    meta_desc = extract_meta(soup, 'description')
    meta_ok = bool(meta_desc) and length_in_range(meta_desc, 140, 180)
    if not meta_desc:
        errors.append('META description mancante')
    elif not length_in_range(meta_desc, 140, 180):
        warnings.append('META description lunghezza fuori range (preferito 150–160)')

    # canonical
    canonical = extract_canonical(soup)
    can_ok = bool(canonical)
    if not canonical:
        errors.append('Canonical mancante')
    else:
        # deve puntare a /pages/<basename>.html
        # rimuovi dominio se presente
        m = re.search(r"https?://[^/]+(/.*)$", canonical)
        path_only = m.group(1) if m else canonical
        expected = f"/pages/{slug_full.replace('.v3','')}.html" if slug_full.endswith('.v3') else f"/pages/{slug_full}.html"
        if not path_only.endswith(expected):
            errors.append(f'Canonical non coerente (atteso {expected})')
        if '/pages-draft/' in path_only:
            errors.append('Canonical punta a draft (non consentito)')

    # robots
    robots = extract_meta(soup, 'robots').lower()
    robots_ok = (robots == 'noindex,follow')
    if not robots:
        errors.append('Robots mancante')
    elif not robots_ok:
        errors.append('Robots non è "noindex,follow"')

    # JSON-LD
    ld_flags = parse_json_ld(soup)
    if not ld_flags.get('ld_any'):
        errors.append('JSON-LD assente')
    ld_lb_ok = ld_flags.get('ld_localbusiness', False)
    ld_sv_ok = ld_flags.get('ld_service', False)
    ld_fq_ok = ld_flags.get('ld_faq', False)
    ld_bc_ok = ld_flags.get('ld_breadcrumb', False)

    # Media: og:image e hero svg esistenza + alt
    og_image = extract_og(soup, 'og:image')
    if not og_image:
        warnings.append('OG image mancante')
    hero_rel = f"web/static/images/it-{servizio}-{slug_comune}-hero.svg"
    hero_path = BASE / hero_rel
    hero_exists = hero_path.exists()
    if not hero_exists:
        warnings.append('Hero SVG mancante')
    # alt text: best effort, non avendo <img> in hero; validiamo presenza alt nel JSON-LD LocalBusiness image o nel path
    alt_present = False
    if og_image and comune and comune.lower() in og_image.lower():
        alt_present = True
    # In mancanza di img alt esplicito, consideriamo WARN se non contiene città
    if not alt_present:
        warnings.append('Alt text/contesto immagine non contiene città (best effort)')

    # Comuni vicini: max 6 link, interni stesso TLD e path /pages/ o /pages-draft/ (richiesto draft)
    vicini_section = soup.find('h2', string=lambda s: s and 'Comuni vicini' in s)
    vicini_ok = False
    if vicini_section:
        container = vicini_section.find_parent('section') or vicini_section.find_parent('div')
        if container:
            links = container.find_all('a')
            hrefs = [a.get('href') or '' for a in links]
            internal_ok = all(h.startswith('/') for h in hrefs)
            count_ok = len(hrefs) <= 6
            # Devono puntare ai draft per la fase di audit
            draft_paths_ok = all(h.startswith('/pages-draft/') for h in hrefs) if hrefs else False
            if not count_ok:
                warnings.append('Comuni vicini: più di 6 link')
            if not internal_ok:
                errors.append('Comuni vicini: link non interni')
            if hrefs and not draft_paths_ok:
                warnings.append('Comuni vicini: link non puntano ai draft (/pages-draft/)')
            # Best effort: stessa provincia
            same_prov_ok = True
            if hrefs:
                p_pages = re.compile(r'^/pages/([a-z0-9\-]+)-([a-z0-9\-]+)\.html$')
                p_draft = re.compile(r'^/pages-draft/([a-z0-9\-]+)-([a-z0-9\-]+)\.v3\.html$')
                for h in hrefs:
                    m = p_pages.match(h) or p_draft.match(h)
                    if not m:
                        continue
                    n_serv, n_slug = m.group(1), m.group(2)
                    n_key = f"{n_serv}-{n_slug}"
                    # lookup nel master
                    # master_idx disponibile nel closure via outer scope? Passiamo come arg in audit_file
                    pass
            # Valutazione finale
            vicini_ok = internal_ok and count_ok and draft_paths_ok
    else:
        errors.append('Sezione "Comuni vicini" mancante')

    # checksum
    checksum = sha1_file(path)

    checks = {
        'title': title_ok,
        'h1': h1_ok and (h1_count == 1),
        'meta': meta_ok,
        'canonical': can_ok,
        'robots': robots_ok,
        'ld_localbusiness': ld_lb_ok,
        'ld_service': ld_sv_ok,
        'ld_faq': ld_fq_ok,
        'ld_breadcrumb': ld_bc_ok,
        'hero_exists': hero_exists,
        'alt_present': alt_present,
        'vicini_ok': vicini_ok,
    }

    result = {
        'file': str(path.relative_to(BASE)),
        'slug': slug_comune,
        'provincia': provincia,
        'servizio': servizio,
        'citta': comune,
        'title': title,
        'canonical': canonical,
        'robots': robots,
        'checks': checks,
        'warnings': warnings,
        'errors': errors,
        'checksum_sha1': checksum,
        'last_modified': get_last_modified(path),
    }
    return result, errors, warnings


def render_html_report(rows):
    # KPI
    total = len(rows)
    crit_err = []
    for r in rows:
        has_crit = False
        if not r['checks']['title']:
            has_crit = True
        if not (r['checks']['h1']):
            has_crit = True
        if not r['checks']['canonical']:
            has_crit = True
        if not r['checks']['robots']:
            has_crit = True
        if not any([r['checks']['ld_localbusiness'], r['checks']['ld_service'], r['checks']['ld_faq'], r['checks']['ld_breadcrumb']]):
            has_crit = True
        if has_crit:
            crit_err.append(r)
    err_cnt = len(crit_err)
    warn_cnt = sum(1 for r in rows if (r['warnings'] and not r in crit_err))
    pass_cnt = sum(1 for r in rows if not r['warnings'] and not r in crit_err)
    def pct(n):
        return f"{(100.0*n/total):.1f}%" if total else "0%"

    # breakdown
    by_prov = {}
    by_serv = {}
    for r in rows:
        by_prov.setdefault(r['provincia'] or 'NA', []).append(r)
        by_serv.setdefault(r['servizio'] or 'NA', []).append(r)

    def table_rows(rs):
        out = []
        for r in rs:
            state = 'OK' if (not r['warnings'] and r['errors'] == []) else ('ERR' if r in crit_err else 'WARN')
            out.append(
                f"<tr><td><a href='/{r['file']}' target='_blank'>{os.path.basename(r['file'])}</a></td>"
                f"<td>{r.get('citta','')}</td><td>{r.get('provincia','')}</td><td>{SERVIZI_LABEL.get(r.get('servizio',''), r.get('servizio',''))}</td>"
                f"<td>{state}</td><td>{len(r['warnings'])}</td><td>{len(r['errors'])}</td></tr>"
            )
        return '\n'.join(out)

    kpi_html = f"""
    <div class='row g-3 mb-4'>
      <div class='col'><div class='card p-3'><div class='small text-muted'>Totali</div><div class='h4 fw-bold'>{total}</div></div></div>
      <div class='col'><div class='card p-3'><div class='small text-muted'>Pass</div><div class='h4 fw-bold text-success'>{pass_cnt} ({pct(pass_cnt)})</div></div></div>
      <div class='col'><div class='card p-3'><div class='small text-muted'>Warn</div><div class='h4 fw-bold text-warning'>{warn_cnt} ({pct(warn_cnt)})</div></div></div>
      <div class='col'><div class='card p-3'><div class='small text-muted'>Err critici</div><div class='h4 fw-bold text-danger'>{err_cnt} ({pct(err_cnt)})</div></div></div>
    </div>
    """

    def breakdown_section(title, groups):
        cards = []
        for k, rs in sorted(groups.items(), key=lambda kv: kv[0]):
            ok = sum(1 for r in rs if (not r['warnings'] and r['errors'] == []))
            warn = sum(1 for r in rs if (r['warnings'] and not r['errors']))
            err = sum(1 for r in rs if r in crit_err)
            cards.append(f"<div class='col-md-4'><div class='card p-3 h-100'><div class='h6'>{k}</div><div class='small'>Tot: {len(rs)} · OK {ok} · WARN {warn} · ERR {err}</div></div></div>")
        return f"<h3 class='h5 mt-4'>{title}</h3><div class='row g-3'>{''.join(cards)}</div>"

    html = f"""<!DOCTYPE html>
<html lang='it'>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>Audit Draft V3</title>
  <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>
</head>
<body class='bg-light'>
<div class='container py-4'>
  <h1 class='h3 mb-3'>Audit Draft V3</h1>
  {kpi_html}
  <h3 class='h5 mt-4'>Elenco</h3>
  <div class='table-responsive'>
    <table class='table table-sm align-middle'>
      <thead><tr><th>File</th><th>Città</th><th>Provincia</th><th>Servizio</th><th>Stato</th><th>Warn</th><th>Err</th></tr></thead>
      <tbody>
        {table_rows(rows)}
      </tbody>
    </table>
  </div>
  {breakdown_section('Breakdown per provincia', by_prov)}
  {breakdown_section('Breakdown per servizio', by_serv)}
</div>
</body>
</html>"""
    return html


def render_preview(rows):
    def row(r):
        state = 'OK' if (not r['warnings'] and r['errors'] == []) else ('ERR' if any(k in r['errors'] for k in ['TITLE mancante','H1 mancante','H1 multipli','Canonical mancante','Robots mancante','Robots non è "noindex,follow"','JSON-LD assente']) else 'WARN')
        url = '/' + r['file']
        last = r['last_modified']
        return f"<tr><td><a href='{url}' target='_blank'>{url}</a></td><td>{r['canonical']}</td><td>{r['robots']}</td><td>{state}</td><td>{last}</td></tr>"
    html = f"""<!DOCTYPE html>
<html lang='it'>
<head>
  <meta charset='utf-8'>
  <meta name='viewport' content='width=device-width, initial-scale=1'>
  <title>SEO Status Preview</title>
  <link href='https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css' rel='stylesheet'>
  <meta name='robots' content='noindex,follow'>
</head>
<body>
<div class='container py-4'>
  <h1 class='h4 mb-3'>SEO Status Preview (Draft)</h1>
  <div class='table-responsive'>
    <table class='table table-sm align-middle'>
      <thead><tr><th>URL draft</th><th>Canonical</th><th>Robots</th><th>Stato</th><th>Last modified</th></tr></thead>
      <tbody>
        {''.join(row(r) for r in rows)}
      </tbody>
    </table>
  </div>
</div>
</body>
</html>"""
    return html


def main():
    if BeautifulSoup is None:
        print('Errore: BeautifulSoup (bs4) non è installato. Installa con: pip install beautifulsoup4', file=sys.stderr)
        return 2

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    PAGES_DIR.mkdir(parents=True, exist_ok=True)

    files = sorted(DRAFT_DIR.glob('*.v3.html'))
    idx, prov_map, serv_map = load_master_index()

    results = []
    critical_errors = 0
    for i, fp in enumerate(files, 1):
        r, errs, warns = audit_file(fp, idx)
        if r is None:
            print('Impossibile processare file senza BeautifulSoup', file=sys.stderr)
            return 2
        results.append(r)
        # errori critici secondo policy
        has_critical = False
        if ('TITLE mancante' in errs) or ('H1 mancante' in errs) or ('H1 multipli' in errs) or ('Canonical mancante' in errs) or ('Robots mancante' in errs) or ('Robots non è "noindex,follow"' in errs) or ('JSON-LD assente' in errs):
            has_critical = True
        if has_critical:
            critical_errors += 1
        if i % 100 == 0:
            print(f"[audit] Processati {i}/{len(files)}")

    # write JSON
    REPORT_JSON.write_text(json.dumps(results, ensure_ascii=False, indent=2), encoding='utf-8')

    # write HTML report
    REPORT_HTML.write_text(render_html_report(results), encoding='utf-8')

    # write preview
    PREVIEW_HTML.write_text(render_preview(results), encoding='utf-8')

    # Console summary
    total = len(results)
    pass_cnt = sum(1 for r in results if not r['warnings'] and not r['errors'])
    err_cnt = critical_errors
    warn_cnt = total - pass_cnt - err_cnt

    def pct(n):
        return f"{(100.0*n/total):.1f}%" if total else '0%'

    print('\n=== AUDIT DRAFT V3 ===')
    print(f"Totali: {total} | Pass {pass_cnt} ({pct(pass_cnt)}) | Warn {warn_cnt} ({pct(warn_cnt)}) | Err {err_cnt} ({pct(err_cnt)})")

    # prime 10 entry con errori critici
    crit_rows = []
    for r in results:
        e = r['errors']
        if ('TITLE mancante' in e) or ('H1 mancante' in e) or ('H1 multipli' in e) or ('Canonical mancante' in e) or ('Robots mancante' in e) or ('Robots non è "noindex,follow"' in e) or ('JSON-LD assente' in e):
            crit_rows.append(r)
    if crit_rows:
        print('\nPrime 10 entry con errori critici:')
        for r in crit_rows[:10]:
            print(f"- {r['file']} :: {', '.join(r['errors'])}")

    print('\nLink rapidi:')
    print(' - web/reports/draft_v3_audit.html')
    print(' - web/pages/seo-status.preview.html')

    # Exit code policy
    return 1 if critical_errors > 0 else 0


if __name__ == '__main__':
    sys.exit(main())

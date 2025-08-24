#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Reconcile & Fix Draft V3
- Costruisce l'insieme atteso dai dataset (comuni_preview.csv + comuni_master.csv) per 3 servizi
- Confronta con web/pages-draft/*.v3.html
- Crea i file mancanti con template V3 coerente
- Garantisce media hero SVG e og:image
- Garantisce JSON-LD minimo e BreadcrumbList >= 3
- Scrive report JSON: web/reports/reconcile_fix_v3.json
Policy: Side effects consentiti su web/pages-draft e web/static/images
"""
import csv
import json
import re
import sys
from pathlib import Path
from html import escape

BASE = Path(__file__).resolve().parents[1]
DRAFT_DIR = BASE / 'web/pages-draft'
MEDIA_DIR = BASE / 'web/static/images'
REPORT_DIR = BASE / 'web/reports'
DATA_DIR = BASE / 'data'
PREVIEW_CSV = DATA_DIR / 'comuni_preview.csv'
MASTER_CSV = DATA_DIR / 'comuni_master.csv'
BASE_URL = 'https://it-era.pages.dev'

SERVIZI = ['assistenza-it','sicurezza-informatica','cloud-storage']
SERVIZI_LABEL = {
    'assistenza-it': 'Assistenza IT',
    'sicurezza-informatica': 'Sicurezza Informatica',
    'cloud-storage': 'Cloud Storage',
}

FAQ_DEFAULT = {
    'assistenza-it': [
        ("Tempi di attivazione a {CITTA}?", "1–3 giorni lavorativi dopo l'assessment iniziale."),
        ("Interventi in sede disponibili?", "Sì, a {CITTA} e comuni limitrofi."),
    ],
    'sicurezza-informatica': [
        ("Firewall gestito per PMI?", "Policy, web filtering e VPN sicure."),
        ("Il canone include il supporto?", "Configurazione e monitoraggio inclusi."),
    ],
    'cloud-storage': [
        ("Quanto storage serve?", "Da 100GB a 5TB+ con scalabilità."),
        ("I dati sono sicuri?", "Cifratura AES‑256 e 2FA."),
    ],
}

KPI = {
    'assistenza-it': [('4h','SLA emergenze'), ('24/7','Help desk'), ('200+','PMI assistite'), ('€290','da /mese')],
    'sicurezza-informatica': [('24/7','Monitoring'), ('AI','Anti‑ransomware'), ('GDPR','Compliance'), ('€39','FW/mese')],
    'cloud-storage': [('100GB+','Storage'), ('AES‑256','Encryption'), ('EU','Data'), ('GDPR','Compliant')],
}

PARTNER = {
    'assistenza-it': 'Partner certificati: WatchGuard • Microsoft • Veeam',
    'sicurezza-informatica': 'Partner: WatchGuard • Microsoft • Veeam',
    'cloud-storage': 'Partner: Microsoft • Veeam • Wasabi',
}

HERO_BTN_CLASS = {
    'assistenza-it': 'btn-primary',
    'sicurezza-informatica': 'btn-warning text-dark fw-bold',
    'cloud-storage': 'btn-info text-dark fw-bold',
}

COLOR = {
    'assistenza-it': 'primary',
    'sicurezza-informatica': 'warning',
    'cloud-storage': 'info',
}


def read_preview():
    rows = []
    with PREVIEW_CSV.open('r', encoding='utf-8') as f:
        r = csv.DictReader(f)
        for row in r:
            rows.append({'comune': row.get('comune',''), 'provincia': row.get('provincia',''), 'slug': row.get('slug','')})
    return rows


def read_master_map():
    m = {}
    try:
        with MASTER_CSV.open('r', encoding='utf-8') as f:
            r = csv.DictReader(f)
            for row in r:
                key = (row.get('slug_comune') or '', row.get('servizio_slug') or '')
                m[key] = {
                    'comune': row.get('comune',''),
                    'provincia': row.get('provincia',''),
                    'slug': row.get('slug_comune',''),
                    'servizio': row.get('servizio_slug',''),
                }
    except FileNotFoundError:
        pass
    return m


def expected_set(preview_rows):
    exp_map = {}
    for r in preview_rows:
        slug = r['slug']
        for s in SERVIZI:
            name = f"{s}-{slug}"
            # dedup per basename (set atteso unico)
            exp_map[name] = {'basename': name, 'servizio': s, 'slug': slug, 'provincia': r['provincia'], 'comune': r['comune']}
    return list(exp_map.values())


def ensure_media(servizio: str, slug: str, comune: str):
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)
    svg_path = MEDIA_DIR / f"it-{servizio}-{slug}-hero.svg"
    created = False
    if not svg_path.exists():
        created = True
        svg = f'''<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="#0d6efd"/>
  <g fill="#fff">
    <text x="60" y="180" font-size="64" font-weight="700">{escape(SERVIZI_LABEL.get(servizio, servizio))}</text>
    <text x="60" y="260" font-size="42">{escape(comune)} · Lombardia</text>
    <text x="60" y="340" font-size="24">IT-ERA Bulltech Informatica</text>
    <circle cx="1100" cy="90" r="36" fill="#fff"/>
  </g>
</svg>'''
        svg_path.write_text(svg, encoding='utf-8')
    return svg_path, created


def kpi_block(servizio: str):
    items = []
    color = 'text-primary' if servizio=='assistenza-it' else ('text-warning' if servizio=='sicurezza-informatica' else 'text-info')
    for v, lbl in KPI[servizio]:
        items.append(f'<div class="col-6 col-md-3 text-center"><div class="h4 fw-bold {color}">{v}</div><small>{lbl}</small></div>')
    return "\n            ".join(items)


def faq_block(servizio: str, citta: str):
    it = []
    for q,a in FAQ_DEFAULT[servizio]:
        it.append(f'<div class="accordion-item"><h2 class="accordion-header"><button class="accordion-button collapsed" type="button" data-bs-toggle="collapse">{escape(q.format(CITTA=citta))}</button></h2><div class="accordion-collapse collapse"><div class="accordion-body">{escape(a)}</div></div></div>')
    return "\n        ".join(it)


def json_ld_blocks(servizio: str, comune: str, canonical_path: str, og_image: str):
    service_label = SERVIZI_LABEL.get(servizio, servizio)
    lb = {
        "@context":"https://schema.org","@type":"LocalBusiness","name":"IT-ERA Bulltech Informatica",
        "image": og_image,
        "@id": f"{BASE_URL}{canonical_path}",
        "url": f"{BASE_URL}/",
        "telephone": "+39 039 888 2041",
        "email": "info@it-era.it",
        "address": {"@type":"PostalAddress","addressLocality": comune, "addressRegion":"Lombardia","addressCountry":"IT"},
        "areaServed": ["Lombardia", "Brianza"],
        "openingHours": ["Mo-Fr 09:00-18:00"],
        "priceRange": "€€",
        "serviceType": service_label,
        "description": f"{service_label} per PMI a {comune}"
    }
    svc = {
        "@context":"https://schema.org","@type":"Service","name": f"{service_label} {comune}",
        "provider": {"@type":"Organization","name":"IT-ERA Bulltech Informatica","telephone":"+39 039 888 2041"},
        "serviceType": service_label
    }
    faq = {"@context":"https://schema.org","@type":"FAQPage","mainEntity": [
        {"@type":"Question","name": f"FAQ 1 {service_label}","acceptedAnswer": {"@type":"Answer","text": "Risposta 1"}},
        {"@type":"Question","name": f"FAQ 2 {service_label}","acceptedAnswer": {"@type":"Answer","text": "Risposta 2"}}
    ]}
    br = {"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
        {"@type":"ListItem","position":1,"name":"Home","item": f"{BASE_URL}/"},
        {"@type":"ListItem","position":2,"name": service_label, "item": f"{BASE_URL}/pages/{servizio}.html"},
        {"@type":"ListItem","position":3,"name": f"{service_label} {comune}", "item": f"{BASE_URL}{canonical_path}"}
    ]}
    return lb, svc, faq, br


def build_html(servizio: str, slug: str, comune: str, provincia: str):
    service_label = SERVIZI_LABEL.get(servizio, servizio)
    title = f"{service_label} {comune} | IT-ERA"
    meta_desc = f"{service_label} per PMI a {comune}: soluzioni professionali e supporto dedicato. Preventivo gratuito."
    canonical_path = f"/pages/{servizio}-{slug}.html"
    og_image_path, _ = ensure_media(servizio, slug, comune)
    og_image = f"{BASE_URL}/static/images/{og_image_path.name}"
    h1 = f"{service_label} per PMI a {comune}"

    lb, svc, faq, br = json_ld_blocks(servizio, comune, canonical_path, og_image)

    html = f"""<!DOCTYPE html>
<html lang=\"it\">
<head>
  <meta charset=\"UTF-8\">
  <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
  <title>{escape(title)}</title>
  <meta name=\"description\" content=\"{escape(meta_desc)}\">
  <meta name=\"robots\" content=\"noindex,follow\">
  <link rel=\"canonical\" href=\"{escape(canonical_path)}\">
  <meta property=\"og:title\" content=\"{escape(title)}\">
  <meta property=\"og:description\" content=\"{escape(meta_desc)}\">
  <meta property=\"og:type\" content=\"website\">
  <meta property=\"og:url\" content=\"{escape(canonical_path)}\">
  <meta property=\"og:image\" content=\"{og_image}\">
  <meta name=\"twitter:card\" content=\"summary_large_image\">
  <link href=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css\" rel=\"stylesheet\">
  <link rel=\"stylesheet\" href=\"https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css\">
  <script type=\"application/ld+json\">{json.dumps(lb, ensure_ascii=False)}</script>
  <script type=\"application/ld+json\">{json.dumps(br, ensure_ascii=False)}</script>
  <script type=\"application/ld+json\">{json.dumps({"@context":"https://schema.org","@type":"FAQPage","mainEntity": faq['mainEntity']}, ensure_ascii=False)}</script>
  <script type=\"application/ld+json\">{json.dumps(svc, ensure_ascii=False)}</script>
</head>
<body>
  <nav class=\"navbar navbar-expand-lg navbar-dark bg-dark sticky-top\">
    <div class=\"container\">
      <a class=\"navbar-brand fw-bold\" href=\"/\"><i class=\"fas fa-microchip me-2\"></i>IT-ERA Bulltech</a>
    </div>
  </nav>
  <section class=\"bg-dark text-white py-5\">
    <div class=\"container\">
      <h1 class=\"display-5 fw-bold mb-3\">{escape(h1)}</h1>
      <p class=\"lead mb-4\">{escape(meta_desc)}</p>
      <div class=\"row g-3 mb-4\">
        {kpi_block(servizio)}
      </div>
      <div class=\"d-flex flex-wrap gap-2\">
        <a href=\"#preventivo\" class=\"btn {HERO_BTN_CLASS[servizio]} btn-lg\"><i class=\"fas fa-calculator me-2\"></i>Richiedi preventivo</a>
        <a href=\"tel:+390398882041\" class=\"btn btn-outline-light btn-lg\"><i class=\"fas fa-headset me-2\"></i>Parla con un tecnico</a>
      </div>
      <div class=\"text-white-50 small mt-3\">{escape(PARTNER[servizio])}</div>
    </div>
  </section>
  <section class=\"py-5\">
    <div class=\"container\">
      <h2 class=\"fw-bold h3 text-center mb-4\">Comuni vicini</h2>
      <div class=\"text-center\">
        <!-- placeholder: verrà arricchito dal generatore principale; manteniamo max 6 link ai draft -->
        <a class=\"btn btn-outline-secondary btn-sm m-1\" href=\"/pages-draft/{servizio}-{slug}.v3.html\">{escape(service_label)} {escape(comune)}</a>
      </div>
    </div>
  </section>
  <section class=\"py-5 bg-light\" id=\"preventivo\">
    <div class=\"container\">
      <div class=\"card border-{COLOR[servizio]}\">
        <div class=\"card-body d-flex flex-column flex-md-row align-items-md-center justify-content-between\">
          <div>
            <h3 class=\"h5 fw-bold mb-1\">Assessment gratuito</h3>
            <p class=\"text-muted mb-0\">Analisi rapida per la tua PMI di {escape(comune)}</p>
          </div>
          <a href=\"/pages/assessment.html\" class=\"btn btn-{COLOR[servizio]} mt-3 mt-md-0{(' text-dark fw-bold' if servizio!='assistenza-it' else '')}\"><i class=\"fas fa-paper-plane me-2\"></i>Richiedi ora</a>
        </div>
      </div>
    </div>
  </section>
  <script src=\"https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js\"></script>
</body>
</html>
"""
    return html


def update_incomplete(path: Path, servizio: str, slug: str, comune: str):
    try:
        from bs4 import BeautifulSoup  # type: ignore
    except Exception:
        return False, []
    changed = False
    notes = []
    html = path.read_text(encoding='utf-8', errors='replace')
    soup = BeautifulSoup(html, 'html.parser')

    head = soup.head or soup.new_tag('head')
    if not soup.head:
        soup.html.insert(0, head)

    # ensure media and og:image
    svg_path, svg_created = ensure_media(servizio, slug, comune)
    if svg_created:
        notes.append('hero_svg_created')
    og_url = f"{BASE_URL}/static/images/{svg_path.name}"
    meta_og = head.find('meta', attrs={'property': 'og:image'})
    if not meta_og:
        tag = soup.new_tag('meta')
        tag['property'] = 'og:image'
        tag['content'] = og_url
        head.append(tag)
        changed = True
        notes.append('og_image_added')
    elif meta_og.get('content') != og_url:
        meta_og['content'] = og_url
        changed = True
        notes.append('og_image_updated')

    # canonical
    canonical_expected = f"/pages/{servizio}-{slug}.html"
    link_can = head.find('link', attrs={'rel': 'canonical'})
    if not link_can:
        tag = soup.new_tag('link')
        tag['rel'] = 'canonical'
        tag['href'] = canonical_expected
        head.append(tag)
        changed = True
        notes.append('canonical_added')
    else:
        href = link_can.get('href','')
        # strip domain to compare path
        m = re.search(r"https?://[^/]+(/.*)$", href)
        path_only = m.group(1) if m else href
        if path_only != canonical_expected:
            link_can['href'] = canonical_expected
            changed = True
            notes.append('canonical_updated')

    # robots
    meta_robots = head.find('meta', attrs={'name': 'robots'})
    if not meta_robots:
        t = soup.new_tag('meta')
        t['name'] = 'robots'
        t['content'] = 'noindex,follow'
        head.append(t)
        changed = True
        notes.append('robots_added')
    elif (meta_robots.get('content') or '').lower() != 'noindex,follow':
        meta_robots['content'] = 'noindex,follow'
        changed = True
        notes.append('robots_updated')

    # JSON-LD blocks ensure minimal presence
    ld_blocks = head.find_all('script', attrs={'type': 'application/ld+json'})
    types_present = set()
    for tag in ld_blocks:
        try:
            data = json.loads(tag.string or tag.get_text() or '{}')
            if isinstance(data, dict):
                t = (data.get('@type') or '').lower()
                if t:
                    types_present.add(t)
        except Exception:
            continue

    def append_ld(obj, label):
        nonlocal changed
        s = soup.new_tag('script')
        s['type'] = 'application/ld+json'
        s.string = json.dumps(obj, ensure_ascii=False)
        head.append(s)
        changed = True
        notes.append(f'ld_{label}_added')

    lb, svc, faq, br = json_ld_blocks(servizio, comune, canonical_expected, og_url)
    if 'localbusiness' not in types_present:
        append_ld(lb, 'localbusiness')
    if 'breadcrumblist' not in types_present:
        append_ld(br, 'breadcrumb')
    if 'faqpage' not in types_present:
        append_ld(faq, 'faq')
    if 'service' not in types_present:
        append_ld(svc, 'service')

    # ensure Breadcrumb has >=3 items if present but short
    for tag in head.find_all('script', attrs={'type': 'application/ld+json'}):
        try:
            data = json.loads(tag.string or tag.get_text() or '{}')
            if isinstance(data, dict) and (data.get('@type','').lower() == 'breadcrumblist'):
                items = data.get('itemListElement') or []
                if not isinstance(items, list) or len(items) < 3:
                    tag.string = json.dumps(br, ensure_ascii=False)
                    changed = True
                    notes.append('breadcrumb_fixed')
        except Exception:
            continue

    # Alt text for hero <img> if present
    hero_src = f"/static/images/it-{servizio}-{slug}-hero.svg"
    imgs = soup.find_all('img')
    for img in imgs:
        src = img.get('src','')
        if hero_src in src:
            desired_alt = f"{SERVIZI_LABEL.get(servizio, servizio)} per PMI a {comune}"
            if (img.get('alt') or '').strip() != desired_alt:
                img['alt'] = desired_alt
                changed = True
                notes.append('img_alt_updated')

    if changed:
        path.write_text(str(soup), encoding='utf-8')
    return changed, notes


def main():
    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    DRAFT_DIR.mkdir(parents=True, exist_ok=True)
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    preview_rows = read_preview()
    master_map = read_master_map()

    expected = expected_set(preview_rows)
    expected_set_names = {f"{i['basename']}.v3.html" for i in expected}
    existing = {p.name for p in DRAFT_DIR.glob('*.v3.html')}

    created = 0
    updated = 0
    unchanged = 0
    media_generated = 0
    warnings = []
    modified_examples = []

    # Create missing files
    for item in expected:
        basename = item['basename']
        servizio = item['servizio']
        slug = item['slug']
        comune = item['comune'] or master_map.get((slug, servizio),{}).get('comune','')
        provincia = item['provincia'] or master_map.get((slug, servizio),{}).get('provincia','')
        if not comune:
            # fallback prettified from slug
            comune = slug.replace('-', ' ').title()
        file_name = f"{basename}.v3.html"
        out_path = DRAFT_DIR / file_name
        if file_name not in existing:
            html = build_html(servizio, slug, comune, provincia)
            out_path.write_text(html, encoding='utf-8')
            created += 1
            # media already ensured by build_html
            if (MEDIA_DIR / f"it-{servizio}-{slug}-hero.svg").exists():
                media_generated += 1
        else:
            # fix incomplete aspects
            chg, notes = update_incomplete(out_path, servizio, slug, comune)
            if chg:
                updated += 1
                if len(modified_examples) < 10:
                    modified_examples.append({'file': str(out_path.relative_to(BASE)), 'changes': notes})
            else:
                unchanged += 1
            # ensure media present regardless
            _, made = ensure_media(servizio, slug, comune)
            if made:
                media_generated += 1

    # Any extraneous files not in expected? we ignore (no purge)

    missing_after = len(expected_set_names - existing) - created
    if missing_after < 0:
        missing_after = 0

    report = {
        'created': created,
        'updated': updated,
        'unchanged': unchanged,
        'missing_after': missing_after,
        'media_generated': media_generated,
        'warnings': warnings,
        'expected_total': len(expected_set_names),
        'draft_count_now': len(list(DRAFT_DIR.glob('*.v3.html'))),
        'modified_examples': modified_examples,
    }
    (REPORT_DIR / 'reconcile_fix_v3.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

    print('=== RECONCILE & FIX DRAFT V3 ===')
    print(json.dumps(report, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    sys.exit(main())

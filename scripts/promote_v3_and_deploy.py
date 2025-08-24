#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Promote V3 drafts to production and deploy
Steps:
1) Promote all web/pages-draft/*.v3.html to web/pages/<basename>.html with robots index,follow
   - Soft-validate required tags and log warnings
2) Generate sitemap (preview -> final) including all /pages/*.html
3) Attempt deploy (git push on main). If unavailable, record warning.
4) Write final report web/reports/promote_v3_deploy.json and print quick links
Gate: do not touch /pages-draft files and do not purge extra files.
"""
import sys
import os
import re
import json
import hashlib
from pathlib import Path
from datetime import datetime, timezone

try:
    from bs4 import BeautifulSoup  # type: ignore
except Exception:
    BeautifulSoup = None

BASE = Path(__file__).resolve().parents[1]
DRAFT_DIR = BASE / 'web/pages-draft'
PROD_DIR = BASE / 'web/pages'
REPORT_DIR = BASE / 'web/reports'
SITEMAP_PREVIEW = BASE / 'web/sitemap.preview.xml'
SITEMAP = BASE / 'web/sitemap.xml'
BASE_URL = 'https://it-era.pages.dev'

REQUIRED_LD_TYPES = ['LocalBusiness','Service','FAQPage','BreadcrumbList']


def sha1_file(path: Path) -> str:
    h = hashlib.sha1()
    with path.open('rb') as f:
        for chunk in iter(lambda: f.read(8192), b''):
            h.update(chunk)
    return h.hexdigest()


def promote_one(draft_path: Path, prod_path: Path, warnings: list):
    html = draft_path.read_text(encoding='utf-8', errors='replace')
    soup = BeautifulSoup(html, 'html.parser') if BeautifulSoup else None

    # Replace robots noindex->index (or add if missing)
    out_html = html
    replaced = False
    if soup:
        meta_robots = soup.find('meta', attrs={'name': 'robots'})
        if meta_robots:
            content = (meta_robots.get('content') or '').lower()
            if content != 'index,follow':
                meta_robots['content'] = 'index,follow'
                replaced = True
        else:
            # add robots meta
            head = soup.head or soup.new_tag('head')
            if not soup.head and soup.html:
                soup.html.insert(0, head)
            tag = soup.new_tag('meta')
            tag['name'] = 'robots'
            tag['content'] = 'index,follow'
            head.append(tag)
            replaced = True
        if replaced:
            out_html = str(soup)
    else:
        out_html = re.sub(r'<meta[^>]*name=["\"]robots["\"][^>]*content=["\"][^"\"]*["\"][^>]*>', '<meta name="robots" content="index,follow">', html, flags=re.IGNORECASE)
        if out_html != html:
            replaced = True
        if not replaced:
            # if none existed, inject into head
            out_html = re.sub(r'<head(\s[^>]*)?>', r'<head\1>\n  <meta name="robots" content="index,follow">', out_html, count=1, flags=re.IGNORECASE)

    prod_path.parent.mkdir(parents=True, exist_ok=True)
    prod_path.write_text(out_html, encoding='utf-8')

    # Soft validations
    if soup is None:
        return
    s = BeautifulSoup(out_html, 'html.parser')
    title = s.find('title').get_text(strip=True) if s.find('title') else ''
    if not title:
        warnings.append(f"{prod_path.name}: WARNING title mancante")
    h1s = s.find_all('h1')
    if len(h1s) != 1:
        warnings.append(f"{prod_path.name}: WARNING h1 count={len(h1s)}")
    meta_desc = s.find('meta', attrs={'name':'description'})
    if not meta_desc or not (meta_desc.get('content') or '').strip():
        warnings.append(f"{prod_path.name}: WARNING meta description mancante")
    canonical = s.find('link', attrs={'rel':'canonical'})
    if not canonical or not (canonical.get('href') or '').strip():
        warnings.append(f"{prod_path.name}: WARNING canonical mancante")
    # JSON-LD presence for minimal types
    ld_types = set()
    for tag in s.find_all('script', attrs={'type':'application/ld+json'}):
        try:
            data = json.loads(tag.string or tag.get_text() or '{}')
            t = (data.get('@type') or '').lower() if isinstance(data, dict) else ''
            if t:
                ld_types.add(t)
        except Exception:
            continue
    for t in REQUIRED_LD_TYPES:
        if t.lower() not in ld_types:
            warnings.append(f"{prod_path.name}: WARNING JSON-LD {t} assente")
    og_img = s.find('meta', attrs={'property':'og:image'})
    if not og_img or not (og_img.get('content') or '').strip():
        warnings.append(f"{prod_path.name}: WARNING og:image mancante")


def generate_sitemap():
    pages = sorted(PROD_DIR.glob('*.html'))
    now = datetime.now(timezone.utc).strftime('%Y-%m-%d')
    items = []
    for p in pages:
        loc = f"{BASE_URL}/pages/{p.name}"
        # validate local path exists
        if not p.exists():
            continue
        items.append((loc, datetime.fromtimestamp(p.stat().st_mtime).strftime('%Y-%m-%d')))
    xml = [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'
    ]
    for loc, lastmod in items:
        xml.extend([
            '  <url>',
            f'    <loc>{loc}</loc>',
            f'    <lastmod>{lastmod}</lastmod>',
            '  </url>'
        ])
    xml.append('</urlset>')
    SITEMAP_PREVIEW.write_text('\n'.join(xml), encoding='utf-8')
    # rename to sitemap.xml
    if SITEMAP.exists():
        SITEMAP.unlink()
    SITEMAP_PREVIEW.rename(SITEMAP)
    return items


def try_deploy():
    result = {
        'method': None,
        'status': 'skipped',
        'message': ''
    }
    # prefer git push on main
    try:
        import subprocess
        def run(cmd):
            return subprocess.run(cmd, cwd=str(BASE), text=True, capture_output=True)
        # Check git repo
        r = run(['git', 'rev-parse', '--is-inside-work-tree'])
        if r.returncode == 0 and 'true' in r.stdout.strip():
            # Stage changes
            run(['git', 'add', 'web/pages', 'web/sitemap.xml', 'web/reports/promote_v3_deploy.json'])
            # Commit (allow empty to avoid failure?)
            commit = run(['git', '-c', 'user.name=IT-ERA Bot', '-c', 'user.email=bot@it-era.local', 'commit', '-m', 'Promote V3 drafts to production pages and sitemap'])
            # Determine branch
            br = run(['git', 'rev-parse', '--abbrev-ref', 'HEAD']).stdout.strip()
            push = run(['git', 'push', 'origin', br])
            if push.returncode == 0:
                result.update({'method':'git', 'status':'ok', 'message': f'pushed to {br}'})
            else:
                result.update({'method':'git', 'status':'warning', 'message': f'push failed: {push.stderr[:400]}'})
        else:
            result.update({'status':'warning', 'message':'not a git repo; deploy skipped'})
    except Exception as e:
        result.update({'status':'warning', 'message': f'deploy error: {e}'})
    return result


def main():
    if BeautifulSoup is None:
        print('Errore: BeautifulSoup (bs4) non è installato. Installa con: pip install beautifulsoup4', file=sys.stderr)
        return 2

    REPORT_DIR.mkdir(parents=True, exist_ok=True)
    PROD_DIR.mkdir(parents=True, exist_ok=True)

    drafts = sorted(DRAFT_DIR.glob('*.v3.html'))
    published = 0
    warnings = []

    for d in drafts:
        fname = d.name.replace('.v3.html', '.html')
        prod_path = PROD_DIR / fname
        promote_one(d, prod_path, warnings)
        published += 1
        if published % 100 == 0:
            print(f"[promote] Pubblicate {published}/{len(drafts)}")

    urls = generate_sitemap()
    sitemap_sha1 = sha1_file(SITEMAP)

    # Attempt deploy
    deploy_info = try_deploy()

    # Build report
    ts = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    sample_urls = [f"{BASE_URL}/pages/{(PROD_DIR / (d.name.replace('.v3.html','.html'))).name}" for d in drafts[:25]]
    report = {
        'timestamp': ts,
        'published_pages': published,
        'sample_first_25_urls': sample_urls,
        'sitemap_checksum_sha1': sitemap_sha1,
        'deploy': deploy_info,
        'warnings': warnings,
    }
    (REPORT_DIR / 'promote_v3_deploy.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')

    print('\n=== PROMOTE V3 & DEPLOY ===')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    # Output rapido richiesto
    print('\nLink rapidi:')
    print('https://it-era.pages.dev/pages/assistenza-it-lecco.html')
    print('https://it-era.pages.dev/pages/assistenza-it-milano.html')
    print('https://it-era.pages.dev/pages/sicurezza-informatica-lecco.html')
    print('https://it-era.pages.dev/pages/cloud-storage-lecco.html')
    print('https://it-era.pages.dev/sitemap.xml')

    # Exit code: always 0 (soft-fail warnings only)
    return 0


if __name__ == '__main__':
    sys.exit(main())

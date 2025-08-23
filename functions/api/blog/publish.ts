export interface Env {
  BLOG_API_KEY: string;
  GITHUB_TOKEN: string;
  GITHUB_OWNER: string;
  GITHUB_REPO: string;
  GITHUB_BRANCH?: string; // default: main
  SITE_BASE_URL?: string; // default: https://it-era.pages.dev
  BLOG_DIR?: string;      // default: web/pages/blog
  SITEMAP_PATH?: string;  // default: web/sitemap.xml
}

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

function htmlTemplate(params: {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  canonical: string;
  schemaJson: string;
  contentHtml: string;
  gaId?: string;
  coverUrl?: string;
}) {
  const { metaTitle, metaDescription, metaKeywords, canonical, schemaJson, contentHtml, gaId = '', coverUrl = '' } = params;
  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${metaTitle}</title>
  <meta name="description" content="${metaDescription}" />
  <meta name="keywords" content="${metaKeywords}" />
  <link rel="canonical" href="${canonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${metaTitle}" />
  <meta property="og:description" content="${metaDescription}" />
  <meta property="og:url" content="${canonical}" />
  <meta property="og:image" content="${coverUrl}" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${metaTitle}" />
  <meta name="twitter:description" content="${metaDescription}" />
  <meta name="twitter:image" content="${coverUrl}" />
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
  <link rel="preconnect" href="https://www.google-analytics.com" crossorigin>
  <script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);} 
    gtag('js', new Date());
    gtag('config', '${gaId}', { 'anonymize_ip': true });
  </script>
  <script type="application/ld+json">${schemaJson}</script>
  <script defer src="/static/js/tracking.js"></script>
  <style>body{font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;line-height:1.6;color:#0f172a}.container{max-width:1100px;margin:0 auto;padding:24px}article img{max-width:100%;height:auto}</style>
</head>
<body>
  <main id="content" class="container">${contentHtml}</main>
</body>
</html>`;
}

async function githubGetContent(env: Env, path: string, branch: string) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodeURIComponent(path)}?ref=${encodeURIComponent(branch)}`;
  const res = await fetch(url, {
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
    },
  });
  if (res.status === 404) return { exists: false } as const;
  if (!res.ok) throw new Error(`GitHub GET failed: ${res.status}`);
  const data = await res.json<any>();
  return { exists: true, sha: data.sha as string, content: data.content as string } as const;
}

async function githubPutContent(env: Env, path: string, branch: string, message: string, contentBase64: string, sha?: string) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodeURIComponent(path)}`;
  const body: any = { message, content: contentBase64, branch };
  if (sha) body.sha = sha;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Accept': 'application/vnd.github+json',
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const t = await res.text();
    throw new Error(`GitHub PUT failed: ${res.status} ${t}`);
  }
}

function ensureString(v: any) { return typeof v === 'string' ? v : (v == null ? '' : JSON.stringify(v)); }

function buildKeywords(meta: any): string {
  if (!meta) return '';
  if (Array.isArray(meta.keywords)) return meta.keywords.join(', ');
  return ensureString(meta.keywords || '');
}

function upsertInSitemap(xml: string, locUrl: string, lastmod: string): string {
  const entry = `  <url>\n    <loc>${locUrl}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
  if (!xml.trim()) {
    return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entry}</urlset>\n`;
  }
  const marker = `<loc>${locUrl}</loc>`;
  const closeTag = '</urlset>';
  if (xml.includes(marker)) {
    const locPos = xml.indexOf(marker);
    const open = xml.indexOf('<lastmod>', locPos);
    const close = xml.indexOf('</lastmod>', locPos);
    if (open !== -1 && close !== -1 && close > open) {
      const before = xml.slice(0, open + '<lastmod>'.length);
      const after = xml.slice(close);
      return before + lastmod + after;
    } else {
      const urlClose = xml.indexOf('</url>', locPos);
      if (urlClose !== -1) {
        const before = xml.slice(0, urlClose);
        const after = xml.slice(urlClose);
        return before + `\n    <lastmod>${lastmod}</lastmod>` + after;
      }
    }
    return xml; // fallback: leave as is
  }
  const pos = xml.lastIndexOf(closeTag);
  if (pos !== -1) return xml.slice(0, pos) + entry + xml.slice(pos);
  return xml + entry;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    try {
      if (request.method !== 'POST') {
        return jsonResponse({ error: 'Method not allowed' }, 405);
      }
      const auth = request.headers.get('authorization') || '';
      const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length) : '';
      if (!env.BLOG_API_KEY || token !== env.BLOG_API_KEY) {
        return jsonResponse({ error: 'Unauthorized' }, 401);
      }

      const body = await request.json<any>().catch(() => null);
      if (!body) return jsonResponse({ error: 'Invalid JSON' }, 400);

      // Validate required fields
      const required = ['title', 'slug', 'content_html', 'meta'];
      for (const k of required) if (!body[k]) return jsonResponse({ error: `Missing field: ${k}` }, 400);
      if (!body.meta.title || !body.meta.description) return jsonResponse({ error: 'Missing meta.title or meta.description' }, 400);

      const branch = env.GITHUB_BRANCH || 'main';
      const blogDir = env.BLOG_DIR || 'web/pages/blog';
      const sitemapPath = env.SITEMAP_PATH || 'web/sitemap.xml';
      const baseUrl = env.SITE_BASE_URL || 'https://it-era.pages.dev';

      const canonical = ensureString(body.canonical || `${baseUrl}/pages/blog/${body.slug}.html`);
      const keywords = buildKeywords(body.meta);
      const schemaJson = typeof body.schema_jsonld === 'string' ? body.schema_jsonld : JSON.stringify(body.schema_jsonld || {}, null, 2);
      const html = htmlTemplate({
        metaTitle: ensureString(body.meta.title),
        metaDescription: ensureString(body.meta.description),
        metaKeywords: keywords,
        canonical,
        schemaJson,
        contentHtml: ensureString(body.content_html),
        gaId: ensureString(body.GA_MEASUREMENT_ID || ''),
        coverUrl: ensureString(body.cover?.url || ''),
      });

      const path = `${blogDir}/${body.slug}.html`;
      const commitMessage = ensureString(body.commit_message || `feat(blog): publish ${body.slug}`);
      const contentBase64 = btoa(unescape(encodeURIComponent(html)));

      // Get SHA if exists
      const getRes = await githubGetContent(env, path, branch);
      await githubPutContent(env, path, branch, commitMessage, contentBase64, getRes.exists ? getRes.sha : undefined);

      // Optional: sitemap update
      const today = new Date().toISOString().slice(0, 10);
      const smGet = await githubGetContent(env, sitemapPath, branch);
      let smXml = '';
      let smSha: string | undefined;
      if (smGet.exists && smGet.content) {
        try {
          smXml = decodeURIComponent(escape(atob(smGet.content)));
          smSha = smGet.sha;
        } catch { smXml = ''; }
      }
      const updated = upsertInSitemap(smXml, canonical, today);
      const smB64 = btoa(unescape(encodeURIComponent(updated)));
      await githubPutContent(env, sitemapPath, branch, `chore(sitemap): add/update ${body.slug}`, smB64, smSha);

      return jsonResponse({ status: 'ok', url: canonical }, 201);
    } catch (err: any) {
      return jsonResponse({ error: err?.message || 'Internal error' }, 500);
    }
  }
};


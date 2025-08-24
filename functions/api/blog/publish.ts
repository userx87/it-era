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

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
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
  
  // Escape user input for HTML attributes to prevent XSS
  const safeTitle = escapeHtml(metaTitle);
  const safeDescription = escapeHtml(metaDescription);
  const safeKeywords = escapeHtml(metaKeywords);
  const safeCanonical = escapeHtml(canonical);
  const safeCoverUrl = escapeHtml(coverUrl);
  const safeGaId = escapeHtml(gaId);
  
  // Only include GA script if gaId is provided and valid
  const gaScript = gaId && gaId.trim() ? `
  <link rel="preconnect" href="https://www.googletagmanager.com" crossorigin>
  <link rel="preconnect" href="https://www.google-analytics.com" crossorigin>
  <script async src="https://www.googletagmanager.com/gtag/js?id=${safeGaId}"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);} 
    gtag('js', new Date());
    gtag('config', '${safeGaId}', { 'anonymize_ip': true });
  </script>` : '';

  return `<!doctype html>
<html lang="it">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${safeTitle}</title>
  <meta name="description" content="${safeDescription}" />
  <meta name="keywords" content="${safeKeywords}" />
  <link rel="canonical" href="${safeCanonical}" />
  <meta property="og:type" content="article" />
  <meta property="og:title" content="${safeTitle}" />
  <meta property="og:description" content="${safeDescription}" />
  <meta property="og:url" content="${safeCanonical}" />
  ${safeCoverUrl ? `<meta property="og:image" content="${safeCoverUrl}" />` : ''}
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="${safeTitle}" />
  <meta name="twitter:description" content="${safeDescription}" />
  ${safeCoverUrl ? `<meta name="twitter:image" content="${safeCoverUrl}" />` : ''}${gaScript}
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
  
  try {
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'User-Agent': 'IT-ERA-Blog-Publisher/1.0',
      },
    });
    
    if (res.status === 404) return { exists: false } as const;
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new Error(`GitHub GET failed: ${res.status} ${res.statusText}. ${errorText}`);
    }
    
    const data = await res.json<any>();
    
    if (!data.sha || !data.content) {
      throw new Error('Invalid response from GitHub API: missing sha or content');
    }
    
    return { exists: true, sha: data.sha as string, content: data.content as string } as const;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`GitHub API request failed: ${error.message}`);
    }
    throw new Error('GitHub API request failed with unknown error');
  }
}

async function githubPutContent(env: Env, path: string, branch: string, message: string, contentBase64: string, sha?: string) {
  const url = `https://api.github.com/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}/contents/${encodeURIComponent(path)}`;
  const body: any = { 
    message: message.trim() || 'Update content', 
    content: contentBase64, 
    branch 
  };
  
  if (sha) body.sha = sha;
  
  try {
    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        'Accept': 'application/vnd.github+json',
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
        'User-Agent': 'IT-ERA-Blog-Publisher/1.0',
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const errorText = await res.text().catch(() => 'Unknown error');
      throw new Error(`GitHub PUT failed: ${res.status} ${res.statusText}. ${errorText}`);
    }
    
    // Return the response data for potential future use
    return await res.json().catch(() => null);
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`GitHub PUT request failed: ${error.message}`);
    }
    throw new Error('GitHub PUT request failed with unknown error');
  }
}

function ensureString(v: any): string { 
  if (typeof v === 'string') return v;
  if (v == null) return '';
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  try {
    return JSON.stringify(v);
  } catch {
    return String(v);
  }
}

function isValidSlug(slug: string): boolean {
  // Allow only alphanumeric, hyphens, underscores, and dots
  return /^[a-zA-Z0-9._-]+$/.test(slug) && slug.length > 0 && slug.length <= 200;
}

function sanitizeJsonLD(jsonld: any): string {
  try {
    // Parse and re-stringify to ensure valid JSON
    const parsed = typeof jsonld === 'string' ? JSON.parse(jsonld) : jsonld;
    return JSON.stringify(parsed, null, 2);
  } catch {
    return JSON.stringify({}, null, 2);
  }
}

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

export async function onRequestPost({ request, env }: { request: Request; env: Env }): Promise<Response> {
  try {
    // Only POST is allowed for this route
    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Validate environment variables
    if (!env.BLOG_API_KEY || !env.GITHUB_TOKEN || !env.GITHUB_OWNER || !env.GITHUB_REPO) {
      console.error('Missing required environment variables');
      return jsonResponse({ error: 'Server configuration error' }, 500);
    }

    // AuthZ via BLOG_API_KEY in Authorization: Bearer
    const auth = request.headers.get('authorization') || '';
    const token = auth.startsWith('Bearer ') ? auth.slice('Bearer '.length).trim() : '';
    if (!token || token !== env.BLOG_API_KEY) {
      return jsonResponse({ error: 'Unauthorized' }, 401);
    }

    // Parse and validate JSON body
    let body: any;
    try {
      body = await request.json();
    } catch (error) {
      return jsonResponse({ error: 'Invalid JSON body' }, 400);
    }

    if (!body || typeof body !== 'object') {
      return jsonResponse({ error: 'Invalid request body' }, 400);
    }

    // Validate required fields
    const required = ['title', 'slug', 'content_html', 'meta'];
    for (const k of required) {
      if (!body[k]) {
        return jsonResponse({ error: `Missing required field: ${k}` }, 400);
      }
    }

    // Validate meta object
    if (!body.meta || typeof body.meta !== 'object') {
      return jsonResponse({ error: 'Invalid meta object' }, 400);
    }

    if (!body.meta.title || !body.meta.description) {
      return jsonResponse({ error: 'Missing meta.title or meta.description' }, 400);
    }

    // Validate and sanitize slug
    const slug = ensureString(body.slug).trim();
    if (!isValidSlug(slug)) {
      return jsonResponse({ error: 'Invalid slug format. Use only alphanumeric characters, hyphens, underscores, and dots.' }, 400);
    }

    // Validate content length
    const contentHtml = ensureString(body.content_html);
    if (contentHtml.length === 0) {
      return jsonResponse({ error: 'Content HTML cannot be empty' }, 400);
    }

    if (contentHtml.length > 1000000) { // 1MB limit
      return jsonResponse({ error: 'Content HTML too large (max 1MB)' }, 413);
    }

    const branch = (env.GITHUB_BRANCH || 'main').trim();
    const blogDir = (env.BLOG_DIR || 'web/pages/blog').replace(/\/$/, ''); // Remove trailing slash
    const sitemapPath = (env.SITEMAP_PATH || 'web/sitemap.xml').trim();
    const baseUrl = (env.SITE_BASE_URL || 'https://it-era.pages.dev').replace(/\/$/, ''); // Remove trailing slash

    const canonical = ensureString(body.canonical || `${baseUrl}/pages/blog/${slug}.html`);
    const keywords = buildKeywords(body.meta);
    const schemaJson = sanitizeJsonLD(body.schema_jsonld || {});
    
    const html = htmlTemplate({
      metaTitle: ensureString(body.meta.title),
      metaDescription: ensureString(body.meta.description),
      metaKeywords: keywords,
      canonical,
      schemaJson,
      contentHtml,
      gaId: ensureString(body.GA_MEASUREMENT_ID || ''),
      coverUrl: ensureString(body.cover?.url || ''),
    });

    const path = `${blogDir}/${slug}.html`;
    const commitMessage = ensureString(body.commit_message || `feat(blog): publish ${slug}`);
    
    // Validate base64 encoding
    let contentBase64: string;
    try {
      contentBase64 = btoa(unescape(encodeURIComponent(html)));
    } catch (error) {
      console.error('Base64 encoding failed:', error);
      return jsonResponse({ error: 'Failed to encode content' }, 500);
    }

    // Get existing file SHA if it exists
    const getRes = await githubGetContent(env, path, branch);
    
    // Upload the blog post
    await githubPutContent(env, path, branch, commitMessage, contentBase64, getRes.exists ? getRes.sha : undefined);

    // Update sitemap
    try {
      const today = new Date().toISOString().slice(0, 10);
      const smGet = await githubGetContent(env, sitemapPath, branch);
      let smXml = '';
      let smSha: string | undefined;
      
      if (smGet.exists && smGet.content) {
        try {
          smXml = decodeURIComponent(escape(atob(smGet.content)));
          smSha = smGet.sha;
        } catch (error) {
          console.warn('Failed to decode existing sitemap:', error);
          smXml = '';
        }
      }
      
      const updated = upsertInSitemap(smXml, canonical, today);
      const smB64 = btoa(unescape(encodeURIComponent(updated)));
      await githubPutContent(env, sitemapPath, branch, `chore(sitemap): add/update ${slug}`, smB64, smSha);
    } catch (error) {
      console.warn('Sitemap update failed:', error);
      // Don't fail the entire request if sitemap update fails
    }

    return jsonResponse({ 
      status: 'success', 
      message: 'Blog post published successfully',
      url: canonical,
      slug: slug
    }, 201);

  } catch (err: any) {
    console.error('Blog publish error:', err);
    
    // Don't expose sensitive error details in production
    const errorMessage = err?.message?.includes('GitHub') 
      ? 'Failed to publish to repository'
      : err?.message || 'Internal server error';
      
    return jsonResponse({ 
      error: errorMessage,
      timestamp: new Date().toISOString()
    }, 500);
  }
}


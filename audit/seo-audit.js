#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

class SEOAuditor {
  constructor() {
    this.auditDir = path.join(__dirname, 'results');
    this.ensureAuditDir();
  }

  ensureAuditDir() {
    if (!fs.existsSync(this.auditDir)) {
      fs.mkdirSync(this.auditDir, { recursive: true });
    }
  }

  async auditSEO(url, pageName) {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage']
    });

    const page = await browser.newPage();

    try {
      console.log(`🔍 Auditing SEO for ${pageName}...`);

      await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

      // Extract SEO data
      const seoData = await page.evaluate(() => {
        const data = {};

        // Title tag
        data.title = {
          content: document.title || '',
          length: document.title ? document.title.length : 0,
          exists: !!document.title
        };

        // Meta description
        const metaDesc = document.querySelector('meta[name="description"]');
        data.metaDescription = {
          content: metaDesc ? metaDesc.content : '',
          length: metaDesc ? metaDesc.content.length : 0,
          exists: !!metaDesc
        };

        // Meta keywords (though not used by Google, still relevant for other engines)
        const metaKeywords = document.querySelector('meta[name="keywords"]');
        data.metaKeywords = {
          content: metaKeywords ? metaKeywords.content : '',
          exists: !!metaKeywords
        };

        // Canonical URL
        const canonical = document.querySelector('link[rel="canonical"]');
        data.canonical = {
          href: canonical ? canonical.href : '',
          exists: !!canonical
        };

        // Open Graph tags
        data.openGraph = {
          title: document.querySelector('meta[property="og:title"]')?.content || '',
          description: document.querySelector('meta[property="og:description"]')?.content || '',
          image: document.querySelector('meta[property="og:image"]')?.content || '',
          url: document.querySelector('meta[property="og:url"]')?.content || '',
          type: document.querySelector('meta[property="og:type"]')?.content || '',
          siteName: document.querySelector('meta[property="og:site_name"]')?.content || ''
        };

        // Twitter Card tags
        data.twitterCard = {
          card: document.querySelector('meta[name="twitter:card"]')?.content || '',
          site: document.querySelector('meta[name="twitter:site"]')?.content || '',
          creator: document.querySelector('meta[name="twitter:creator"]')?.content || '',
          title: document.querySelector('meta[name="twitter:title"]')?.content || '',
          description: document.querySelector('meta[name="twitter:description"]')?.content || '',
          image: document.querySelector('meta[name="twitter:image"]')?.content || ''
        };

        // Headings structure
        const h1 = document.querySelectorAll('h1');
        const h2 = document.querySelectorAll('h2');
        const h3 = document.querySelectorAll('h3');
        data.headings = {
          h1: {
            count: h1.length,
            text: Array.from(h1).map(h => h.textContent.trim())
          },
          h2: {
            count: h2.length,
            text: Array.from(h2).map(h => h.textContent.trim())
          },
          h3: {
            count: h3.length,
            text: Array.from(h3).map(h => h.textContent.trim())
          }
        };

        // Images
        const images = document.querySelectorAll('img');
        data.images = {
          total: images.length,
          withoutAlt: Array.from(images).filter(img => !img.alt).length,
          withEmptyAlt: Array.from(images).filter(img => img.alt === '').length,
          withAlt: Array.from(images).filter(img => img.alt && img.alt.trim() !== '').length
        };

        // Internal and external links
        const links = document.querySelectorAll('a[href]');
        const currentDomain = window.location.hostname;
        data.links = {
          total: links.length,
          internal: 0,
          external: 0,
          withoutTitle: 0,
          nofollow: 0
        };

        Array.from(links).forEach(link => {
          const href = link.getAttribute('href');
          if (href.startsWith('http')) {
            const linkDomain = new URL(href).hostname;
            if (linkDomain === currentDomain) {
              data.links.internal++;
            } else {
              data.links.external++;
            }
          } else if (href.startsWith('/') || !href.includes('://')) {
            data.links.internal++;
          }

          if (!link.getAttribute('title') && !link.textContent.trim()) {
            data.links.withoutTitle++;
          }

          if (link.getAttribute('rel')?.includes('nofollow')) {
            data.links.nofollow++;
          }
        });

        // Structured data (JSON-LD)
        const jsonLdScripts = document.querySelectorAll('script[type="application/ld+json"]');
        data.structuredData = {
          jsonLdCount: jsonLdScripts.length,
          schemas: Array.from(jsonLdScripts).map(script => {
            try {
              const parsed = JSON.parse(script.textContent);
              return {
                type: parsed['@type'] || 'Unknown',
                context: parsed['@context'] || 'Unknown'
              };
            } catch (e) {
              return { type: 'Invalid', error: e.message };
            }
          })
        };

        // Viewport meta tag
        const viewport = document.querySelector('meta[name="viewport"]');
        data.viewport = {
          content: viewport ? viewport.content : '',
          exists: !!viewport
        };

        // Language
        data.language = {
          htmlLang: document.documentElement.lang || '',
          hasLangAttribute: !!document.documentElement.lang
        };

        // Text content analysis
        const textContent = document.body.textContent || '';
        data.content = {
          wordCount: textContent.split(/\s+/).filter(word => word.length > 0).length,
          characterCount: textContent.length,
          textContentRatio: textContent.length / document.documentElement.outerHTML.length
        };

        return data;
      });

      // Check robots.txt and sitemap
      const robotsCheck = await this.checkRobots(url);
      const sitemapCheck = await this.checkSitemap(url);

      // Performance impact on SEO
      const performanceMetrics = await this.getBasicPerformanceMetrics(page);

      const seoReport = {
        url,
        pageName,
        timestamp: new Date().toISOString(),
        seoData,
        robotsCheck,
        sitemapCheck,
        performanceMetrics,
        seoScore: this.calculateSEOScore(seoData, robotsCheck, sitemapCheck),
        recommendations: this.generateSEORecommendations(seoData, robotsCheck, sitemapCheck)
      };

      // Save results
      const filename = `${pageName.toLowerCase().replace(/\s+/g, '-')}-seo.json`;
      fs.writeFileSync(
        path.join(this.auditDir, filename),
        JSON.stringify(seoReport, null, 2)
      );

      return seoReport;

    } catch (error) {
      console.error(`❌ Error auditing SEO for ${pageName}:`, error.message);
      return null;
    } finally {
      await browser.close();
    }
  }

  async checkRobots(url) {
    try {
      const robotsUrl = new URL('/robots.txt', url).href;
      const response = await fetch(robotsUrl);

      if (response.ok) {
        const content = await response.text();
        return {
          exists: true,
          content: content,
          hasUserAgent: content.includes('User-agent:'),
          hasDisallow: content.includes('Disallow:'),
          hasSitemap: content.includes('Sitemap:')
        };
      } else {
        return { exists: false, status: response.status };
      }
    } catch (error) {
      return { exists: false, error: error.message };
    }
  }

  async checkSitemap(url) {
    const sitemapUrls = [
      new URL('/sitemap.xml', url).href,
      new URL('/sitemap_index.xml', url).href,
      new URL('/sitemap.txt', url).href
    ];

    for (const sitemapUrl of sitemapUrls) {
      try {
        const response = await fetch(sitemapUrl);
        if (response.ok) {
          const content = await response.text();
          return {
            exists: true,
            url: sitemapUrl,
            content: content.substring(0, 1000), // First 1000 chars
            isXML: content.includes('<?xml'),
            urlCount: (content.match(/<url>/g) || []).length
          };
        }
      } catch (error) {
        continue;
      }
    }

    return { exists: false };
  }

  async getBasicPerformanceMetrics(page) {
    try {
      const metrics = await page.evaluate(() => {
        const navigation = performance.getEntriesByType('navigation')[0];
        return {
          loadTime: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
          domContentLoadedTime: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
          resourceCount: performance.getEntriesByType('resource').length
        };
      });
      return metrics;
    } catch (error) {
      return { error: error.message };
    }
  }

  calculateSEOScore(seoData, robotsCheck, sitemapCheck) {
    let score = 0;

    // Title (20 points max)
    if (seoData.title.exists) {
      score += 10;
      if (seoData.title.length >= 30 && seoData.title.length <= 60) {
        score += 10;
      } else if (seoData.title.length > 0) {
        score += 5;
      }
    }

    // Meta description (20 points max)
    if (seoData.metaDescription.exists) {
      score += 10;
      if (seoData.metaDescription.length >= 120 && seoData.metaDescription.length <= 160) {
        score += 10;
      } else if (seoData.metaDescription.length > 0) {
        score += 5;
      }
    }

    // Headings structure (15 points max)
    if (seoData.headings.h1.count === 1) {
      score += 10;
    } else if (seoData.headings.h1.count > 0) {
      score += 5;
    }
    if (seoData.headings.h2.count > 0) score += 5;

    // Images with alt text (10 points max)
    if (seoData.images.total > 0) {
      const altRatio = seoData.images.withAlt / seoData.images.total;
      score += Math.round(altRatio * 10);
    }

    // Canonical URL (5 points max)
    if (seoData.canonical.exists) score += 5;

    // Viewport meta tag (5 points max)
    if (seoData.viewport.exists) score += 5;

    // Language attribute (5 points max)
    if (seoData.language.hasLangAttribute) score += 5;

    // Robots.txt (5 points max)
    if (robotsCheck.exists) score += 5;

    // Sitemap (5 points max)
    if (sitemapCheck.exists) score += 5;

    // Open Graph tags (5 points max)
    const ogScore = Object.values(seoData.openGraph).filter(value => value !== '').length;
    score += Math.min(ogScore, 5);

    // Content quality (5 points max)
    if (seoData.content.wordCount > 300) score += 5;
    else if (seoData.content.wordCount > 100) score += 3;

    return Math.min(score, 100);
  }

  generateSEORecommendations(seoData, robotsCheck, sitemapCheck) {
    const recommendations = [];

    // Title issues
    if (!seoData.title.exists) {
      recommendations.push({
        category: 'Critical',
        issue: 'Missing title tag',
        recommendation: 'Add a unique, descriptive title tag to every page'
      });
    } else if (seoData.title.length < 30 || seoData.title.length > 60) {
      recommendations.push({
        category: 'High',
        issue: 'Title length not optimal',
        recommendation: 'Keep title length between 30-60 characters for optimal display in search results'
      });
    }

    // Meta description issues
    if (!seoData.metaDescription.exists) {
      recommendations.push({
        category: 'High',
        issue: 'Missing meta description',
        recommendation: 'Add a compelling meta description to improve click-through rates'
      });
    } else if (seoData.metaDescription.length < 120 || seoData.metaDescription.length > 160) {
      recommendations.push({
        category: 'Medium',
        issue: 'Meta description length not optimal',
        recommendation: 'Keep meta description length between 120-160 characters'
      });
    }

    // Headings structure
    if (seoData.headings.h1.count === 0) {
      recommendations.push({
        category: 'High',
        issue: 'Missing H1 tag',
        recommendation: 'Add a single, descriptive H1 tag to the page'
      });
    } else if (seoData.headings.h1.count > 1) {
      recommendations.push({
        category: 'Medium',
        issue: 'Multiple H1 tags',
        recommendation: 'Use only one H1 tag per page for better semantic structure'
      });
    }

    // Images without alt text
    if (seoData.images.withoutAlt > 0) {
      recommendations.push({
        category: 'Medium',
        issue: `${seoData.images.withoutAlt} images without alt text`,
        recommendation: 'Add descriptive alt text to all images for accessibility and SEO'
      });
    }

    // Missing canonical URL
    if (!seoData.canonical.exists) {
      recommendations.push({
        category: 'Medium',
        issue: 'Missing canonical URL',
        recommendation: 'Add canonical URL to prevent duplicate content issues'
      });
    }

    // Missing viewport meta tag
    if (!seoData.viewport.exists) {
      recommendations.push({
        category: 'High',
        issue: 'Missing viewport meta tag',
        recommendation: 'Add viewport meta tag for mobile optimization'
      });
    }

    // Missing language attribute
    if (!seoData.language.hasLangAttribute) {
      recommendations.push({
        category: 'Medium',
        issue: 'Missing language attribute',
        recommendation: 'Add lang attribute to the HTML element'
      });
    }

    // Robots.txt issues
    if (!robotsCheck.exists) {
      recommendations.push({
        category: 'Low',
        issue: 'Missing robots.txt',
        recommendation: 'Create a robots.txt file to guide search engine crawlers'
      });
    }

    // Sitemap issues
    if (!sitemapCheck.exists) {
      recommendations.push({
        category: 'Medium',
        issue: 'Missing XML sitemap',
        recommendation: 'Create and submit an XML sitemap to help search engines discover your pages'
      });
    }

    // Open Graph tags
    const missingOgTags = Object.keys(seoData.openGraph)
      .filter(key => ['title', 'description', 'image', 'url'].includes(key))
      .filter(key => !seoData.openGraph[key]);

    if (missingOgTags.length > 0) {
      recommendations.push({
        category: 'Low',
        issue: `Missing Open Graph tags: ${missingOgTags.join(', ')}`,
        recommendation: 'Add Open Graph meta tags to improve social media sharing'
      });
    }

    // Content quality
    if (seoData.content.wordCount < 300) {
      recommendations.push({
        category: 'Medium',
        issue: 'Low content word count',
        recommendation: 'Increase content length to at least 300 words for better SEO value'
      });
    }

    return recommendations.sort((a, b) => {
      const priority = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return priority[b.category] - priority[a.category];
    });
  }
}

module.exports = SEOAuditor;
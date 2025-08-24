#!/usr/bin/env python3
"""
SEO Validation Script for IT-ERA Landing Pages
Validates SEO elements across all pages and generates a compliance report
"""

import os
import re
from pathlib import Path
import json
from collections import defaultdict

class SEOValidator:
    def __init__(self, pages_dir):
        self.pages_dir = Path(pages_dir)
        self.results = defaultdict(list)
        self.stats = {
            'total_pages': 0,
            'has_canonical': 0,
            'has_og_tags': 0,
            'has_twitter_cards': 0,
            'has_schema': 0,
            'proper_headings': 0,
            'unique_titles': 0
        }
        
    def check_canonical(self, content):
        """Check for canonical URL"""
        return bool(re.search(r'<link\s+rel="canonical"', content))
    
    def check_open_graph(self, content):
        """Check for essential Open Graph tags"""
        required_og = ['og:title', 'og:description', 'og:url', 'og:type', 'og:image']
        found_og = []
        
        for tag in required_og:
            if f'property="{tag}"' in content:
                found_og.append(tag)
        
        return len(found_og) == len(required_og), found_og
    
    def check_twitter_cards(self, content):
        """Check for Twitter Card tags"""
        required_twitter = ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image']
        found_twitter = []
        
        for tag in required_twitter:
            if f'name="{tag}"' in content:
                found_twitter.append(tag)
        
        return len(found_twitter) == len(required_twitter), found_twitter
    
    def check_schema_markup(self, content):
        """Check for LocalBusiness schema"""
        return bool(re.search(r'"@type":\s*"LocalBusiness"', content))
    
    def check_heading_structure(self, content):
        """Check for proper heading hierarchy"""
        h1_count = len(re.findall(r'<h1[^>]*>', content))
        h2_count = len(re.findall(r'<h2[^>]*>', content))
        h3_count = len(re.findall(r'<h3[^>]*>', content))
        
        # Should have exactly 1 H1 and at least some H2s
        return h1_count == 1 and h2_count > 0
    
    def extract_title(self, content):
        """Extract page title"""
        match = re.search(r'<title>(.*?)</title>', content, re.DOTALL)
        return match.group(1).strip() if match else ""
    
    def extract_meta_description(self, content):
        """Extract meta description"""
        match = re.search(r'<meta name="description" content="(.*?)"', content)
        return match.group(1).strip() if match else ""
    
    def validate_file(self, file_path):
        """Validate a single HTML file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            filename = file_path.name
            
            # Run all checks
            has_canonical = self.check_canonical(content)
            has_og_complete, og_tags = self.check_open_graph(content)
            has_twitter_complete, twitter_tags = self.check_twitter_cards(content)
            has_schema = self.check_schema_markup(content)
            proper_headings = self.check_heading_structure(content)
            
            title = self.extract_title(content)
            description = self.extract_meta_description(content)
            
            # Update stats
            if has_canonical:
                self.stats['has_canonical'] += 1
            if has_og_complete:
                self.stats['has_og_tags'] += 1
            if has_twitter_complete:
                self.stats['has_twitter_cards'] += 1
            if has_schema:
                self.stats['has_schema'] += 1
            if proper_headings:
                self.stats['proper_headings'] += 1
            if title:
                self.stats['unique_titles'] += 1
            
            # Store detailed results for problematic pages
            issues = []
            if not has_canonical:
                issues.append("Missing canonical URL")
            if not has_og_complete:
                missing_og = [tag for tag in ['og:title', 'og:description', 'og:url', 'og:type', 'og:image'] if tag not in og_tags]
                issues.append(f"Missing OG tags: {', '.join(missing_og)}")
            if not has_twitter_complete:
                missing_twitter = [tag for tag in ['twitter:card', 'twitter:title', 'twitter:description', 'twitter:image'] if tag not in twitter_tags]
                issues.append(f"Missing Twitter tags: {', '.join(missing_twitter)}")
            if not has_schema:
                issues.append("Missing LocalBusiness schema")
            if not proper_headings:
                issues.append("Improper heading structure")
            if not title:
                issues.append("Missing title tag")
            if not description:
                issues.append("Missing meta description")
            
            if issues:
                self.results['issues'].append({
                    'file': filename,
                    'issues': issues,
                    'title': title[:50] + "..." if len(title) > 50 else title
                })
            else:
                self.results['compliant'].append(filename)
                
        except Exception as e:
            self.results['errors'].append(f"Error reading {filename}: {str(e)}")
    
    def generate_report(self):
        """Generate comprehensive SEO report"""
        total = self.stats['total_pages']
        
        report = f"""
# SEO Validation Report - IT-ERA Landing Pages

## 📊 Compliance Statistics

| SEO Element | Count | Percentage |
|-------------|-------|------------|
| **Total Pages** | {total} | 100% |
| **Canonical URLs** | {self.stats['has_canonical']} | {(self.stats['has_canonical']/total*100):.1f}% |
| **Open Graph Tags** | {self.stats['has_og_tags']} | {(self.stats['has_og_tags']/total*100):.1f}% |
| **Twitter Cards** | {self.stats['has_twitter_cards']} | {(self.stats['has_twitter_cards']/total*100):.1f}% |
| **Schema Markup** | {self.stats['has_schema']} | {(self.stats['has_schema']/total*100):.1f}% |
| **Proper Headings** | {self.stats['proper_headings']} | {(self.stats['proper_headings']/total*100):.1f}% |
| **Unique Titles** | {self.stats['unique_titles']} | {(self.stats['unique_titles']/total*100):.1f}% |

## 🎯 SEO Score

**Overall SEO Compliance: {((self.stats['has_canonical'] + self.stats['has_og_tags'] + self.stats['has_twitter_cards'] + self.stats['has_schema']) / (total * 4) * 100):.1f}%**

## ✅ Fully Compliant Pages

{len(self.results['compliant'])} pages are fully SEO compliant.

## ⚠️ Issues Found

{len(self.results['issues'])} pages have SEO issues:

"""
        
        # Add sample issues
        for issue in self.results['issues'][:10]:  # Show first 10
            report += f"### {issue['file']}\n"
            report += f"**Title**: {issue['title']}\n"
            report += "**Issues**:\n"
            for problem in issue['issues']:
                report += f"- {problem}\n"
            report += "\n"
        
        if len(self.results['issues']) > 10:
            report += f"\n... and {len(self.results['issues']) - 10} more pages with issues.\n"
        
        if self.results['errors']:
            report += f"\n## ❌ Errors\n\n{len(self.results['errors'])} files had processing errors:\n"
            for error in self.results['errors'][:5]:
                report += f"- {error}\n"
        
        report += f"""
## 🔧 Recommendations

### High Priority
1. **Add canonical URLs** to {total - self.stats['has_canonical']} pages
2. **Implement Open Graph tags** for {total - self.stats['has_og_tags']} pages
3. **Add Twitter Cards** to {total - self.stats['has_twitter_cards']} pages

### Medium Priority  
1. **Add LocalBusiness schema** to {total - self.stats['has_schema']} pages
2. **Fix heading structure** on {total - self.stats['proper_headings']} pages

### Tools to Use
- Run `python scripts/fix_seo_critical.py` to fix most issues automatically
- Validate with `python scripts/validate_seo.py` after fixes
- Test with Google's Rich Results Test for schema validation

---
*Report generated: {self.get_timestamp()}*
"""
        
        return report
    
    def get_timestamp(self):
        """Get current timestamp"""
        from datetime import datetime
        return datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    def run(self):
        """Run validation on all HTML files"""
        html_files = list(self.pages_dir.glob("*.html"))
        self.stats['total_pages'] = len(html_files)
        
        print(f"Validating SEO for {len(html_files)} pages...")
        
        for file_path in html_files:
            self.validate_file(file_path)
        
        # Generate and save report
        report = self.generate_report()
        
        report_path = Path("/Users/andreapanzeri/progetti/IT-ERA/docs/seo-validation-report.md")
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(report)
        
        print(f"✅ SEO validation complete! Report saved to: {report_path}")
        print(f"📊 Overall SEO Compliance: {((self.stats['has_canonical'] + self.stats['has_og_tags'] + self.stats['has_twitter_cards'] + self.stats['has_schema']) / (self.stats['total_pages'] * 4) * 100):.1f}%")

def main():
    pages_dir = "/Users/andreapanzeri/progetti/IT-ERA/web/pages"
    
    if not os.path.exists(pages_dir):
        print(f"❌ Pages directory not found: {pages_dir}")
        return
    
    validator = SEOValidator(pages_dir)
    validator.run()

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
IT-ERA SEO Infrastructure Validation Script
Validates all SEO components for production deployment
"""

import os
import json
import re
from pathlib import Path
import requests
import time
from urllib.parse import urljoin, urlparse
from typing import Dict, List, Any
import hashlib

class ITERASEOValidator:
    def __init__(self, project_root: str = "/Users/andreapanzeri/progetti/IT-ERA"):
        self.project_root = Path(project_root)
        self.domain = "https://it-era.it"
        self.results = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "overall_score": 0,
            "validations": {},
            "errors": [],
            "warnings": [],
            "recommendations": []
        }
    
    def validate_favicon_assets(self) -> Dict[str, Any]:
        """Validate favicon and PWA assets"""
        print("🎨 Validating favicon and PWA assets...")
        
        required_files = {
            "favicon.ico": {"path": "public/favicon.ico", "min_size": 1024},
            "apple-touch-icon.png": {"path": "public/apple-touch-icon.png", "min_size": 10000},
            "site.webmanifest": {"path": "public/site.webmanifest", "min_size": 500}
        }
        
        results = {"score": 0, "files": {}, "issues": []}
        
        for file_name, config in required_files.items():
            file_path = self.project_root / config["path"]
            
            if file_path.exists():
                file_size = file_path.stat().st_size
                if file_size >= config["min_size"]:
                    results["files"][file_name] = {"status": "✅ Valid", "size": file_size}
                    results["score"] += 33.33
                else:
                    results["files"][file_name] = {"status": "⚠️ Too small", "size": file_size}
                    results["issues"].append(f"{file_name} is too small ({file_size} bytes)")
            else:
                results["files"][file_name] = {"status": "❌ Missing", "size": 0}
                results["issues"].append(f"{file_name} is missing")
        
        # Validate webmanifest content
        manifest_path = self.project_root / "public/site.webmanifest"
        if manifest_path.exists():
            try:
                with open(manifest_path) as f:
                    manifest = json.load(f)
                    
                required_fields = ["name", "short_name", "start_url", "display", "theme_color"]
                missing_fields = [field for field in required_fields if field not in manifest]
                
                if not missing_fields:
                    results["webmanifest_validation"] = "✅ Valid"
                else:
                    results["webmanifest_validation"] = f"❌ Missing: {', '.join(missing_fields)}"
                    results["issues"].append(f"Webmanifest missing fields: {missing_fields}")
            except json.JSONDecodeError:
                results["webmanifest_validation"] = "❌ Invalid JSON"
                results["issues"].append("Webmanifest contains invalid JSON")
        
        return results
    
    def validate_schema_markup(self) -> Dict[str, Any]:
        """Validate Schema.org structured data"""
        print("🏗️ Validating Schema.org structured data...")
        
        schema_files = {
            "organization": "snippets/schema-organization.json",
            "localbusiness": "snippets/schema-localbusiness.json", 
            "services": "snippets/schema-services.json",
            "website": "snippets/schema-website.json"
        }
        
        results = {"score": 0, "schemas": {}, "issues": []}
        
        for schema_name, file_path in schema_files.items():
            schema_path = self.project_root / file_path
            
            if schema_path.exists():
                try:
                    with open(schema_path) as f:
                        schema_data = json.load(f)
                    
                    # Validate required Schema.org fields
                    if "@context" in schema_data and "@type" in schema_data:
                        # Check IT-ERA specific data
                        it_era_fields = ["name", "description"]
                        if schema_name == "organization":
                            it_era_fields.extend(["address", "contactPoint", "areaServed"])
                        elif schema_name == "localbusiness":
                            it_era_fields.extend(["telephone", "email", "geo"])
                        
                        missing_fields = [field for field in it_era_fields if field not in schema_data]
                        
                        if not missing_fields:
                            results["schemas"][schema_name] = "✅ Valid"
                            results["score"] += 25
                        else:
                            results["schemas"][schema_name] = f"⚠️ Missing: {', '.join(missing_fields)}"
                            results["issues"].append(f"{schema_name} schema missing: {missing_fields}")
                    else:
                        results["schemas"][schema_name] = "❌ Invalid schema structure"
                        results["issues"].append(f"{schema_name} schema missing @context or @type")
                        
                except json.JSONDecodeError:
                    results["schemas"][schema_name] = "❌ Invalid JSON"
                    results["issues"].append(f"{schema_name} schema contains invalid JSON")
            else:
                results["schemas"][schema_name] = "❌ Missing"
                results["issues"].append(f"{schema_name} schema file missing")
        
        return results
    
    def validate_seo_head_template(self) -> Dict[str, Any]:
        """Validate SEO head template"""
        print("📝 Validating SEO head template...")
        
        template_path = self.project_root / "templates/seo-head-template.html"
        results = {"score": 0, "elements": {}, "issues": []}
        
        if not template_path.exists():
            results["issues"].append("SEO head template missing")
            return results
        
        with open(template_path) as f:
            template_content = f.read()
        
        # Check required meta tags
        required_elements = {
            "charset": r'<meta\s+charset=',
            "viewport": r'<meta\s+name="viewport"',
            "robots": r'<meta\s+name="robots"',
            "title": r'<title>',
            "description": r'<meta\s+name="description"',
            "canonical": r'<link\s+rel="canonical"',
            "favicon": r'<link\s+rel="icon"',
            "apple-touch-icon": r'<link\s+rel="apple-touch-icon"',
            "manifest": r'<link\s+rel="manifest"',
            "og:title": r'<meta\s+property="og:title"',
            "og:description": r'<meta\s+property="og:description"',
            "og:image": r'<meta\s+property="og:image"',
            "twitter:card": r'<meta\s+name="twitter:card"',
            "schema-organization": r'<script\s+type="application/ld\+json"\s+id="schema-organization"',
            "schema-localbusiness": r'<script\s+type="application/ld\+json"\s+id="schema-localbusiness"',
            "gtag": r'gtag\(',
            "preconnect": r'<link\s+rel="preconnect"'
        }
        
        for element, pattern in required_elements.items():
            if re.search(pattern, template_content, re.IGNORECASE):
                results["elements"][element] = "✅ Present"
                results["score"] += 5.88  # 100/17 elements
            else:
                results["elements"][element] = "❌ Missing"
                results["issues"].append(f"Missing SEO element: {element}")
        
        # Check for template variables
        template_vars = ["{{TITLE}}", "{{DESCRIPTION}}", "{{CANONICAL_PATH}}", "{{KEYWORDS}}"]
        missing_vars = [var for var in template_vars if var not in template_content]
        
        if not missing_vars:
            results["template_variables"] = "✅ All variables present"
        else:
            results["template_variables"] = f"⚠️ Missing: {', '.join(missing_vars)}"
            results["issues"].append(f"Missing template variables: {missing_vars}")
        
        return results
    
    def validate_gtm_config(self) -> Dict[str, Any]:
        """Validate Google Tag Manager configuration"""
        print("📊 Validating GTM configuration...")
        
        gtm_path = self.project_root / "snippets/gtm-config.json"
        results = {"score": 0, "config": {}, "issues": []}
        
        if not gtm_path.exists():
            results["issues"].append("GTM configuration missing")
            return results
        
        try:
            with open(gtm_path) as f:
                gtm_config = json.load(f)
            
            required_fields = ["gtm_container_id", "ga4_measurement_id", "events", "triggers"]
            missing_fields = [field for field in required_fields if field not in gtm_config]
            
            if not missing_fields:
                results["config"]["structure"] = "✅ Valid"
                results["score"] += 50
            else:
                results["config"]["structure"] = f"❌ Missing: {', '.join(missing_fields)}"
                results["issues"].append(f"GTM config missing: {missing_fields}")
            
            # Validate events configuration
            if "events" in gtm_config and isinstance(gtm_config["events"], list):
                event_count = len(gtm_config["events"])
                if event_count >= 4:
                    results["config"]["events"] = f"✅ {event_count} events configured"
                    results["score"] += 30
                else:
                    results["config"]["events"] = f"⚠️ Only {event_count} events"
                    results["issues"].append("Insufficient event tracking configured")
            
            # Validate custom dimensions
            if "custom_dimensions" in gtm_config:
                results["config"]["custom_dimensions"] = "✅ Configured"
                results["score"] += 20
            else:
                results["config"]["custom_dimensions"] = "❌ Missing"
                results["issues"].append("Custom dimensions not configured")
                
        except json.JSONDecodeError:
            results["config"]["structure"] = "❌ Invalid JSON"
            results["issues"].append("GTM config contains invalid JSON")
        
        return results
    
    def validate_core_web_vitals_css(self) -> Dict[str, Any]:
        """Validate Core Web Vitals optimization CSS"""
        print("⚡ Validating Core Web Vitals CSS...")
        
        css_path = self.project_root / "snippets/core-web-vitals.css"
        results = {"score": 0, "optimizations": {}, "issues": []}
        
        if not css_path.exists():
            results["issues"].append("Core Web Vitals CSS missing")
            return results
        
        with open(css_path) as f:
            css_content = f.read()
        
        # Check for performance optimizations
        optimizations = {
            "font-display": r'font-display:\s*swap',
            "hardware-acceleration": r'transform:\s*translateZ\(0\)',
            "contain-property": r'contain:\s*(layout|paint|style)',
            "will-change": r'will-change:',
            "touch-action": r'touch-action:\s*manipulation',
            "aspect-ratio": r'aspect-ratio:',
            "content-visibility": r'content-visibility:\s*auto',
            "prefers-reduced-motion": r'@media\s*\(prefers-reduced-motion:\s*reduce\)',
            "loading-placeholder": r'\.loading',
            "critical-css-vars": r':root\s*\{[^}]*--primary'
        }
        
        for opt_name, pattern in optimizations.items():
            if re.search(pattern, css_content, re.IGNORECASE):
                results["optimizations"][opt_name] = "✅ Implemented"
                results["score"] += 10
            else:
                results["optimizations"][opt_name] = "❌ Missing"
                results["issues"].append(f"Missing optimization: {opt_name}")
        
        return results
    
    def validate_sitemap(self) -> Dict[str, Any]:
        """Validate XML sitemap"""
        print("🗺️ Validating XML sitemap...")
        
        sitemap_path = self.project_root / "public/sitemap.xml"
        results = {"score": 0, "sitemap": {}, "issues": []}
        
        if not sitemap_path.exists():
            results["issues"].append("Sitemap missing")
            return results
        
        try:
            with open(sitemap_path) as f:
                sitemap_content = f.read()
            
            # Count URLs
            url_count = len(re.findall(r'<url>', sitemap_content))
            
            if url_count > 1000:
                results["sitemap"]["url_count"] = f"✅ {url_count} URLs"
                results["score"] += 50
            elif url_count > 100:
                results["sitemap"]["url_count"] = f"⚠️ {url_count} URLs (expected >1000)"
                results["score"] += 30
            else:
                results["sitemap"]["url_count"] = f"❌ Only {url_count} URLs"
                results["issues"].append("Sitemap has too few URLs")
            
            # Check XML structure
            if re.search(r'<urlset[^>]*xmlns="http://www\.sitemaps\.org/schemas/sitemap/0\.9"', sitemap_content):
                results["sitemap"]["xml_structure"] = "✅ Valid XML"
                results["score"] += 25
            else:
                results["sitemap"]["xml_structure"] = "❌ Invalid XML structure"
                results["issues"].append("Sitemap XML structure invalid")
            
            # Check for lastmod dates
            if re.search(r'<lastmod>', sitemap_content):
                results["sitemap"]["lastmod"] = "✅ Present"
                results["score"] += 25
            else:
                results["sitemap"]["lastmod"] = "⚠️ Missing lastmod dates"
                results["issues"].append("Sitemap missing lastmod dates")
                
        except Exception as e:
            results["sitemap"]["validation"] = f"❌ Error: {str(e)}"
            results["issues"].append(f"Sitemap validation error: {str(e)}")
        
        return results
    
    def validate_robots_txt(self) -> Dict[str, Any]:
        """Validate robots.txt"""
        print("🤖 Validating robots.txt...")
        
        robots_path = self.project_root / "public/robots.txt"
        results = {"score": 0, "robots": {}, "issues": []}
        
        if not robots_path.exists():
            results["issues"].append("robots.txt missing")
            return results
        
        with open(robots_path) as f:
            robots_content = f.read()
        
        # Check required directives
        if "User-agent:" in robots_content:
            results["robots"]["user_agent"] = "✅ Present"
            results["score"] += 25
        else:
            results["robots"]["user_agent"] = "❌ Missing"
            results["issues"].append("robots.txt missing User-agent directive")
        
        if "Sitemap:" in robots_content:
            results["robots"]["sitemap"] = "✅ Present"
            results["score"] += 25
        else:
            results["robots"]["sitemap"] = "❌ Missing"
            results["issues"].append("robots.txt missing Sitemap directive")
        
        if "Disallow:" in robots_content:
            results["robots"]["disallow"] = "✅ Present"
            results["score"] += 25
        else:
            results["robots"]["disallow"] = "⚠️ No restrictions"
            results["score"] += 15
        
        # Check for IT-ERA specific content
        if "it-era.it" in robots_content:
            results["robots"]["domain"] = "✅ Domain specified"
            results["score"] += 25
        else:
            results["robots"]["domain"] = "⚠️ Domain not specified"
            results["score"] += 10
        
        return results
    
    def run_full_validation(self) -> Dict[str, Any]:
        """Run all validations"""
        print("🚀 Starting IT-ERA SEO Infrastructure Validation")
        print("=" * 60)
        
        validations = {
            "favicon_assets": self.validate_favicon_assets(),
            "schema_markup": self.validate_schema_markup(),
            "seo_head_template": self.validate_seo_head_template(),
            "gtm_config": self.validate_gtm_config(),
            "core_web_vitals": self.validate_core_web_vitals_css(),
            "sitemap": self.validate_sitemap(),
            "robots_txt": self.validate_robots_txt()
        }
        
        self.results["validations"] = validations
        
        # Calculate overall score
        total_score = sum(v["score"] for v in validations.values())
        max_score = len(validations) * 100
        self.results["overall_score"] = round((total_score / max_score) * 100, 2)
        
        # Collect all issues
        for validation in validations.values():
            self.results["errors"].extend(validation.get("issues", []))
        
        # Generate recommendations
        self.generate_recommendations()
        
        return self.results
    
    def generate_recommendations(self):
        """Generate recommendations based on validation results"""
        if self.results["overall_score"] >= 90:
            self.results["recommendations"].append("✅ SEO infrastructure is production-ready!")
        elif self.results["overall_score"] >= 75:
            self.results["recommendations"].append("⚠️ SEO infrastructure is mostly ready with minor issues")
        else:
            self.results["recommendations"].append("❌ SEO infrastructure needs significant improvements")
        
        # Specific recommendations
        if len(self.results["errors"]) > 0:
            self.results["recommendations"].append(f"🔧 Fix {len(self.results['errors'])} critical issues before deployment")
        
        self.results["recommendations"].extend([
            "📊 Test all tracking events in Google Analytics",
            "🌐 Validate all Schema.org markup using Google's Rich Results Test",
            "⚡ Monitor Core Web Vitals after deployment",
            "🔍 Submit sitemap to Google Search Console"
        ])
    
    def print_report(self):
        """Print validation report"""
        print(f"\n🎯 IT-ERA SEO Infrastructure Validation Report")
        print(f"📅 Generated: {self.results['timestamp']}")
        print(f"🏆 Overall Score: {self.results['overall_score']}/100")
        print("=" * 60)
        
        for validation_name, validation_data in self.results["validations"].items():
            print(f"\n📋 {validation_name.replace('_', ' ').title()}")
            print(f"   Score: {validation_data['score']:.1f}/100")
            
            for key, value in validation_data.items():
                if key not in ["score", "issues"]:
                    if isinstance(value, dict):
                        for sub_key, sub_value in value.items():
                            print(f"   {sub_key}: {sub_value}")
                    else:
                        print(f"   {key}: {value}")
        
        if self.results["errors"]:
            print(f"\n❌ Issues Found ({len(self.results['errors'])}):")
            for error in self.results["errors"]:
                print(f"   • {error}")
        
        print(f"\n💡 Recommendations:")
        for rec in self.results["recommendations"]:
            print(f"   • {rec}")
        
        print("\n" + "=" * 60)
        
        # Color-coded final status
        if self.results["overall_score"] >= 90:
            print("🟢 STATUS: PRODUCTION READY")
        elif self.results["overall_score"] >= 75:
            print("🟡 STATUS: MINOR ISSUES - DEPLOYMENT POSSIBLE")
        else:
            print("🔴 STATUS: CRITICAL ISSUES - FIX BEFORE DEPLOYMENT")

def main():
    """Run SEO validation"""
    validator = ITERASEOValidator()
    results = validator.run_full_validation()
    validator.print_report()
    
    # Save report to file
    report_path = validator.project_root / "reports" / f"seo-validation-{int(time.time())}.json"
    report_path.parent.mkdir(exist_ok=True)
    
    with open(report_path, 'w') as f:
        json.dump(results, f, indent=2)
    
    print(f"\n📄 Detailed report saved: {report_path}")
    
    # Exit with appropriate code
    exit_code = 0 if results["overall_score"] >= 75 else 1
    exit(exit_code)

if __name__ == "__main__":
    main()
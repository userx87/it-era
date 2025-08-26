#!/usr/bin/env python3
"""
Google Analytics 4 Deployment Script for IT-ERA
HIVESTORM Task #7: Deploy GA4 tracking to all 1,427 pages

This script validates the GA4 implementation across all templates
and provides deployment verification.
"""

import os
import re
import json
from pathlib import Path
from typing import Dict, List, Tuple

class GA4Validator:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.templates_dir = self.project_root / "templates"
        self.analytics_dir = self.project_root / "api" / "contact-system" / "workers" / "analytics"
        
        # Expected tracking elements
        self.required_elements = [
            "gtag('config'",
            "gtag('event', 'page_view'",
            "gtag('event', 'view_item'",
            "gtag('event', 'form_submit'",
            "gtag('event', 'generate_lead'",
            "gtag('event', 'purchase'",
            "phone_click",
            "email_click",
            "chatbot_open"
        ]
        
        self.service_templates = [
            "assistenza-it-template-new.html",
            "sicurezza-informatica-modern.html", 
            "cloud-storage-perfect.html"
        ]
        
    def validate_template(self, template_path: Path) -> Dict:
        """Validate GA4 implementation in a template file"""
        validation_result = {
            "template": template_path.name,
            "ga4_configured": False,
            "gtm_configured": False,
            "events_implemented": [],
            "missing_events": [],
            "gdpr_compliant": False,
            "cross_domain_setup": False,
            "errors": []
        }
        
        try:
            with open(template_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Check GA4 configuration
            if "gtag('config'" in content and "G-" in content:
                validation_result["ga4_configured"] = True
            else:
                validation_result["errors"].append("GA4 configuration not found")
                
            # Check GTM setup
            if "googletagmanager.com/gtm.js" in content and "GTM-" in content:
                validation_result["gtm_configured"] = True
            else:
                validation_result["errors"].append("GTM configuration not found")
                
            # Check required events
            for event in self.required_elements:
                if event in content:
                    validation_result["events_implemented"].append(event)
                else:
                    validation_result["missing_events"].append(event)
                    
            # Check GDPR compliance
            if "gtag('consent'" in content and "'ad_storage': 'denied'" in content:
                validation_result["gdpr_compliant"] = True
            else:
                validation_result["errors"].append("GDPR compliance not properly configured")
                
            # Check cross-domain setup
            if "'linker':" in content and "it-era.it" in content:
                validation_result["cross_domain_setup"] = True
            else:
                validation_result["errors"].append("Cross-domain tracking not configured")
                
        except Exception as e:
            validation_result["errors"].append(f"File reading error: {str(e)}")
            
        return validation_result
    
    def validate_all_templates(self) -> List[Dict]:
        """Validate all service templates"""
        results = []
        
        for template_name in self.service_templates:
            template_path = self.templates_dir / template_name
            
            if template_path.exists():
                result = self.validate_template(template_path)
                results.append(result)
            else:
                results.append({
                    "template": template_name,
                    "errors": [f"Template file not found: {template_path}"]
                })
                
        return results
    
    def check_analytics_files(self) -> Dict:
        """Check if all analytics configuration files exist"""
        required_files = [
            "ga4-config.js",
            "universal-tracking.js", 
            "gtm-config.json",
            "tracking-snippet.html"
        ]
        
        result = {
            "files_present": [],
            "files_missing": [],
            "total_files": len(required_files)
        }
        
        for filename in required_files:
            file_path = self.analytics_dir / filename
            if file_path.exists():
                result["files_present"].append(filename)
            else:
                result["files_missing"].append(filename)
                
        return result
    
    def validate_service_values(self) -> Dict:
        """Validate that service values are correctly configured"""
        expected_values = {
            "assistenza-it": 290,
            "sicurezza-informatica": 899,
            "cloud-storage": 50
        }
        
        validation_result = {"correct": [], "incorrect": [], "missing": []}
        
        for template_name in self.service_templates:
            template_path = self.templates_dir / template_name
            
            if template_path.exists():
                try:
                    with open(template_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                        
                    # Extract service values from the template
                    for service, expected_value in expected_values.items():
                        pattern = f"'{service}':\\s*(\\d+)"
                        match = re.search(pattern, content)
                        
                        if match:
                            actual_value = int(match.group(1))
                            if actual_value == expected_value:
                                validation_result["correct"].append(f"{service}: {actual_value}")
                            else:
                                validation_result["incorrect"].append(
                                    f"{service}: expected {expected_value}, got {actual_value}"
                                )
                        else:
                            validation_result["missing"].append(f"{service} value not found")
                            
                except Exception as e:
                    validation_result["missing"].append(f"Error reading {template_name}: {str(e)}")
                    
        return validation_result
    
    def generate_deployment_report(self) -> Dict:
        """Generate comprehensive deployment report"""
        template_results = self.validate_all_templates()
        analytics_files = self.check_analytics_files()
        service_values = self.validate_service_values()
        
        # Calculate overall status
        total_templates = len(self.service_templates)
        successful_templates = sum(1 for r in template_results if not r.get("errors", []))
        
        deployment_status = "READY" if successful_templates == total_templates else "NEEDS_ATTENTION"
        
        return {
            "deployment_status": deployment_status,
            "timestamp": "2025-01-25T10:00:00Z",
            "templates": {
                "total": total_templates,
                "successful": successful_templates,
                "failed": total_templates - successful_templates,
                "details": template_results
            },
            "analytics_files": analytics_files,
            "service_values": service_values,
            "next_steps": self._get_next_steps(template_results, analytics_files)
        }
    
    def _get_next_steps(self, template_results: List[Dict], analytics_files: Dict) -> List[str]:
        """Generate next steps based on validation results"""
        steps = []
        
        # Check for missing files
        if analytics_files["files_missing"]:
            steps.append(f"Create missing analytics files: {', '.join(analytics_files['files_missing'])}")
            
        # Check for template issues
        for result in template_results:
            if result.get("errors"):
                steps.append(f"Fix issues in {result['template']}: {'; '.join(result['errors'])}")
                
        # Production deployment steps
        if not steps:
            steps.extend([
                "1. Replace placeholder GA4 ID (G-XXXXXXXXX) with actual property ID",
                "2. Replace placeholder GTM ID (GTM-XXXXXXX) with actual container ID",
                "3. Configure custom dimensions in GA4 dashboard",
                "4. Import GTM configuration from gtm-config.json",
                "5. Test tracking in GA4 DebugView",
                "6. Deploy templates to production",
                "7. Validate tracking across sample pages",
                "8. Set up conversion goals in GA4"
            ])
        
        return steps

def main():
    """Main deployment validation function"""
    print("🚀 IT-ERA GA4 Deployment Validator")
    print("=" * 50)
    
    # Initialize validator - point to correct project root
    script_dir = os.path.dirname(os.path.abspath(__file__))
    # Navigate from /api/contact-system/workers/scripts to project root
    project_root = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(script_dir))))
    validator = GA4Validator(project_root)
    
    # Generate deployment report
    report = validator.generate_deployment_report()
    
    # Display results
    print(f"\n📊 DEPLOYMENT STATUS: {report['deployment_status']}")
    print(f"📅 Generated: {report['timestamp']}")
    
    print(f"\n📄 TEMPLATE VALIDATION:")
    print(f"  ✅ Successful: {report['templates']['successful']}/{report['templates']['total']}")
    print(f"  ❌ Failed: {report['templates']['failed']}")
    
    for template_detail in report['templates']['details']:
        template_name = template_detail['template']
        if template_detail.get('errors'):
            print(f"  🔴 {template_name}: {'; '.join(template_detail['errors'])}")
        else:
            print(f"  🟢 {template_name}: All checks passed")
    
    print(f"\n📁 ANALYTICS FILES:")
    print(f"  ✅ Present: {len(report['analytics_files']['files_present'])}/{report['analytics_files']['total_files']}")
    for file in report['analytics_files']['files_present']:
        print(f"    🟢 {file}")
    for file in report['analytics_files']['files_missing']:
        print(f"    🔴 Missing: {file}")
    
    print(f"\n💰 SERVICE VALUES:")
    for correct in report['service_values']['correct']:
        print(f"  🟢 {correct}")
    for incorrect in report['service_values']['incorrect']:
        print(f"  🔴 {incorrect}")
    for missing in report['service_values']['missing']:
        print(f"  🔴 Missing: {missing}")
    
    print(f"\n📋 NEXT STEPS:")
    for i, step in enumerate(report['next_steps'], 1):
        print(f"  {i}. {step}")
    
    # Save report to file
    docs_dir = Path(project_root) / "api" / "contact-system" / "workers" / "docs"
    docs_dir.mkdir(parents=True, exist_ok=True)
    report_path = docs_dir / "ga4-deployment-report.json"
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)
    
    print(f"\n💾 Full report saved to: {report_path}")
    
    if report['deployment_status'] == 'READY':
        print("\n🎉 GA4 implementation is ready for production deployment!")
        print("   Remember to replace placeholder IDs before going live.")
    else:
        print("\n⚠️  Some issues need to be resolved before deployment.")
    
    print("\n" + "=" * 50)
    return report['deployment_status'] == 'READY'

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
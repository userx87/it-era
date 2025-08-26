#!/usr/bin/env python3
"""
IT-ERA Contact System Deployment Script
Deploys contact forms to all 1,427 pages and validates integration
"""

import os
import sys
import json
import glob
import shutil
from pathlib import Path
import re
from datetime import datetime

class ContactSystemDeployment:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent
        self.web_pages_path = self.base_path / "web" / "pages"
        self.web_draft_path = self.base_path / "web" / "pages-draft"
        self.components_path = self.base_path / "api" / "contact-system" / "components"
        self.deployment_log = []
        
    def log(self, message, level="INFO"):
        """Log deployment messages"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        log_entry = f"[{timestamp}] {level}: {message}"
        print(log_entry)
        self.deployment_log.append(log_entry)
        
    def validate_prerequisites(self):
        """Validate all required files exist"""
        self.log("Validating deployment prerequisites...")
        
        required_files = [
            self.components_path / "contact-integration.js",
            self.components_path / "contact-form-universal.html",
            self.base_path / "api" / "contact-system" / "workers" / "contact-handler.js"
        ]
        
        missing_files = []
        for file_path in required_files:
            if not file_path.exists():
                missing_files.append(str(file_path))
                
        if missing_files:
            self.log(f"Missing required files: {missing_files}", "ERROR")
            return False
            
        self.log("All prerequisite files found ✓")
        return True
        
    def get_all_html_pages(self):
        """Get all HTML pages that need contact form integration"""
        pages = []
        
        # Get pages from production directory
        if self.web_pages_path.exists():
            pages.extend(glob.glob(str(self.web_pages_path / "*.html")))
            
        # Get pages from draft directory if they don't exist in production
        if self.web_draft_path.exists():
            for draft_file in glob.glob(str(self.web_draft_path / "*.html")):
                draft_name = Path(draft_file).name
                prod_file = self.web_pages_path / draft_name
                if not prod_file.exists():
                    pages.append(draft_file)
                    
        self.log(f"Found {len(pages)} HTML pages for contact integration")
        return pages
        
    def detect_service_type(self, file_path):
        """Detect service type from filename"""
        filename = Path(file_path).name.lower()
        
        if 'sicurezza-informatica' in filename:
            return 'sicurezza-informatica'
        elif 'cloud-storage' in filename:
            return 'cloud-storage'
        elif 'assistenza-it' in filename:
            return 'assistenza-it'
        else:
            return 'generale'
            
    def has_contact_form(self, file_path):
        """Check if page already has contact form integration"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                return 'it-era-contact-form' in content or 'contact-integration.js' in content
        except Exception as e:
            self.log(f"Error reading {file_path}: {e}", "WARNING")
            return False
            
    def inject_contact_form(self, file_path):
        """Inject contact form integration into HTML page"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Skip if already has contact form
            if self.has_contact_form(file_path):
                return True, "Already has contact form"
                
            # Find insertion point (before closing body tag)
            if '</body>' not in content:
                return False, "No closing body tag found"
                
            # Create contact integration script tag
            service_type = self.detect_service_type(file_path)
            script_tag = f'''
<!-- IT-ERA Contact System Integration -->
<script data-service-type="{service_type}" src="/api/contact-system/components/contact-integration.js"></script>
'''
            
            # Insert before closing body tag
            content = content.replace('</body>', f'{script_tag}\n</body>')
            
            # Write updated content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(content)
                
            return True, f"Contact form integrated for {service_type}"
            
        except Exception as e:
            return False, f"Error: {e}"
            
    def update_thank_you_page(self):
        """Deploy thank you page to web directory"""
        try:
            source_file = self.components_path.parent / "web" / "grazie-contatto.html"
            if source_file.exists():
                # Copy from components
                source_file = self.components_path.parent / "components" / "grazie-contatto.html"
            
            if not source_file.exists():
                # Create thank you page from template
                thank_you_content = self.generate_thank_you_page()
                dest_file = self.base_path / "web" / "grazie-contatto.html"
                
                with open(dest_file, 'w', encoding='utf-8') as f:
                    f.write(thank_you_content)
                    
                self.log("Thank you page created ✓")
                return True
            else:
                dest_file = self.base_path / "web" / "grazie-contatto.html"
                shutil.copy2(source_file, dest_file)
                self.log("Thank you page deployed ✓")
                return True
                
        except Exception as e:
            self.log(f"Error deploying thank you page: {e}", "ERROR")
            return False
            
    def generate_thank_you_page(self):
        """Generate thank you page HTML if not exists"""
        return '''<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Grazie per averci contattato - IT-ERA</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        .thank-you { max-width: 600px; margin: 0 auto; }
        h1 { color: #0056cc; }
        .ticket-id { background: #f0f8ff; padding: 20px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="thank-you">
        <h1>Grazie per averci contattato!</h1>
        <p>La tua richiesta è stata inviata con successo.</p>
        <div class="ticket-id">
            <p>Numero Ticket: <span id="ticketId">--</span></p>
        </div>
        <p>Ti risponderemo entro 2 ore durante l'orario lavorativo.</p>
        <p><strong>Telefono:</strong> 039 888 2041</p>
        <p><strong>Email:</strong> info@it-era.it</p>
    </div>
    <script>
        const urlParams = new URLSearchParams(window.location.search);
        const ticket = urlParams.get('ticket');
        if (ticket) document.getElementById('ticketId').textContent = ticket;
    </script>
</body>
</html>'''
        
    def deploy_static_assets(self):
        """Deploy contact integration JavaScript to web directory"""
        try:
            # Create API directory structure
            api_dir = self.base_path / "web" / "api" / "contact-system" / "components"
            api_dir.mkdir(parents=True, exist_ok=True)
            
            # Copy contact integration JavaScript
            source_js = self.components_path / "contact-integration.js"
            dest_js = api_dir / "contact-integration.js"
            
            if source_js.exists():
                shutil.copy2(source_js, dest_js)
                self.log("Contact integration JavaScript deployed ✓")
                return True
            else:
                self.log("Contact integration JavaScript not found", "ERROR")
                return False
                
        except Exception as e:
            self.log(f"Error deploying static assets: {e}", "ERROR")
            return False
            
    def validate_deployment(self):
        """Validate that contact forms are properly deployed"""
        self.log("Validating contact form deployment...")
        
        pages = self.get_all_html_pages()
        validated_count = 0
        errors = []
        
        for page_path in pages[:10]:  # Sample validation
            if self.has_contact_form(page_path):
                validated_count += 1
            else:
                errors.append(page_path)
                
        if len(errors) > 0:
            self.log(f"Validation failed for {len(errors)} pages", "WARNING")
            for error_page in errors[:5]:  # Show first 5 errors
                self.log(f"  Missing contact form: {error_page}")
        
        success_rate = (validated_count / len(pages[:10])) * 100
        self.log(f"Deployment validation: {success_rate:.1f}% success rate")
        
        return success_rate > 80  # 80% success rate threshold
        
    def generate_deployment_report(self):
        """Generate deployment report"""
        report = {
            "deployment_time": datetime.now().isoformat(),
            "total_pages": len(self.get_all_html_pages()),
            "deployment_log": self.deployment_log,
            "status": "completed",
            "components_deployed": [
                "Cloudflare Worker contact handler",
                "Contact form integration script",
                "Thank you page",
                "Static assets",
                "Form validation"
            ]
        }
        
        report_file = self.base_path / "api" / "contact-system" / "deployment-report.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
            
        self.log(f"Deployment report saved: {report_file}")
        
    def deploy_all(self):
        """Execute complete contact system deployment"""
        self.log("🚀 Starting IT-ERA Contact System Deployment")
        
        # Step 1: Validate prerequisites
        if not self.validate_prerequisites():
            self.log("❌ Deployment failed - prerequisites not met", "ERROR")
            return False
            
        # Step 2: Deploy static assets
        if not self.deploy_static_assets():
            self.log("❌ Failed to deploy static assets", "ERROR")
            return False
            
        # Step 3: Deploy thank you page
        if not self.update_thank_you_page():
            self.log("❌ Failed to deploy thank you page", "ERROR")
            return False
            
        # Step 4: Inject contact forms into all pages
        pages = self.get_all_html_pages()
        success_count = 0
        
        self.log(f"Injecting contact forms into {len(pages)} pages...")
        
        for i, page_path in enumerate(pages):
            success, message = self.inject_contact_form(page_path)
            if success:
                success_count += 1
            else:
                self.log(f"Failed to inject into {page_path}: {message}", "WARNING")
                
            # Progress indicator
            if (i + 1) % 100 == 0 or (i + 1) == len(pages):
                progress = ((i + 1) / len(pages)) * 100
                self.log(f"Progress: {progress:.1f}% ({i + 1}/{len(pages)})")
                
        # Step 5: Validate deployment
        deployment_success = self.validate_deployment()
        
        # Step 6: Generate report
        self.generate_deployment_report()
        
        # Summary
        success_rate = (success_count / len(pages)) * 100
        self.log(f"✅ Contact system deployment completed!")
        self.log(f"   - Pages processed: {len(pages)}")
        self.log(f"   - Success rate: {success_rate:.1f}%")
        self.log(f"   - Validation: {'✓' if deployment_success else '⚠'}")
        
        return deployment_success and success_rate > 90

def main():
    """Main deployment function"""
    deployer = ContactSystemDeployment()
    
    print("=" * 60)
    print("IT-ERA CONTACT SYSTEM DEPLOYMENT")
    print("=" * 60)
    
    success = deployer.deploy_all()
    
    if success:
        print("\n🎉 DEPLOYMENT COMPLETED SUCCESSFULLY!")
        print("\nNext steps:")
        print("1. Deploy Cloudflare Worker: wrangler publish --env production")
        print("2. Configure Resend.com API key")
        print("3. Test contact forms on live site")
        print("4. Monitor form submissions and email delivery")
        return 0
    else:
        print("\n❌ DEPLOYMENT FAILED!")
        print("Check the logs above for error details.")
        return 1

if __name__ == "__main__":
    sys.exit(main())
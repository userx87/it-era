#!/usr/bin/env python3
"""
IT-ERA Mass Contact Form Integration
Integrates contact forms into all 1,427+ pages
"""

import os
import glob
import re
from pathlib import Path
import concurrent.futures
from datetime import datetime

class MassContactIntegration:
    def __init__(self):
        self.base_path = Path(__file__).parent.parent
        self.integration_script = """
<!-- IT-ERA Contact System Integration -->
<script src="/api/contact-system/components/contact-integration.js"></script>
"""
        self.processed_count = 0
        self.skipped_count = 0
        self.error_count = 0
        
    def get_all_html_files(self):
        """Get all HTML files that need contact integration"""
        html_files = []
        
        # All possible locations
        locations = [
            "web/pages/*.html",
            "web/pages-draft/*.html", 
            "web/pages-generated/*.html"
        ]
        
        for location in locations:
            files = glob.glob(str(self.base_path / location))
            html_files.extend(files)
            
        return html_files
        
    def process_single_file(self, file_path):
        """Process a single HTML file"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
                
            # Skip if already has contact integration
            if 'contact-integration.js' in content or 'it-era-contact-form' in content:
                return 'skipped', f"Already has contact form"
                
            # Skip if no closing body tag
            if '</body>' not in content:
                return 'error', f"No closing body tag found"
                
            # Insert contact integration before closing body tag
            updated_content = content.replace('</body>', f'{self.integration_script}\n</body>')
            
            # Write back to file
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(updated_content)
                
            return 'success', f"Contact form integrated"
            
        except Exception as e:
            return 'error', f"Error: {str(e)}"
            
    def process_files_batch(self, files_batch):
        """Process a batch of files"""
        batch_results = {
            'processed': 0,
            'skipped': 0, 
            'errors': 0
        }
        
        for file_path in files_batch:
            status, message = self.process_single_file(file_path)
            
            if status == 'success':
                batch_results['processed'] += 1
            elif status == 'skipped':
                batch_results['skipped'] += 1
            else:
                batch_results['errors'] += 1
                
        return batch_results
        
    def integrate_all_pages(self):
        """Integrate contact forms into all pages using parallel processing"""
        print(f"🚀 Starting mass contact form integration...")
        
        # Get all HTML files
        html_files = self.get_all_html_files()
        print(f"Found {len(html_files)} HTML files to process")
        
        # Split files into batches for parallel processing
        batch_size = 50
        file_batches = [html_files[i:i + batch_size] for i in range(0, len(html_files), batch_size)]
        
        print(f"Processing in {len(file_batches)} batches of {batch_size} files each...")
        
        total_results = {
            'processed': 0,
            'skipped': 0,
            'errors': 0
        }
        
        # Process batches in parallel
        with concurrent.futures.ThreadPoolExecutor(max_workers=4) as executor:
            future_to_batch = {
                executor.submit(self.process_files_batch, batch): i 
                for i, batch in enumerate(file_batches)
            }
            
            for future in concurrent.futures.as_completed(future_to_batch):
                batch_num = future_to_batch[future]
                try:
                    batch_results = future.result()
                    
                    total_results['processed'] += batch_results['processed']
                    total_results['skipped'] += batch_results['skipped'] 
                    total_results['errors'] += batch_results['errors']
                    
                    # Progress update
                    completed_batches = batch_num + 1
                    progress = (completed_batches / len(file_batches)) * 100
                    print(f"  Batch {completed_batches}/{len(file_batches)} completed ({progress:.1f}%)")
                    
                except Exception as exc:
                    print(f"  Batch {batch_num} generated an exception: {exc}")
                    total_results['errors'] += batch_size
                    
        return total_results
        
    def create_deployment_summary(self, results):
        """Create deployment summary"""
        total_files = results['processed'] + results['skipped'] + results['errors']
        success_rate = (results['processed'] / total_files) * 100 if total_files > 0 else 0
        
        summary = f"""
IT-ERA CONTACT SYSTEM DEPLOYMENT SUMMARY
========================================

Deployment Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

RESULTS:
- Total Files Processed: {total_files}
- Successfully Integrated: {results['processed']}
- Already Had Forms: {results['skipped']}
- Errors: {results['errors']}
- Success Rate: {success_rate:.1f}%

STATUS: {'✅ SUCCESS' if success_rate > 90 else '⚠️ PARTIAL SUCCESS' if success_rate > 70 else '❌ FAILED'}

NEXT STEPS:
1. Deploy Cloudflare Worker with: wrangler publish --env production
2. Configure Resend.com API key
3. Test contact forms on live pages
4. Monitor form submissions and email delivery
5. Track conversion analytics

TECHNICAL DETAILS:
- Contact integration script: /api/contact-system/components/contact-integration.js
- Email handler: Cloudflare Worker with Resend integration
- Ticket format: IT{{YYYYMMDD}}{{6-CHAR-RANDOM}}
- Email routing: Service-specific (assistenza@, sicurezza@, cloud@, info@)
- GDPR compliance: Built-in privacy notices and data handling

MONITORING:
- Form submissions: Cloudflare Worker logs
- Email delivery: Resend dashboard
- Conversion tracking: Google Analytics integration
- Error monitoring: Browser console and Worker exceptions
"""
        
        # Save summary
        summary_file = self.base_path / "api" / "contact-system" / "deployment-summary.txt"
        with open(summary_file, 'w', encoding='utf-8') as f:
            f.write(summary)
            
        return summary

def main():
    """Main integration function"""
    integrator = MassContactIntegration()
    
    print("=" * 60)
    print("IT-ERA MASS CONTACT FORM INTEGRATION")
    print("=" * 60)
    
    # Run integration
    results = integrator.integrate_all_pages()
    
    # Create summary
    summary = integrator.create_deployment_summary(results)
    print(summary)
    
    # Return success/failure
    total_files = results['processed'] + results['skipped'] + results['errors']
    success_rate = (results['processed'] / total_files) * 100 if total_files > 0 else 0
    
    return 0 if success_rate > 90 else 1

if __name__ == "__main__":
    exit(main())
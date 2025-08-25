#!/usr/bin/env python3
"""
HIVESTORM FINAL CLEANUP for IT-ERA
Handles remaining pages.dev references in JSON-LD, script tags, and other locations
"""

import os
import re
import glob
import time

class HIVESTORMFinalCleanup:
    def __init__(self, root_directory, production_domain="it-era.it"):
        self.root_directory = root_directory
        self.production_domain = production_domain
        self.fixed_count = 0
        self.error_count = 0
        self.total_files = 0
        self.start_time = time.time()
        
        # Additional patterns for remaining references
        self.cleanup_patterns = [
            # JSON-LD structured data
            (r'"url":\s*"https://it-era\.pages\.dev([^"]*)"', 
             lambda m: f'"url": "https://{self.production_domain}{self.clean_path(m.group(1))}"'),
            
            # JavaScript variables
            (r'var\s+\w+\s*=\s*["\']https://it-era\.pages\.dev([^"\']*)["\']', 
             lambda m: f'var url = "https://{self.production_domain}{self.clean_path(m.group(1))}"'),
            
            # Any remaining href links
            (r'https://it-era\.pages\.dev/pages/([^"\'>\s]*)', 
             lambda m: f'https://{self.production_domain}/{m.group(1).replace(".html", "")}'),
             
            # Any remaining src references
            (r'https://it-era\.pages\.dev/images/', 
             lambda m: f'https://{self.production_domain}/images/'),
             
            # Phone number updates (if using old number)
            (r'\+39\s*012\s*3456789', '+39 039 888 2041'),
            (r'012\s*3456789', '039 888 2041'),
        ]
        
    def clean_path(self, path):
        """Clean and normalize URL paths"""
        # Remove .html extension for clean URLs
        if path.endswith('.html'):
            path = path.replace('.html', '')
        
        # Handle directory variations
        path_mappings = [
            ('/pages-generated/', '/'),
            ('/pages-draft/', '/'),
            ('/pages/', '/'),
        ]
        
        for old_path, new_path in path_mappings:
            if old_path in path:
                path = path.replace(old_path, new_path)
                break
        
        # Ensure path starts with /
        if not path.startswith('/'):
            path = '/' + path
            
        # Remove double slashes
        path = re.sub(r'/+', '/', path)
        
        return path
    
    def find_files_with_references(self):
        """Find files that still contain pages.dev references"""
        files_with_refs = []
        
        for root, dirs, files in os.walk(self.root_directory):
            if 'backup' in root:
                continue
                
            for file in files:
                if file.endswith('.html'):
                    file_path = os.path.join(root, file)
                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if 'it-era.pages.dev' in content:
                                files_with_refs.append(file_path)
                    except:
                        continue
        
        return files_with_refs
    
    def process_file(self, file_path):
        """Process a single HTML file for remaining references"""
        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()
            
            original_content = content
            
            # Apply cleanup patterns
            for pattern in self.cleanup_patterns:
                if isinstance(pattern, tuple) and len(pattern) == 2:
                    regex_pattern, replacement_func = pattern
                    if callable(replacement_func):
                        content = re.sub(regex_pattern, replacement_func, content)
                    else:
                        content = re.sub(regex_pattern, replacement_func, content)
                elif isinstance(pattern, tuple) and len(pattern) == 2:
                    old_pattern, new_pattern = pattern
                    content = content.replace(old_pattern, new_pattern)
            
            # Write back if changed
            if content != original_content:
                with open(file_path, 'w', encoding='utf-8') as f:
                    f.write(content)
                
                self.fixed_count += 1
                return True
            
            return False
            
        except Exception as e:
            print(f"❌ Error processing {file_path}: {e}")
            self.error_count += 1
            return False
    
    def run_cleanup(self):
        """Execute the final cleanup"""
        print("🚀 HIVESTORM FINAL CLEANUP STARTING")
        print("=" * 60)
        print(f"📁 Root directory: {self.root_directory}")
        print(f"🌐 Target domain: {self.production_domain}")
        print("🎯 Cleaning up remaining references:")
        print("   • JSON-LD structured data")
        print("   • JavaScript variables")
        print("   • Remaining href/src attributes")
        print("   • Phone numbers")
        print("=" * 60)
        
        # Find files with remaining references
        files_to_process = self.find_files_with_references()
        self.total_files = len(files_to_process)
        
        print(f"📊 Found {self.total_files} files with remaining references")
        print("🔧 Processing files...")
        print("-" * 40)
        
        # Process files
        for file_path in files_to_process:
            self.process_file(file_path)
            
            if self.fixed_count > 0 and self.fixed_count % 100 == 0:
                print(f"✅ Cleaned {self.fixed_count} files...")
        
        # Final verification
        print("\n🔍 Final verification...")
        remaining_refs = 0
        try:
            result = os.popen(f'grep -r "it-era.pages.dev" {self.root_directory} --include="*.html" --exclude-dir=backup | wc -l').read().strip()
            remaining_refs = int(result)
        except:
            pass
        
        # Final summary
        elapsed = time.time() - self.start_time
        print("\n" + "=" * 60)
        print("🎉 HIVESTORM FINAL CLEANUP COMPLETE!")
        print("=" * 60)
        print(f"✅ Files Cleaned: {self.fixed_count}")
        print(f"❌ Errors: {self.error_count}")
        print(f"📊 Total Files Processed: {self.total_files}")
        print(f"🔍 Remaining pages.dev refs: {remaining_refs}")
        print(f"⏱️  Execution Time: {elapsed:.2f} seconds")
        
        if remaining_refs == 0:
            print("🎯 HIVESTORM Task #1 - COMPLETE! All references cleaned!")
        else:
            print(f"⚠️  {remaining_refs} references need manual review")
        
        print("=" * 60)
        
        return self.fixed_count, self.error_count, remaining_refs


def main():
    root_path = '/Users/andreapanzeri/progetti/IT-ERA'
    
    if not os.path.exists(root_path):
        print(f"❌ Directory not found: {root_path}")
        return 1
    
    # Execute final cleanup
    cleanup = HIVESTORMFinalCleanup(root_path)
    fixed, errors, remaining = cleanup.run_cleanup()
    
    if remaining == 0:
        print("🎯 HIVESTORM Task #1: ✅ COMPLETE!")
        return 0
    else:
        print(f"⚠️  Task #1: {remaining} references need review")
        return 1


if __name__ == "__main__":
    exit(main())
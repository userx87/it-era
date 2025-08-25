#!/usr/bin/env python3
"""
HIVESTORM COMPLETE FINAL - Handle remaining edge cases
Blog posts and test reports
"""

import os
import re

def fix_remaining_references():
    """Fix the final 25 references"""
    
    patterns = [
        # Blog @id references
        (r'"@id":\s*"https://it-era\.pages\.dev/blog/([^"]*)"', 
         r'"@id": "https://it-era.it/blog/\1"'),
        
        # Test report URLs
        (r'https://65e7c6fa\.it-era\.pages\.dev/pages/', 
         'https://it-era.it/'),
         
        # Any remaining pages.dev references
        (r'https://it-era\.pages\.dev/([^"\'>\s]*)', 
         r'https://it-era.it/\1'),
    ]
    
    fixed_count = 0
    
    # Process blog files
    blog_dir = '/Users/andreapanzeri/progetti/IT-ERA/web/blog'
    if os.path.exists(blog_dir):
        for file in os.listdir(blog_dir):
            if file.endswith('.html'):
                file_path = os.path.join(blog_dir, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original = content
                    for pattern, replacement in patterns:
                        content = re.sub(pattern, replacement, content)
                    
                    if content != original:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        fixed_count += 1
                        print(f"✅ Fixed blog file: {file}")
                except Exception as e:
                    print(f"❌ Error with {file}: {e}")
    
    # Process test report files
    test_reports = '/Users/andreapanzeri/progetti/IT-ERA/tests/puppeteer/reports'
    if os.path.exists(test_reports):
        for file in os.listdir(test_reports):
            if file.endswith('.html'):
                file_path = os.path.join(test_reports, file)
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    original = content
                    for pattern, replacement in patterns:
                        content = re.sub(pattern, replacement, content)
                    
                    if content != original:
                        with open(file_path, 'w', encoding='utf-8') as f:
                            f.write(content)
                        fixed_count += 1
                        print(f"✅ Fixed test report: {file}")
                except Exception as e:
                    print(f"❌ Error with {file}: {e}")
    
    return fixed_count

if __name__ == "__main__":
    print("🚀 HIVESTORM COMPLETE FINAL - Fixing remaining references")
    print("=" * 60)
    
    fixed = fix_remaining_references()
    
    print(f"\n✅ Fixed {fixed} files")
    
    # Final check
    result = os.popen('grep -r "it-era.pages.dev" /Users/andreapanzeri/progetti/IT-ERA --include="*.html" --exclude-dir=backup | wc -l').read().strip()
    remaining = int(result)
    
    print(f"🔍 Remaining references: {remaining}")
    
    if remaining == 0:
        print("🎯 HIVESTORM Task #1: ✅ 100% COMPLETE!")
    else:
        print(f"⚠️  {remaining} references still remain")
    
    print("=" * 60)
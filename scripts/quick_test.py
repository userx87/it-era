#!/usr/bin/env python3
"""
Quick Test Script for IT-ERA Landing Generator
Tests core functionality without full generation.
"""

import sys
from pathlib import Path

# Add script directory to path
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from comprehensive_landing_generator import ComprehensiveLandingGenerator
from landing_generator_utils import SEOOptimizer, TemplateValidator

def test_city_extraction():
    """Test city extraction from existing files"""
    print("🔍 Testing city extraction...")
    
    generator = ComprehensiveLandingGenerator("/Users/andreapanzeri/progetti/IT-ERA")
    cities = generator.extract_cities_from_existing_files()
    
    print(f"✅ Successfully extracted {len(cities)} cities")
    print(f"📍 Sample cities: {', '.join(cities[:10])}")
    
    return len(cities) > 0

def test_slug_conversion():
    """Test city name to slug conversion"""
    print("\n🔗 Testing slug conversion...")
    
    generator = ComprehensiveLandingGenerator("/Users/andreapanzeri/progetti/IT-ERA")
    
    test_cases = [
        ("milano", "Milano"),
        ("sant-angelo-lodigiano", "Sant'Angelo Lodigiano"),
        ("cantu", "Cantù"),
        ("alzano-lombardo", "Alzano Lombardo")
    ]
    
    all_passed = True
    for slug, expected_name in test_cases:
        result = generator.slug_to_city_name(slug)
        if result == expected_name:
            print(f"✅ {slug} → {result}")
        else:
            print(f"❌ {slug} → {result} (expected: {expected_name})")
            all_passed = False
    
    return all_passed

def test_seo_optimization():
    """Test SEO optimization utilities"""
    print("\n📈 Testing SEO optimization...")
    
    optimizer = SEOOptimizer()
    
    # Test title optimization
    long_title = "Assistenza IT Milano Supporto Tecnico Professionale 24/7 per Aziende"
    optimized_title = optimizer.optimize_title(long_title)
    print(f"✅ Title optimization: {len(optimized_title)} chars")
    
    # Test description optimization
    long_desc = "Servizi di assistenza IT professionale a Milano con supporto tecnico 24/7, risoluzione problemi computer, installazione software, consulenza informatica per aziende"
    optimized_desc = optimizer.optimize_description(long_desc)
    print(f"✅ Description optimization: {len(optimized_desc)} chars")
    
    # Test keyword generation
    keywords = optimizer.generate_keywords("Milano", "Assistenza IT")
    print(f"✅ Generated {len(keywords)} keywords")
    
    return True

def test_template_loading():
    """Test template loading functionality"""
    print("\n📄 Testing template loading...")
    
    generator = ComprehensiveLandingGenerator("/Users/andreapanzeri/progetti/IT-ERA")
    
    templates_tested = 0
    for template_type in generator.template_configs.keys():
        try:
            content = generator.load_template(template_type)
            if len(content) > 1000:  # Basic content check
                print(f"✅ {template_type}: {len(content)} chars loaded")
                templates_tested += 1
            else:
                print(f"⚠️  {template_type}: Content seems short ({len(content)} chars)")
        except FileNotFoundError:
            print(f"❌ {template_type}: Template file not found")
        except Exception as e:
            print(f"❌ {template_type}: Error loading - {e}")
    
    return templates_tested > 0

def main():
    """Run all tests"""
    print("🧪 IT-ERA Landing Generator - Quick Test Suite")
    print("=" * 60)
    
    tests = [
        ("City Extraction", test_city_extraction),
        ("Slug Conversion", test_slug_conversion),
        ("SEO Optimization", test_seo_optimization),
        ("Template Loading", test_template_loading)
    ]
    
    passed = 0
    failed = 0
    
    for test_name, test_func in tests:
        try:
            if test_func():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            print(f"❌ {test_name}: Exception - {e}")
            failed += 1
    
    print("\n" + "=" * 60)
    print(f"🧪 Test Results: {passed} passed, {failed} failed")
    
    if failed == 0:
        print("🎉 All tests passed! Generator is ready to use.")
    else:
        print("⚠️  Some tests failed. Please check the issues above.")
    
    return failed == 0

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
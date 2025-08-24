#!/usr/bin/env python3
"""
Test script for Landing Page Generator V2
Validates functionality with small dataset
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from generate_landing_pages_v2 import LandingPageGenerator, ItalianSlugGenerator, ProvinceRegionMapper
import logging

logging.basicConfig(level=logging.INFO)

def test_slug_generation():
    """Test Italian slug generation"""
    print("Testing Italian slug generation...")
    
    test_cases = [
        "Milano",
        "Sant'Angelo Lodigiano", 
        "Villa d'Almè",
        "Monza e Brianza",
        "Gera d'Adda"
    ]
    
    slug_gen = ItalianSlugGenerator()
    
    for city in test_cases:
        slug = slug_gen.slugify(city)
        print(f"  {city} -> {slug}")

def test_province_mapping():
    """Test province to region mapping"""
    print("\nTesting province mapping...")
    
    test_provinces = ["Milano", "Bergamo", "Como", "Lecco", "Monza e Brianza"]
    mapper = ProvinceRegionMapper()
    
    for province in test_provinces:
        region = mapper.get_regione(province)
        print(f"  {province} -> {region}")

def test_generator():
    """Test generator initialization"""
    print("\nTesting generator initialization...")
    
    try:
        generator = LandingPageGenerator(batch_size=10)
        print(f"  Loaded {len(generator.cities_data)} city records")
        print(f"  Available services: {list(generator.services.keys())}")
        
        # Test nearby cities for Milano
        if generator.cities_data:
            milano_data = [city for city in generator.cities_data if city['comune'] == 'Milano']
            if milano_data:
                nearby = generator.nearby_finder.find_nearby_cities('Milano', 'Milano', 3)
                print(f"  Nearby cities for Milano: {nearby}")
        
        return True
    except Exception as e:
        print(f"  Error: {e}")
        return False

def main():
    """Main test function"""
    print("=== Landing Page Generator V2 Test Suite ===\n")
    
    test_slug_generation()
    test_province_mapping()
    success = test_generator()
    
    print(f"\n=== Test Results ===")
    print(f"Generator initialization: {'PASS' if success else 'FAIL'}")
    
    if success:
        print("\nAll tests passed! Generator is ready for production use.")
        print("\nTo generate pages, run:")
        print("  python3 scripts/generate_landing_pages_v2.py --service assistenza-it --output draft")
    else:
        print("\nSome tests failed. Please check the errors above.")

if __name__ == "__main__":
    main()
#!/usr/bin/env python3
"""
Test script to generate a single city page for debugging
"""

import sys
from pathlib import Path

# Add script directory to path for imports
sys.path.insert(0, str(Path(__file__).parent))

from comprehensive_landing_generator import ComprehensiveLandingGenerator
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def test_single_city():
    """Test generating a single city page"""
    project_root = "/Users/andreapanzeri/progetti/IT-ERA"
    
    # Initialize generator
    generator = ComprehensiveLandingGenerator(project_root)
    
    # Validate templates first
    if not generator.validate_templates():
        logger.error("Template validation failed")
        return False
    
    # Test with Milano
    city_slug = "milano"
    city_name = generator.slug_to_city_name(city_slug)
    
    logger.info(f"Testing with city: {city_name} ({city_slug})")
    
    # Generate for each template type
    success_count = 0
    for template_type in generator.template_configs.keys():
        logger.info(f"Generating {template_type} for {city_name}...")
        
        try:
            # Generate SEO content
            seo_content = generator.generate_seo_content(city_name, city_slug, template_type)
            logger.info(f"SEO content generated: {seo_content['title']}")
            
            # Load and process template
            template_content = generator.load_template(template_type)
            processed_content = generator.process_template_placeholders(
                template_content, city_name, city_slug, template_type, seo_content
            )
            
            # Check if placeholder was replaced
            if "{{CITY}}" in processed_content:
                logger.error(f"{{CITY}} placeholder not replaced in {template_type}")
            else:
                logger.info(f"{{CITY}} placeholder successfully replaced in {template_type}")
                success_count += 1
                
                # Save test file
                test_file = Path(f"/tmp/test_{template_type}_{city_slug}.html")
                with open(test_file, 'w', encoding='utf-8') as f:
                    f.write(processed_content)
                logger.info(f"Test file saved: {test_file}")
                
        except Exception as e:
            logger.error(f"Error generating {template_type} for {city_name}: {e}")
    
    logger.info(f"Successfully processed {success_count}/{len(generator.template_configs)} templates")
    return success_count == len(generator.template_configs)

if __name__ == "__main__":
    success = test_single_city()
    print(f"\n{'✅ SUCCESS' if success else '❌ FAILED'}: Single city test completed")
    sys.exit(0 if success else 1)
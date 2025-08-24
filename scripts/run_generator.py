#!/usr/bin/env python3
"""
IT-ERA Landing Generator Runner
Main script to execute the comprehensive landing page generation with advanced features.

Author: Claude Code
Version: 2.0
Date: 2025-01-24
"""

import sys
import os
import json
import argparse
from pathlib import Path

# Add script directory to path for imports
script_dir = Path(__file__).parent
sys.path.insert(0, str(script_dir))

from comprehensive_landing_generator import ComprehensiveLandingGenerator
from landing_generator_utils import (
    SEOOptimizer, ContactFormIntegrator, TemplateValidator,
    PerformanceAnalyzer, create_robots_txt, create_htaccess
)

def load_config(config_path: Path) -> dict:
    """Load configuration from JSON file"""
    if not config_path.exists():
        raise FileNotFoundError(f"Configuration file not found: {config_path}")
    
    with open(config_path, 'r', encoding='utf-8') as f:
        return json.load(f)

def setup_logging(log_level: str = "INFO", log_file: Path = None):
    """Setup enhanced logging configuration"""
    import logging
    
    # Create logs directory if it doesn't exist
    if log_file:
        log_file.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure logging
    logging.basicConfig(
        level=getattr(logging, log_level.upper()),
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.FileHandler(log_file) if log_file else logging.NullHandler(),
            logging.StreamHandler(sys.stdout)
        ]
    )

def run_comprehensive_generation(config: dict, project_root: Path, args: argparse.Namespace) -> dict:
    """Run the comprehensive generation process with all features"""
    
    # Initialize generator with configuration
    generator = ComprehensiveLandingGenerator(str(project_root))
    generator.config = config
    
    # Override template configurations with config file
    generator.template_configs.update(config.get('templates', {}))
    
    # Validate templates if requested
    if args.validate_only:
        print("🔍 Running template validation only...")
        
        if generator.validate_templates():
            print("✅ All templates are valid!")
            return {'validation': 'success'}
        else:
            print("❌ Template validation failed!")
            return {'validation': 'failed'}
    
    # Run full generation process
    print("🚀 Starting comprehensive landing page generation...")
    
    # Pre-generation setup
    if config['generation_settings']['create_backup']:
        generator.create_backup()
    
    # Extract cities (with filtering if specified)
    cities = generator.extract_cities_from_existing_files()
    
    if args.cities:
        # Filter to specific cities if requested
        requested_cities = [city.strip() for city in args.cities.split(',')]
        cities = [city for city in cities if any(req.lower() in city.lower() for req in requested_cities)]
        print(f"🎯 Filtering to {len(cities)} cities: {', '.join(cities[:5])}{'...' if len(cities) > 5 else ''}")
    
    if args.templates:
        # Filter to specific templates if requested
        requested_templates = [template.strip() for template in args.templates.split(',')]
        original_configs = generator.template_configs.copy()
        generator.template_configs = {k: v for k, v in original_configs.items() if k in requested_templates}
        print(f"📄 Filtering to templates: {', '.join(requested_templates)}")
    
    # Run the generation
    report = generator.run_comprehensive_generation()
    
    # Post-generation enhancements
    if not args.skip_seo_files:
        print("📄 Creating additional SEO files...")
        web_dir = project_root / "web"
        
        if config['generation_settings']['generate_robots_txt']:
            create_robots_txt(web_dir)
            print("✅ robots.txt created")
        
        if config['generation_settings']['generate_htaccess']:
            create_htaccess(web_dir)
            print("✅ .htaccess created")
    
    # Run quality analysis if requested
    if args.analyze_quality:
        print("📊 Running quality analysis...")
        run_quality_analysis(project_root, cities, generator.template_configs.keys())
    
    return report

def run_quality_analysis(project_root: Path, cities: list, templates: list):
    """Run comprehensive quality analysis on generated pages"""
    
    pages_dir = project_root / "web" / "pages"
    analyzer = PerformanceAnalyzer()
    validator = TemplateValidator()
    seo_optimizer = SEOOptimizer()
    
    total_pages = 0
    total_score = 0
    issues_summary = {}
    
    print(f"\n📊 Quality Analysis Report")
    print("=" * 60)
    
    for city in cities[:10]:  # Analyze first 10 cities as sample
        for template in templates:
            page_file = pages_dir / f"{template}-{city}.html"
            
            if not page_file.exists():
                continue
            
            try:
                with open(page_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # SEO Analysis
                seo_score, seo_issues = validator.validate_seo_optimization(content)
                
                # Performance Analysis
                perf_analysis = analyzer.analyze_page_size(content)
                
                # Structure Validation
                is_valid_structure, structure_issues = validator.validate_html_structure(content)
                
                total_pages += 1
                total_score += seo_score
                
                # Collect issues
                for issue in seo_issues + structure_issues:
                    issues_summary[issue] = issues_summary.get(issue, 0) + 1
                
                # Print individual page results (only for first few)
                if total_pages <= 5:
                    print(f"  📄 {page_file.name}")
                    print(f"     SEO Score: {seo_score}/100")
                    print(f"     Size: {perf_analysis['size_kb']} KB ({perf_analysis['size_rating']})")
                    print(f"     Structure: {'✅' if is_valid_structure else '❌'}")
                
            except Exception as e:
                print(f"  ❌ Error analyzing {page_file.name}: {e}")
    
    # Summary
    if total_pages > 0:
        avg_score = total_score / total_pages
        print(f"\n📈 Summary for {total_pages} pages analyzed:")
        print(f"   Average SEO Score: {avg_score:.1f}/100")
        print(f"   Overall Rating: {'🟢 Excellent' if avg_score >= 80 else '🟡 Good' if avg_score >= 60 else '🔴 Needs Improvement'}")
        
        if issues_summary:
            print(f"\n⚠️  Common Issues Found:")
            for issue, count in sorted(issues_summary.items(), key=lambda x: x[1], reverse=True)[:5]:
                print(f"   • {issue}: {count} pages")

def main():
    """Main execution function with argument parsing"""
    
    parser = argparse.ArgumentParser(
        description="IT-ERA Comprehensive Landing Page Generator",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python run_generator.py                          # Generate all pages
  python run_generator.py --cities "milano,como"  # Generate only for specific cities
  python run_generator.py --templates "assistenza-it"  # Generate only specific template
  python run_generator.py --validate-only         # Only validate templates
  python run_generator.py --analyze-quality       # Include quality analysis
  python run_generator.py --skip-seo-files        # Skip robots.txt and .htaccess
        """
    )
    
    parser.add_argument(
        '--config', 
        type=Path, 
        default=Path(__file__).parent / 'generator_config.json',
        help='Path to configuration file (default: generator_config.json)'
    )
    
    parser.add_argument(
        '--cities',
        type=str,
        help='Comma-separated list of cities to process (default: all)'
    )
    
    parser.add_argument(
        '--templates',
        type=str,
        help='Comma-separated list of templates to process (default: all)'
    )
    
    parser.add_argument(
        '--validate-only',
        action='store_true',
        help='Only validate templates, do not generate pages'
    )
    
    parser.add_argument(
        '--analyze-quality',
        action='store_true',
        help='Run quality analysis after generation'
    )
    
    parser.add_argument(
        '--skip-seo-files',
        action='store_true',
        help='Skip generation of robots.txt and .htaccess files'
    )
    
    parser.add_argument(
        '--log-level',
        choices=['DEBUG', 'INFO', 'WARNING', 'ERROR'],
        default='INFO',
        help='Set logging level (default: INFO)'
    )
    
    parser.add_argument(
        '--project-root',
        type=Path,
        default=Path("/Users/andreapanzeri/progetti/IT-ERA"),
        help='Project root directory'
    )
    
    args = parser.parse_args()
    
    # Load configuration
    try:
        config = load_config(args.config)
        print(f"✅ Configuration loaded from: {args.config}")
    except Exception as e:
        print(f"❌ Error loading configuration: {e}")
        return False
    
    # Setup logging
    log_file = args.project_root / config['output_directories']['logs'] / 'generator.log'
    setup_logging(args.log_level, log_file)
    
    # Verify project structure
    if not args.project_root.exists():
        print(f"❌ Project root not found: {args.project_root}")
        return False
    
    templates_dir = args.project_root / "templates"
    if not templates_dir.exists():
        print(f"❌ Templates directory not found: {templates_dir}")
        return False
    
    print(f"🏗️  Project root: {args.project_root}")
    print(f"📁 Templates directory: {templates_dir}")
    
    # Run the generation
    try:
        report = run_comprehensive_generation(config, args.project_root, args)
        
        # Display results
        if 'error' in report:
            print(f"\n❌ Generation failed: {report['error']}")
            return False
        
        if 'validation' in report:
            return report['validation'] == 'success'
        
        # Success report
        print("\n" + "="*60)
        print("🎉 GENERATION COMPLETED SUCCESSFULLY!")
        print("="*60)
        print(f"⏱️  Execution time: {report['execution_time']}")
        print(f"🏙️  Cities processed: {report['cities_processed']}")
        print(f"📄 Pages generated: {report['total_pages_generated']}")
        print(f"📈 Success rate: {report['success_rate']:.1f}%")
        print(f"⚠️  Errors: {report['errors']}")
        print(f"⚠️  Warnings: {report['warnings']}")
        print(f"💾 Backup location: {report['backup_location']}")
        
        return True
        
    except Exception as e:
        print(f"❌ Critical error: {e}")
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)
#!/usr/bin/env python3
"""
Performance Monitoring for Landing Page Generator V2
Real-time monitoring and analytics
"""

import os
import sys
import time
import json
from pathlib import Path
from datetime import datetime, timedelta
import logging

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger('GenerationMonitor')

ROOT_DIR = Path(__file__).resolve().parents[1]
LOGS_DIR = ROOT_DIR / "logs"
WEB_DIR = ROOT_DIR / "web"

class GenerationMonitor:
    """Monitor landing page generation performance"""
    
    def __init__(self):
        self.start_time = None
        self.metrics = {
            'pages_generated': 0,
            'errors_count': 0,
            'avg_generation_time': 0,
            'memory_usage': 0,
            'processing_rate': 0
        }
    
    def start_monitoring(self):
        """Start monitoring session"""
        self.start_time = datetime.now()
        logger.info("Starting generation monitoring...")
    
    def analyze_logs(self, log_pattern: str = "landing_generator_v2_*.log"):
        """Analyze generation logs"""
        log_files = list(LOGS_DIR.glob(log_pattern))
        
        if not log_files:
            logger.warning("No log files found matching pattern")
            return {}
        
        # Get most recent log file
        latest_log = max(log_files, key=lambda f: f.stat().st_mtime)
        logger.info(f"Analyzing log file: {latest_log.name}")
        
        metrics = {
            'total_processed': 0,
            'successful': 0,
            'failed': 0,
            'processing_time': 0,
            'errors': []
        }
        
        try:
            with open(latest_log, 'r', encoding='utf-8') as f:
                for line in f:
                    if 'Progress:' in line:
                        # Extract progress info
                        if 'Success:' in line:
                            parts = line.split('Success:')[1].split(',')[0].strip()
                            try:
                                metrics['successful'] = int(parts)
                            except ValueError:
                                pass
                    elif 'ERROR' in line:
                        metrics['errors'].append(line.strip())
                        metrics['failed'] += 1
                    elif 'completed successfully' in line:
                        metrics['total_processed'] = metrics['successful']
        
        except Exception as e:
            logger.error(f"Error analyzing logs: {e}")
        
        return metrics
    
    def check_output_quality(self):
        """Check quality of generated pages"""
        quality_metrics = {
            'total_pages': 0,
            'valid_html': 0,
            'missing_placeholders': 0,
            'avg_file_size': 0,
            'services_coverage': {}
        }
        
        # Check pages directory
        pages_dir = WEB_DIR / "pages"
        if pages_dir.exists():
            html_files = list(pages_dir.glob("*.html"))
            quality_metrics['total_pages'] = len(html_files)
            
            # Analyze file sizes
            if html_files:
                total_size = sum(f.stat().st_size for f in html_files)
                quality_metrics['avg_file_size'] = total_size / len(html_files)
            
            # Check services coverage
            services = ['assistenza-it', 'cloud-storage', 'sicurezza-informatica']
            for service in services:
                service_files = list(pages_dir.glob(f"{service}-*.html"))
                quality_metrics['services_coverage'][service] = len(service_files)
            
            # Sample file quality check
            sample_size = min(10, len(html_files))
            valid_count = 0
            placeholder_issues = 0
            
            for html_file in html_files[:sample_size]:
                try:
                    with open(html_file, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Basic HTML validation
                    if '<html' in content and '</html>' in content:
                        valid_count += 1
                    
                    # Check for unprocessed placeholders
                    if '{{' in content:
                        placeholder_issues += 1
                        
                except Exception as e:
                    logger.warning(f"Error checking {html_file.name}: {e}")
            
            if sample_size > 0:
                quality_metrics['valid_html'] = (valid_count / sample_size) * 100
                quality_metrics['missing_placeholders'] = placeholder_issues
        
        return quality_metrics
    
    def check_sitemap_health(self):
        """Check sitemap.xml health"""
        sitemap_path = WEB_DIR / "sitemap.xml"
        sitemap_metrics = {
            'exists': False,
            'url_count': 0,
            'last_modified': None,
            'valid_xml': False,
            'recent_updates': 0
        }
        
        if sitemap_path.exists():
            sitemap_metrics['exists'] = True
            sitemap_metrics['last_modified'] = datetime.fromtimestamp(
                sitemap_path.stat().st_mtime
            ).strftime('%Y-%m-%d %H:%M:%S')
            
            try:
                with open(sitemap_path, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Count URLs
                sitemap_metrics['url_count'] = content.count('<loc>')
                
                # Check XML validity
                if '<?xml' in content and '<urlset' in content:
                    sitemap_metrics['valid_xml'] = True
                
                # Check for recent updates (today)
                today = datetime.now().strftime('%Y-%m-%d')
                sitemap_metrics['recent_updates'] = content.count(today)
                
            except Exception as e:
                logger.error(f"Error analyzing sitemap: {e}")
        
        return sitemap_metrics
    
    def generate_report(self):
        """Generate comprehensive monitoring report"""
        logger.info("Generating monitoring report...")
        
        # Collect all metrics
        log_metrics = self.analyze_logs()
        quality_metrics = self.check_output_quality()
        sitemap_metrics = self.check_sitemap_health()
        
        # Generate report
        report = {
            'timestamp': datetime.now().isoformat(),
            'monitoring_session': {
                'start_time': self.start_time.isoformat() if self.start_time else None,
                'duration': str(datetime.now() - self.start_time).split('.')[0] if self.start_time else None
            },
            'log_analysis': log_metrics,
            'quality_check': quality_metrics,
            'sitemap_health': sitemap_metrics,
            'overall_status': self._calculate_overall_status(log_metrics, quality_metrics, sitemap_metrics)
        }
        
        # Save report
        report_file = LOGS_DIR / f"monitoring_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        try:
            with open(report_file, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            
            logger.info(f"Monitoring report saved: {report_file.name}")
        except Exception as e:
            logger.error(f"Error saving report: {e}")
        
        return report
    
    def _calculate_overall_status(self, log_metrics, quality_metrics, sitemap_metrics):
        """Calculate overall system status"""
        status = {
            'health_score': 0,
            'issues': [],
            'recommendations': []
        }
        
        score = 0
        max_score = 100
        
        # Log analysis scoring (30 points)
        if log_metrics.get('successful', 0) > 0:
            success_rate = log_metrics['successful'] / max(1, log_metrics.get('total_processed', 1))
            score += success_rate * 30
            
            if success_rate < 0.9:
                status['issues'].append(f"Low success rate: {success_rate:.2%}")
                status['recommendations'].append("Check error logs and fix template issues")
        
        # Quality scoring (40 points)
        if quality_metrics.get('total_pages', 0) > 0:
            score += min(40, quality_metrics['total_pages'] / 10)  # 10 pages = full score
            
            if quality_metrics.get('valid_html', 0) < 90:
                status['issues'].append("HTML validation issues detected")
                status['recommendations'].append("Review template syntax and placeholder processing")
            
            if quality_metrics.get('missing_placeholders', 0) > 0:
                status['issues'].append("Unprocessed placeholders found")
                status['recommendations'].append("Update template processing logic")
        
        # Sitemap scoring (30 points)
        if sitemap_metrics.get('exists'):
            score += 10
            if sitemap_metrics.get('valid_xml'):
                score += 10
            if sitemap_metrics.get('url_count', 0) > 100:
                score += 10
        else:
            status['issues'].append("Sitemap missing or invalid")
            status['recommendations'].append("Ensure sitemap generation is working correctly")
        
        status['health_score'] = min(100, score)
        
        # Overall status
        if status['health_score'] >= 90:
            status['overall'] = 'EXCELLENT'
        elif status['health_score'] >= 75:
            status['overall'] = 'GOOD'
        elif status['health_score'] >= 50:
            status['overall'] = 'FAIR'
        else:
            status['overall'] = 'POOR'
        
        return status
    
    def print_report(self, report):
        """Print formatted monitoring report"""
        print("\n" + "="*60)
        print("LANDING PAGE GENERATION - MONITORING REPORT")
        print("="*60)
        
        # Overall status
        overall = report['overall_status']
        print(f"\n🎯 OVERALL STATUS: {overall['overall']} ({overall['health_score']}/100)")
        
        # Log analysis
        log_data = report['log_analysis']
        print(f"\n📊 GENERATION METRICS:")
        print(f"   ✅ Successful: {log_data.get('successful', 0)}")
        print(f"   ❌ Failed: {log_data.get('failed', 0)}")
        print(f"   📈 Total Processed: {log_data.get('total_processed', 0)}")
        
        # Quality metrics
        quality_data = report['quality_check']
        print(f"\n📄 QUALITY METRICS:")
        print(f"   📝 Total Pages: {quality_data.get('total_pages', 0)}")
        print(f"   ✅ Valid HTML: {quality_data.get('valid_html', 0):.1f}%")
        print(f"   📏 Avg File Size: {quality_data.get('avg_file_size', 0)/1024:.1f} KB")
        
        # Services coverage
        coverage = quality_data.get('services_coverage', {})
        if coverage:
            print(f"   🎯 Service Coverage:")
            for service, count in coverage.items():
                print(f"      {service}: {count} pages")
        
        # Sitemap health
        sitemap_data = report['sitemap_health']
        print(f"\n🗺️  SITEMAP HEALTH:")
        print(f"   ✅ Exists: {'Yes' if sitemap_data.get('exists') else 'No'}")
        print(f"   🔗 URLs: {sitemap_data.get('url_count', 0)}")
        print(f"   🕒 Last Modified: {sitemap_data.get('last_modified', 'Unknown')}")
        print(f"   📅 Recent Updates: {sitemap_data.get('recent_updates', 0)}")
        
        # Issues and recommendations
        if overall.get('issues'):
            print(f"\n⚠️  ISSUES DETECTED:")
            for issue in overall['issues']:
                print(f"   • {issue}")
        
        if overall.get('recommendations'):
            print(f"\n💡 RECOMMENDATIONS:")
            for rec in overall['recommendations']:
                print(f"   • {rec}")
        
        print("\n" + "="*60)

def main():
    """Main monitoring function"""
    monitor = GenerationMonitor()
    monitor.start_monitoring()
    
    print("Landing Page Generation Monitor")
    print("Analyzing current system state...\n")
    
    # Generate and display report
    report = monitor.generate_report()
    monitor.print_report(report)
    
    # Save JSON report location
    print(f"\n📁 Detailed report saved in: logs/")
    print(f"🔍 For detailed analysis, check the generated JSON report.")

if __name__ == "__main__":
    main()
# IT-ERA Comprehensive Landing Page Generator

## Overview

This comprehensive Python script system generates SEO-optimized landing pages for all Lombardy cities using three production-ready templates. The system is designed for scalability, maintainability, and production-readiness.

## Features

### 🎯 Core Functionality
- **Multiple Template Support**: Uses assistenza-it, sicurezza-informatica, and cloud-storage templates
- **City Auto-Detection**: Extracts city names from existing files for consistency
- **Dual Directory Generation**: Creates both `web/pages/` (production) and `web/pages-draft/` (staging) versions
- **Sitemap Integration**: Automatically updates sitemap.xml with generated pages
- **SEO Optimization**: Complete meta tags, Schema.org markup, Open Graph tags

### 🚀 Advanced Features
- **Backup System**: Creates timestamped backups before generation
- **Template Validation**: Validates templates before processing
- **Content Validation**: Comprehensive validation of generated content
- **Performance Analysis**: Analyzes page size and optimization
- **Quality Scoring**: SEO scoring system (0-100 points)
- **Error Handling**: Robust error handling with detailed logging
- **Progress Tracking**: Real-time progress with statistics

### 📊 SEO & Optimization
- **Schema.org LocalBusiness**: Automatic structured data generation
- **Open Graph Tags**: Complete social media optimization
- **Meta Optimization**: Title (30-60 chars), description (120-160 chars)
- **Canonical URLs**: Proper canonical URL structure
- **Mobile Optimization**: Bootstrap-based responsive design
- **Accessibility**: WCAG compliance checks

## File Structure

```
scripts/
├── comprehensive_landing_generator.py    # Main generator class
├── landing_generator_utils.py           # Utility functions and classes
├── generator_config.json               # Configuration file
├── run_generator.py                    # Main execution script
└── README_GENERATOR.md                 # This documentation

logs/                                   # Generated log files
backup/                                # Automatic backups
templates/                             # Source templates
├── assistenza-it-template-new.html
├── sicurezza-informatica-modern.html
└── cloud-storage-perfect.html
```

## Usage Examples

### Basic Generation (All Cities, All Templates)
```bash
python scripts/run_generator.py
```

### Specific Cities Only
```bash
python scripts/run_generator.py --cities "milano,como,lecco"
```

### Specific Templates Only
```bash
python scripts/run_generator.py --templates "assistenza-it,sicurezza-informatica"
```

### Template Validation Only
```bash
python scripts/run_generator.py --validate-only
```

### With Quality Analysis
```bash
python scripts/run_generator.py --analyze-quality
```

### Development Mode (Skip SEO Files)
```bash
python scripts/run_generator.py --skip-seo-files --cities "milano"
```

### Custom Configuration
```bash
python scripts/run_generator.py --config custom_config.json
```

## Configuration

The `generator_config.json` file contains all configuration options:

### Template Configuration
```json
{
  "templates": {
    "assistenza-it": {
      "file": "assistenza-it-template-new.html",
      "service_name": "Assistenza IT",
      "service_description": "Support description...",
      "keywords_base": ["assistenza it", "supporto tecnico"],
      "seo_priority": 1.0
    }
  }
}
```

### SEO Settings
```json
{
  "seo_settings": {
    "title_max_length": 60,
    "description_max_length": 160,
    "keywords_max_count": 10,
    "minimum_word_count": 800
  }
}
```

### Company Information
```json
{
  "company": {
    "name": "IT-ERA",
    "phone": "+39 039 888 2041",
    "email": "andrea@bulltech.it",
    "address": {
      "street": "Viale Risorgimento 32",
      "city": "Vimercate",
      "postal_code": "20871",
      "province": "MB"
    }
  }
}
```

## Template Requirements

Templates must include these placeholders:

### Required Placeholders
- `{{CITY}}` - City name (e.g., "Milano")
- `{{CITY_SLUG}}` - URL-friendly city slug (e.g., "milano")
- `{{SERVICE_TYPE}}` - Service type name
- `{{REGION}}` - Region name (always "Lombardia")

### SEO Placeholders
- `{{SEO_TITLE}}` - Optimized page title
- `{{SEO_DESCRIPTION}}` - Meta description
- `{{SEO_KEYWORDS}}` - Keywords list
- `{{CANONICAL_URL}}` - Canonical URL
- `{{OG_IMAGE}}` - Open Graph image URL

### Company Placeholders
- `{{EMAIL}}` - Contact email (andrea@bulltech.it)
- `{{PHONE}}` - Phone number (+39 039 888 2041)
- `{{COMPANY}}` - Company name (IT-ERA)
- `{{CURRENT_YEAR}}` - Current year

## Generated Content Structure

Each generated page includes:

### HTML Structure
- HTML5 doctype with Italian language
- Complete head section with meta tags
- Responsive Bootstrap framework
- Accessibility features (skip links, ARIA labels)
- Structured data (Schema.org LocalBusiness)

### SEO Elements
- Optimized title tag (30-60 characters)
- Meta description (120-160 characters)
- Keywords meta tag
- Canonical URL
- Open Graph tags (title, description, type, url, image)
- Twitter Card tags

### Schema.org Markup
```json
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "IT-ERA - Service City",
  "address": {
    "@type": "PostalAddress",
    "addressLocality": "City",
    "addressRegion": "Lombardia",
    "addressCountry": "IT"
  },
  "telephone": "+39 039 888 2041",
  "url": "canonical-url",
  "serviceArea": {
    "@type": "City",
    "name": "City"
  }
}
```

## Validation System

### Template Validation
- Checks for required placeholders
- Validates HTML structure
- Ensures accessibility compliance
- Verifies mobile optimization

### Content Validation
- Placeholder replacement verification
- HTML structure validation
- SEO element presence check
- Content length validation
- Email integration verification

### Quality Analysis
- SEO scoring (0-100 points)
- Performance analysis (page size, resources)
- Accessibility audit
- Mobile optimization check
- Internal linking analysis

## Error Handling

### Backup System
- Automatic backup creation before generation
- Timestamped backup directories
- Full directory structure preservation

### Logging
- Comprehensive logging to file and console
- Different log levels (DEBUG, INFO, WARNING, ERROR)
- Structured log format with timestamps
- Error tracking and statistics

### Validation Failures
- Template validation failures stop generation
- Content validation issues are logged as warnings
- Critical errors trigger backup restoration hints

## Email Integration

### Contact Form Support
- JavaScript form handlers included
- Resend API integration ready
- AJAX form submission
- Success/error messaging
- Conversion tracking (Google Analytics/GTM)

### Form Validation
- Client-side validation
- Honeypot spam protection
- Required field checking
- Email format validation
- Message length limits

## Performance Optimization

### Generated Files
- Optimized HTML structure
- Efficient CSS/JS loading
- Compressed assets support
- Lazy loading where applicable

### SEO Files Generated
- `robots.txt` with proper directives
- `.htaccess` with compression and caching
- Sitemap.xml with proper priorities
- Security headers configuration

## City Name Handling

### Special Cases
The system handles Italian city names with special characters:
- `d-adda` → `d'Adda`
- `cantu` → `Cantù`
- `sant-angelo-lodigiano` → `Sant'Angelo Lodigiano`

### Slug Generation
- Unicode normalization
- Special character handling
- Hyphen-separated lowercase format
- URL-safe encoding

## Statistics and Reporting

### Generation Report
```
Execution time: 0:02:34
Cities processed: 257
Pages generated: 1542
Success rate: 99.2%
Errors: 2
Warnings: 15
```

### Quality Analysis
- Average SEO score across all pages
- Common issues identification
- Performance metrics summary
- Accessibility compliance rate

## Troubleshooting

### Common Issues

1. **Template Not Found**
   - Check template file names in config
   - Verify templates directory path
   - Ensure file permissions are correct

2. **City Extraction Fails**
   - Verify existing files in web/pages/
   - Check file naming pattern (assistenza-it-*.html)
   - Ensure proper file encoding

3. **Validation Errors**
   - Check template placeholder syntax
   - Verify HTML structure completeness
   - Review required meta tags presence

4. **Sitemap Update Fails**
   - Check XML file permissions
   - Verify sitemap.xml format
   - Ensure UTF-8 encoding

### Recovery Procedures

1. **Restore from Backup**
   ```bash
   cp -r backup/generator_backup_TIMESTAMP/* web/
   ```

2. **Re-run with Validation**
   ```bash
   python scripts/run_generator.py --validate-only
   ```

3. **Selective Regeneration**
   ```bash
   python scripts/run_generator.py --cities "failed-city" --templates "failed-template"
   ```

## Maintenance

### Regular Tasks
- Update templates with new features
- Review SEO scores and optimize
- Monitor error logs for issues
- Update city lists as needed
- Refresh configuration settings

### Template Updates
1. Backup current templates
2. Update template files
3. Run validation tests
4. Regenerate affected pages
5. Monitor for issues

### Performance Monitoring
- Check page load speeds
- Monitor SEO scores
- Analyze user engagement
- Review accessibility compliance

## Extension Points

### Adding New Templates
1. Create template file in templates/
2. Add configuration to generator_config.json
3. Test with validation tools
4. Run generation for test cities

### Adding New Regions
1. Update regions section in config
2. Add city mappings if needed
3. Update SEO keywords
4. Test with sample cities

### Custom Validation Rules
1. Add rules to validation_rules in config
2. Implement in TemplateValidator class
3. Test with existing pages
4. Update documentation

## Security Considerations

### Input Validation
- City names are validated against existing files
- Template content is sanitized
- File paths are normalized

### Output Security
- Generated HTML is properly escaped
- No user input in generated content
- Secure file permissions set

### Contact Form Security
- CSRF protection available
- Input sanitization
- Rate limiting suggested
- Spam protection included

## License and Support

This generator is part of the IT-ERA project. For support:
- Check logs directory for error details
- Review validation reports
- Contact: andrea@bulltech.it
- Phone: +39 039 888 2041

---

**Generated by Claude Code - IT-ERA Landing Page Generator v2.0**
*Production-ready solution for scalable landing page generation*
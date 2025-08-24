# IT-ERA Template Test Suite

Comprehensive testing suite for IT-ERA landing page templates covering SEO optimization, accessibility compliance (WCAG AAA), performance optimization, conversion optimization, and production readiness.

## 🧪 Test Coverage

### Template Quality Testing
- ✅ **SEO Optimization**: Meta tags, schema.org markup, heading hierarchy
- ✅ **Form Functionality**: Resend API integration, validation, GDPR compliance  
- ✅ **Mobile Responsiveness**: Viewport, touch targets, responsive design
- ✅ **Template Placeholders**: {{CITY}}, {{REGION}}, {{CITY_SLUG}} functionality
- ✅ **Conversion Optimization**: CTAs, trust signals, pricing transparency

### Accessibility Testing (WCAG AAA)
- ✅ **Perceivable**: Alt text, color contrast, text scaling
- ✅ **Operable**: Keyboard navigation, focus indicators, timing
- ✅ **Understandable**: Language, form instructions, consistency
- ✅ **Robust**: Valid markup, assistive technology compatibility

### Performance Testing
- ✅ **Core Web Vitals**: LCP, CLS, FID measurements
- ✅ **Load Time Analysis**: DOM load, resource optimization
- ✅ **Mobile Performance**: Touch targets, responsive optimization
- ✅ **Resource Optimization**: External dependencies, image optimization

## 🚀 Quick Start

### Installation
```bash
cd tests
npm run install-deps
```

### Run All Tests
```bash
npm test
# or
node run-all-tests.js
```

### Run Individual Test Suites
```bash
# Template quality tests (SEO, forms, conversion, placeholders)
npm run test:templates

# Accessibility tests (WCAG AAA compliance)
npm run test:accessibility

# Performance tests (Core Web Vitals, load times)
npm run test:performance
```

## 📊 Generated Reports

After running tests, the following reports are generated in the `/tests` directory:

### Executive Reports
- **master-test-report-YYYY-MM-DD.html** - Executive summary with business readiness assessment
- **business-summary-YYYY-MM-DD.csv** - Spreadsheet-ready business metrics

### Detailed Technical Reports  
- **template-test-report-YYYY-MM-DD.html** - Complete template quality analysis
- **accessibility-report-YYYY-MM-DD.html** - WCAG AAA compliance details
- **performance-report-YYYY-MM-DD.html** - Performance metrics and recommendations

### JSON Data
- **master-test-report-YYYY-MM-DD.json** - Complete test results data
- **template-test-report-YYYY-MM-DD.json** - Template quality data
- **accessibility-report-YYYY-MM-DD.json** - Accessibility test data
- **performance-report-YYYY-MM-DD.json** - Performance test data

## 📋 Templates Tested

1. **assistenza-it-template-new.html** - IT Support template
2. **sicurezza-informatica-modern.html** - Cybersecurity template  
3. **cloud-storage-perfect.html** - Cloud Storage template

## 🎯 Test Categories

### SEO Optimization Tests
- Meta title and description optimization
- Schema.org structured data validation
- Open Graph and Twitter Card tags
- Canonical URLs and robots directives
- Heading hierarchy (H1-H6) validation

### Form Functionality Tests
- Contact form presence and validation
- Required field configuration
- Privacy consent (GDPR compliance)
- Resend API integration verification
- Form submission error handling

### Mobile Responsiveness Tests
- Viewport meta tag configuration
- Bootstrap responsive grid usage
- Touch target size validation (44px minimum)
- Mobile navigation implementation
- CSS media query coverage

### WCAG AAA Accessibility Tests
- **Level A Requirements**: Alt text, keyboard access, form labels
- **Level AA Requirements**: Color contrast (4.5:1), text scaling, focus indicators  
- **Level AAA Requirements**: Enhanced contrast (7:1), comprehensive navigation

### Performance Optimization Tests
- External resource count and CDN usage
- Image optimization (lazy loading, WebP format)
- JavaScript loading (defer/async attributes)
- CSS size analysis and optimization
- Core Web Vitals measurement

### Conversion Optimization Tests
- Primary CTA button placement and count
- Phone number click-to-call functionality
- Trust signals (testimonials, ratings, certifications)
- Pricing transparency and visibility
- Urgency/scarcity messaging elements

### Template Placeholder Tests
- {{CITY}} placeholder coverage and usage
- {{REGION}} placeholder implementation
- {{CITY_SLUG}} URL generation support
- Hardcoded city name detection
- Template consistency validation

## 📈 Scoring System

### Overall Template Scores
- **90-100%**: Excellent (Production Ready)
- **80-89%**: Good (Minor fixes recommended)
- **70-79%**: Fair (Needs improvement)
- **Below 70%**: Poor (Major fixes required)

### Business Readiness Categories
- **🟢 Production Ready**: Score ≥90%, no critical issues
- **🟡 Needs Minor Fixes**: Score ≥80%, no critical issues, <2h fixes
- **🔴 Needs Major Fixes**: Score <80% or critical issues present, >4h fixes

## 🔧 Customization

### Adding New Templates
1. Add template path to the `templates` array in each test suite
2. Configure expected CTAs and specific validation rules
3. Update the template count in business assessment

### Modifying Test Criteria
- **SEO Tests**: Update criteria in `testSEOOptimization()` method
- **Accessibility Tests**: Modify WCAG requirements in `testWCAGCompliance()`
- **Performance Tests**: Adjust thresholds in benchmark configuration
- **Business Rules**: Update scoring logic in `assessBusinessReadiness()`

## 🚨 Common Issues & Solutions

### High Priority Fixes
1. **Missing Alt Text**: Add descriptive alt attributes to all images
2. **Form Label Issues**: Associate labels with form controls using `for`/`id`
3. **Color Contrast**: Ensure 7:1 contrast ratio for WCAG AAA compliance
4. **Missing Skip Links**: Add skip navigation for keyboard users
5. **Performance Issues**: Optimize images and reduce external dependencies

### Template Placeholder Issues
- Ensure {{CITY}} appears in title, H1, and key content areas
- Replace hardcoded "Milano" with {{CITY}} placeholders
- Add {{CITY_SLUG}} for URL generation in canonical and Open Graph tags

## 📞 Support

For questions about the test suite or results interpretation:
- Review generated HTML reports for specific recommendations
- Check JSON files for detailed technical data
- Consult WCAG guidelines for accessibility requirements
- Use performance benchmarks for optimization priorities

## 🔄 Continuous Integration

To integrate with CI/CD pipeline:
```bash
# Add to your build script
npm run test
if [ $? -eq 0 ]; then
  echo "✅ All template tests passed"
else
  echo "❌ Template tests failed - check reports"
  exit 1
fi
```

## 📊 Metrics Tracking

The test suite tracks:
- **Quality Score Trends**: Monitor improvements over time
- **Business Readiness**: Track production-ready template count
- **Issue Resolution**: Measure fix implementation success
- **Performance Benchmarks**: Monitor Core Web Vitals improvements

---

**Generated by IT-ERA Template Test Suite v1.0.0**  
*Ensuring production-ready, accessible, and high-performing landing pages*
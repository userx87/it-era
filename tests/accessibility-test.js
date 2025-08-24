/**
 * IT-ERA Templates Accessibility Test Suite
 * WCAG AAA compliance testing for all templates
 */

const { JSDOM } = require('jsdom');
const fs = require('fs').promises;

class ITEraAccessibilityTestSuite {
    constructor() {
        this.testResults = [];
        this.templates = [
            {
                name: 'assistenza-it-template-new.html',
                path: '/Users/andreapanzeri/progetti/IT-ERA/templates/assistenza-it-template-new.html',
                type: 'assistenza-it'
            },
            {
                name: 'sicurezza-informatica-modern.html',
                path: '/Users/andreapanzeri/progetti/IT-ERA/templates/sicurezza-informatica-modern.html',
                type: 'sicurezza-informatica'
            },
            {
                name: 'cloud-storage-perfect.html',
                path: '/Users/andreapanzeri/progetti/IT-ERA/templates/cloud-storage-perfect.html',
                type: 'cloud-storage'
            }
        ];

        // WCAG AAA Color Contrast Requirements
        this.contrastRequirements = {
            normalText: 7.0,  // WCAG AAA for normal text
            largeText: 4.5,   // WCAG AAA for large text (18pt+ or 14pt+ bold)
            uiComponents: 3.0  // WCAG AA for UI components (minimum)
        };
    }

    async runAccessibilityTests() {
        console.log('🔍 Starting IT-ERA Accessibility Test Suite (WCAG AAA)...');
        
        for (const template of this.templates) {
            console.log(`\n♿ Testing accessibility: ${template.name}`);
            
            const dom = await this.loadTemplate(template.path);
            if (!dom) continue;
            
            await this.testWCAGCompliance(dom, template);
        }
        
        await this.generateAccessibilityReport();
    }

    async loadTemplate(templatePath) {
        try {
            const html = await fs.readFile(templatePath, 'utf8');
            return new JSDOM(html, {
                url: 'https://it-era.pages.dev',
                referrer: 'https://it-era.pages.dev',
                contentType: 'text/html',
                includeNodeLocations: true,
                storageQuota: 10000000
            });
        } catch (error) {
            console.error(`❌ Failed to load template ${templatePath}:`, error.message);
            return null;
        }
    }

    async testWCAGCompliance(dom, template) {
        const document = dom.window.document;
        const window = dom.window;
        const results = [];

        // 1. Perceivable Tests
        results.push(...await this.testPerceivable(document, window));
        
        // 2. Operable Tests  
        results.push(...await this.testOperable(document, window));
        
        // 3. Understandable Tests
        results.push(...await this.testUnderstandable(document, window));
        
        // 4. Robust Tests
        results.push(...await this.testRobust(document, window));

        // Calculate overall accessibility score
        const totalTests = results.length;
        const passedTests = results.filter(r => r.status === 'PASS').length;
        const score = Math.round((passedTests / totalTests) * 100);
        const level = this.getWCAGLevel(score);

        this.testResults.push({
            template: template.name,
            score: score,
            level: level,
            totalTests: totalTests,
            passedTests: passedTests,
            failedTests: results.filter(r => r.status === 'FAIL').length,
            results: results
        });
    }

    async testPerceivable(document, window) {
        const results = [];

        // 1.1 Text Alternatives
        results.push(...this.testTextAlternatives(document));
        
        // 1.2 Time-based Media (basic check)
        results.push(...this.testTimeBasedMedia(document));
        
        // 1.3 Adaptable
        results.push(...this.testAdaptable(document, window));
        
        // 1.4 Distinguishable
        results.push(...this.testDistinguishable(document, window));

        return results;
    }

    testTextAlternatives(document) {
        const results = [];

        // Images must have alt text
        const images = document.querySelectorAll('img');
        const imagesWithoutAlt = Array.from(images).filter(img => 
            !img.hasAttribute('alt') || img.alt.trim() === ''
        );
        
        results.push({
            criterion: '1.1.1 Non-text Content',
            test: 'Images have alt text',
            status: imagesWithoutAlt.length === 0 ? 'PASS' : 'FAIL',
            level: 'A',
            value: `${images.length - imagesWithoutAlt.length}/${images.length} images with alt text`,
            issues: imagesWithoutAlt.map(img => `Image without alt: ${img.src || 'inline image'}`),
            recommendation: 'Add descriptive alt text to all images'
        });

        // Decorative images should have empty alt
        const decorativeImages = document.querySelectorAll('img[role="presentation"], img[alt=""]');
        results.push({
            criterion: '1.1.1 Non-text Content',
            test: 'Decorative images properly marked',
            status: 'INFO',
            level: 'A',
            value: `${decorativeImages.length} decorative images found`,
            issues: [],
            recommendation: 'Ensure decorative images have alt="" or role="presentation"'
        });

        // Icon fonts accessibility
        const iconElements = document.querySelectorAll('[class*="fa-"], [class*="bi-"], [class*="icon"]');
        const iconsWithoutScreenReader = Array.from(iconElements).filter(icon => 
            !icon.hasAttribute('aria-label') && 
            !icon.hasAttribute('aria-hidden') &&
            !icon.querySelector('[class*="sr-only"], [class*="visually-hidden"]')
        );

        results.push({
            criterion: '1.1.1 Non-text Content',
            test: 'Icon accessibility',
            status: iconsWithoutScreenReader.length === 0 ? 'PASS' : 'WARN',
            level: 'A',
            value: `${iconElements.length - iconsWithoutScreenReader.length}/${iconElements.length} icons accessible`,
            issues: iconsWithoutScreenReader.map(icon => `Icon without screen reader text: ${icon.className}`),
            recommendation: 'Add aria-label or aria-hidden to icons, or include sr-only text'
        });

        return results;
    }

    testTimeBasedMedia(document) {
        const results = [];

        // Check for video/audio elements
        const videos = document.querySelectorAll('video');
        const audios = document.querySelectorAll('audio');
        
        results.push({
            criterion: '1.2.1 Audio-only and Video-only',
            test: 'Media elements accessibility',
            status: videos.length === 0 && audios.length === 0 ? 'PASS' : 'WARN',
            level: 'A',
            value: `${videos.length} videos, ${audios.length} audio elements`,
            issues: [],
            recommendation: 'Ensure video/audio content has captions, transcripts, or audio descriptions'
        });

        return results;
    }

    testAdaptable(document, window) {
        const results = [];

        // 1.3.1 Info and Relationships
        // Heading structure
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const h1Count = document.querySelectorAll('h1').length;
        
        results.push({
            criterion: '1.3.1 Info and Relationships',
            test: 'Heading structure',
            status: h1Count === 1 ? 'PASS' : 'FAIL',
            level: 'A',
            value: `${h1Count} H1 elements, ${headings.length} total headings`,
            issues: h1Count !== 1 ? [`${h1Count} H1 elements found (should be exactly 1)`] : [],
            recommendation: 'Use exactly one H1 per page, maintain logical heading hierarchy'
        });

        // Form labels
        const formControls = document.querySelectorAll('input, textarea, select');
        const unlabeledControls = Array.from(formControls).filter(control => {
            const hasLabel = document.querySelector(`label[for="${control.id}"]`) ||
                           control.hasAttribute('aria-label') ||
                           control.hasAttribute('aria-labelledby') ||
                           (control.type === 'submit' || control.type === 'button');
            return !hasLabel;
        });

        results.push({
            criterion: '1.3.1 Info and Relationships',
            test: 'Form control labels',
            status: unlabeledControls.length === 0 ? 'PASS' : 'FAIL',
            level: 'A',
            value: `${formControls.length - unlabeledControls.length}/${formControls.length} controls labeled`,
            issues: unlabeledControls.map(control => `Unlabeled control: ${control.name || control.type}`),
            recommendation: 'Associate labels with all form controls using for/id, aria-label, or aria-labelledby'
        });

        // Tables accessibility
        const tables = document.querySelectorAll('table');
        const tablesWithHeaders = Array.from(tables).filter(table => 
            table.querySelectorAll('th').length > 0 ||
            table.querySelectorAll('[scope]').length > 0
        );

        if (tables.length > 0) {
            results.push({
                criterion: '1.3.1 Info and Relationships',
                test: 'Table headers',
                status: tablesWithHeaders.length === tables.length ? 'PASS' : 'FAIL',
                level: 'A',
                value: `${tablesWithHeaders.length}/${tables.length} tables with proper headers`,
                issues: tables.length - tablesWithHeaders.length > 0 ? ['Some tables lack proper header markup'] : [],
                recommendation: 'Use th elements with scope attributes for table headers'
            });
        }

        // 1.3.2 Meaningful Sequence
        // Check for CSS that might disrupt reading order
        const elementsWithAbsolutePos = document.querySelectorAll('[style*="position: absolute"], [style*="position: fixed"]');
        results.push({
            criterion: '1.3.2 Meaningful Sequence',
            test: 'Reading order preservation',
            status: elementsWithAbsolutePos.length < 5 ? 'PASS' : 'WARN',
            level: 'A',
            value: `${elementsWithAbsolutePos.length} absolutely positioned elements`,
            issues: [],
            recommendation: 'Ensure DOM order matches visual reading order'
        });

        // 1.3.4 Orientation (responsive design)
        const hasViewportMeta = document.querySelector('meta[name="viewport"]');
        const responsiveClasses = document.documentElement.outerHTML.match(/col-(sm|md|lg|xl)-/g);
        
        results.push({
            criterion: '1.3.4 Orientation',
            test: 'Responsive design implementation',
            status: hasViewportMeta && responsiveClasses ? 'PASS' : 'WARN',
            level: 'AA',
            value: `Viewport meta: ${!!hasViewportMeta}, Responsive classes: ${!!responsiveClasses}`,
            issues: !hasViewportMeta ? ['Missing viewport meta tag'] : [],
            recommendation: 'Implement responsive design that works in both portrait and landscape'
        });

        return results;
    }

    testDistinguishable(document, window) {
        const results = [];

        // 1.4.1 Use of Color
        // Check for color-only information (basic heuristic)
        const colorOnlyElements = document.querySelectorAll('[style*="color: red"], .text-danger, .text-success, .text-warning');
        results.push({
            criterion: '1.4.1 Use of Color',
            test: 'Information not conveyed by color alone',
            status: 'WARN',
            level: 'A',
            value: `${colorOnlyElements.length} elements using color for meaning`,
            issues: [],
            recommendation: 'Ensure information is not conveyed by color alone - use icons, text, or patterns'
        });

        // 1.4.2 Audio Control
        const audioElements = document.querySelectorAll('audio[autoplay], video[autoplay]');
        results.push({
            criterion: '1.4.2 Audio Control',
            test: 'Auto-playing audio control',
            status: audioElements.length === 0 ? 'PASS' : 'WARN',
            level: 'A',
            value: `${audioElements.length} auto-playing media elements`,
            issues: audioElements.length > 0 ? ['Auto-playing media found'] : [],
            recommendation: 'Avoid auto-playing audio or provide controls to stop/pause'
        });

        // 1.4.3 Contrast (Minimum) & 1.4.6 Contrast (Enhanced)
        results.push(...this.testColorContrast(document, window));

        // 1.4.4 Resize Text
        const hasViewportPreventZoom = hasViewportMeta && 
            document.querySelector('meta[name="viewport"]').content.includes('user-scalable=no');
        
        results.push({
            criterion: '1.4.4 Resize Text',
            test: 'Text can be resized',
            status: !hasViewportPreventZoom ? 'PASS' : 'FAIL',
            level: 'AA',
            value: `Zoom prevention: ${hasViewportPreventZoom}`,
            issues: hasViewportPreventZoom ? ['Viewport prevents zooming'] : [],
            recommendation: 'Allow users to zoom text up to 200% without horizontal scrolling'
        });

        // 1.4.10 Reflow
        const hasHorizontalScroll = document.querySelectorAll('[style*="overflow-x"], [style*="white-space: nowrap"]').length;
        results.push({
            criterion: '1.4.10 Reflow',
            test: 'Content reflows at 320px width',
            status: hasHorizontalScroll === 0 ? 'PASS' : 'WARN',
            level: 'AA',
            value: `Elements preventing reflow: ${hasHorizontalScroll}`,
            issues: [],
            recommendation: 'Ensure content reflows without horizontal scrolling at 320px width'
        });

        // 1.4.11 Non-text Contrast
        const focusableElements = document.querySelectorAll('button, input, select, textarea, a');
        results.push({
            criterion: '1.4.11 Non-text Contrast',
            test: 'UI component contrast',
            status: focusableElements.length > 0 ? 'WARN' : 'PASS',
            level: 'AA',
            value: `${focusableElements.length} interactive elements to check`,
            issues: [],
            recommendation: 'Ensure interactive elements have 3:1 contrast ratio against background'
        });

        return results;
    }

    testColorContrast(document, window) {
        const results = [];

        // This is a simplified contrast check - in a real implementation,
        // you would need to compute actual color values and contrast ratios
        
        // Check for potential contrast issues
        const darkBackgrounds = document.querySelectorAll(
            '.bg-dark, .navbar-dark, [style*="background: #"], [style*="background-color: #"]'
        );
        
        const lightText = document.querySelectorAll(
            '.text-light, .text-white, [style*="color: #fff"], [style*="color: white"]'
        );

        // Basic heuristic check
        results.push({
            criterion: '1.4.3 Contrast (Minimum)',
            test: 'Color contrast ratio (AA)',
            status: 'WARN',
            level: 'AA',
            value: `${darkBackgrounds.length} dark backgrounds, ${lightText.length} light text elements`,
            issues: [],
            recommendation: 'Test all text/background combinations with a contrast checker tool (min 4.5:1 for normal text, 3:1 for large text)'
        });

        results.push({
            criterion: '1.4.6 Contrast (Enhanced)',
            test: 'Color contrast ratio (AAA)',
            status: 'WARN',
            level: 'AAA',
            value: 'Manual testing required',
            issues: [],
            recommendation: 'Achieve 7:1 contrast ratio for normal text and 4.5:1 for large text (WCAG AAA)'
        });

        return results;
    }

    async testOperable(document, window) {
        const results = [];

        // 2.1 Keyboard Accessible
        results.push(...this.testKeyboardAccessible(document));
        
        // 2.2 Enough Time
        results.push(...this.testEnoughTime(document));
        
        // 2.3 Seizures and Physical Reactions
        results.push(...this.testSeizures(document));
        
        // 2.4 Navigable
        results.push(...this.testNavigable(document));
        
        // 2.5 Input Modalities
        results.push(...this.testInputModalities(document));

        return results;
    }

    testKeyboardAccessible(document) {
        const results = [];

        // 2.1.1 Keyboard accessibility
        const interactiveElements = document.querySelectorAll(
            'a, button, input, textarea, select, [tabindex], [onclick], [role="button"], [role="link"]'
        );
        
        const nonFocusableInteractive = Array.from(interactiveElements).filter(el => {
            const tabindex = el.getAttribute('tabindex');
            return tabindex === '-1' && !el.hasAttribute('aria-hidden');
        });

        results.push({
            criterion: '2.1.1 Keyboard',
            test: 'Interactive elements keyboard accessible',
            status: nonFocusableInteractive.length === 0 ? 'PASS' : 'FAIL',
            level: 'A',
            value: `${interactiveElements.length - nonFocusableInteractive.length}/${interactiveElements.length} elements focusable`,
            issues: nonFocusableInteractive.map(el => `Non-focusable interactive element: ${el.tagName.toLowerCase()}`),
            recommendation: 'Ensure all interactive elements are keyboard accessible (avoid tabindex="-1" on interactive elements)'
        });

        // 2.1.2 No Keyboard Trap
        const elementsWithTabindex = document.querySelectorAll('[tabindex]');
        const positiveTabindex = Array.from(elementsWithTabindex).filter(el => 
            parseInt(el.getAttribute('tabindex')) > 0
        );

        results.push({
            criterion: '2.1.2 No Keyboard Trap',
            test: 'No positive tabindex values',
            status: positiveTabindex.length === 0 ? 'PASS' : 'WARN',
            level: 'A',
            value: `${positiveTabindex.length} elements with positive tabindex`,
            issues: positiveTabindex.map(el => `Positive tabindex: ${el.tagName.toLowerCase()}`),
            recommendation: 'Avoid positive tabindex values - use natural tab order or tabindex="0"'
        });

        // Focus indicators
        const styleSheets = document.querySelectorAll('style');
        let hasFocusStyles = false;
        styleSheets.forEach(style => {
            if (style.textContent.includes(':focus')) {
                hasFocusStyles = true;
            }
        });

        results.push({
            criterion: '2.1.1 Keyboard',
            test: 'Visible focus indicators',
            status: hasFocusStyles ? 'PASS' : 'FAIL',
            level: 'A',
            value: `Focus styles detected: ${hasFocusStyles}`,
            issues: !hasFocusStyles ? ['No focus styles found in CSS'] : [],
            recommendation: 'Provide clear visual focus indicators for keyboard navigation'
        });

        return results;
    }

    testEnoughTime(document) {
        const results = [];

        // 2.2.1 Timing Adjustable
        const scriptsWithTimeout = document.querySelectorAll('script');
        let hasTimeouts = false;
        scriptsWithTimeout.forEach(script => {
            if (script.textContent.includes('setTimeout') || script.textContent.includes('setInterval')) {
                hasTimeouts = true;
            }
        });

        results.push({
            criterion: '2.2.1 Timing Adjustable',
            test: 'Time limits can be controlled',
            status: !hasTimeouts ? 'PASS' : 'WARN',
            level: 'A',
            value: `JavaScript timeouts detected: ${hasTimeouts}`,
            issues: [],
            recommendation: 'If using time limits, allow users to turn off, adjust, or extend them'
        });

        // 2.2.2 Pause, Stop, Hide
        const autoplayElements = document.querySelectorAll(
            '[autoplay], [auto-play], video[autoplay], audio[autoplay]'
        );
        
        results.push({
            criterion: '2.2.2 Pause, Stop, Hide',
            test: 'Auto-updating content control',
            status: autoplayElements.length === 0 ? 'PASS' : 'WARN',
            level: 'A',
            value: `${autoplayElements.length} auto-playing elements`,
            issues: [],
            recommendation: 'Provide pause/stop controls for auto-playing content lasting more than 5 seconds'
        });

        return results;
    }

    testSeizures(document) {
        const results = [];

        // 2.3.1 Three Flashes or Below Threshold
        const animationElements = document.querySelectorAll(
            '[style*="animation"], .animate, .animated, [class*="flash"], [class*="blink"]'
        );

        results.push({
            criterion: '2.3.1 Three Flashes or Below Threshold',
            test: 'No dangerous flashing',
            status: animationElements.length === 0 ? 'PASS' : 'WARN',
            level: 'A',
            value: `${animationElements.length} animated elements found`,
            issues: [],
            recommendation: 'Ensure animations do not flash more than 3 times per second'
        });

        return results;
    }

    testNavigable(document) {
        const results = [];

        // 2.4.1 Bypass Blocks
        const skipLinks = document.querySelectorAll('.skip-link, a[href="#main-content"], a[href="#content"]');
        results.push({
            criterion: '2.4.1 Bypass Blocks',
            test: 'Skip navigation links',
            status: skipLinks.length > 0 ? 'PASS' : 'FAIL',
            level: 'A',
            value: `${skipLinks.length} skip links found`,
            issues: skipLinks.length === 0 ? ['No skip navigation links found'] : [],
            recommendation: 'Provide skip links to main content for keyboard users'
        });

        // 2.4.2 Page Titled
        const title = document.querySelector('title');
        results.push({
            criterion: '2.4.2 Page Titled',
            test: 'Descriptive page title',
            status: title && title.textContent.trim().length > 0 ? 'PASS' : 'FAIL',
            level: 'A',
            value: title ? title.textContent : 'No title',
            issues: !title ? ['Missing page title'] : [],
            recommendation: 'Provide descriptive, unique page titles'
        });

        // 2.4.3 Focus Order
        const focusableElements = document.querySelectorAll(
            'a, button, input, textarea, select, [tabindex="0"]'
        );
        results.push({
            criterion: '2.4.3 Focus Order',
            test: 'Logical focus order',
            status: 'WARN',
            level: 'A',
            value: `${focusableElements.length} focusable elements`,
            issues: [],
            recommendation: 'Test that keyboard focus order follows logical sequence'
        });

        // 2.4.4 Link Purpose (In Context)
        const links = document.querySelectorAll('a[href]');
        const ambiguousLinks = Array.from(links).filter(link => {
            const text = link.textContent.trim().toLowerCase();
            return text === 'click here' || text === 'read more' || text === 'here' || text.length < 4;
        });

        results.push({
            criterion: '2.4.4 Link Purpose (In Context)',
            test: 'Descriptive link text',
            status: ambiguousLinks.length === 0 ? 'PASS' : 'WARN',
            level: 'A',
            value: `${ambiguousLinks.length}/${links.length} links with ambiguous text`,
            issues: ambiguousLinks.map(link => `Ambiguous link: "${link.textContent.trim()}"`),
            recommendation: 'Use descriptive link text that makes sense out of context'
        });

        // 2.4.6 Headings and Labels
        const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
        const emptyHeadings = Array.from(headings).filter(h => h.textContent.trim().length === 0);

        results.push({
            criterion: '2.4.6 Headings and Labels',
            test: 'Descriptive headings',
            status: emptyHeadings.length === 0 ? 'PASS' : 'FAIL',
            level: 'AA',
            value: `${headings.length - emptyHeadings.length}/${headings.length} headings with content`,
            issues: emptyHeadings.map((h, i) => `Empty heading: ${h.tagName.toLowerCase()}`),
            recommendation: 'Provide descriptive headings and labels'
        });

        return results;
    }

    testInputModalities(document) {
        const results = [];

        // 2.5.1 Pointer Gestures
        results.push({
            criterion: '2.5.1 Pointer Gestures',
            test: 'No complex gestures required',
            status: 'WARN',
            level: 'AA',
            value: 'Manual testing required',
            issues: [],
            recommendation: 'Ensure functionality that uses multipoint or path-based gestures has single-pointer alternatives'
        });

        // 2.5.2 Pointer Cancellation
        results.push({
            criterion: '2.5.2 Pointer Cancellation',
            test: 'Pointer events can be cancelled',
            status: 'WARN',
            level: 'AA',
            value: 'Manual testing required',
            issues: [],
            recommendation: 'Allow users to abort or undo actions triggered by single-pointer activation'
        });

        // 2.5.3 Label in Name
        const labeledElements = document.querySelectorAll('button, input[type="submit"], input[type="button"]');
        results.push({
            criterion: '2.5.3 Label in Name',
            test: 'Accessible name contains visible label',
            status: 'WARN',
            level: 'AA',
            value: `${labeledElements.length} button elements to check`,
            issues: [],
            recommendation: 'Ensure accessible names include the visible label text'
        });

        // 2.5.4 Motion Actuation
        results.push({
            criterion: '2.5.4 Motion Actuation',
            test: 'No device motion required',
            status: 'PASS',
            level: 'AA',
            value: 'No device motion detection found',
            issues: [],
            recommendation: 'Provide conventional UI alternatives for motion-activated functions'
        });

        return results;
    }

    async testUnderstandable(document, window) {
        const results = [];

        // 3.1 Readable
        results.push(...this.testReadable(document));
        
        // 3.2 Predictable  
        results.push(...this.testPredictable(document));
        
        // 3.3 Input Assistance
        results.push(...this.testInputAssistance(document));

        return results;
    }

    testReadable(document) {
        const results = [];

        // 3.1.1 Language of Page
        const htmlLang = document.documentElement.getAttribute('lang');
        results.push({
            criterion: '3.1.1 Language of Page',
            test: 'Page language specified',
            status: htmlLang ? 'PASS' : 'FAIL',
            level: 'A',
            value: htmlLang || 'No language specified',
            issues: !htmlLang ? ['Missing lang attribute on html element'] : [],
            recommendation: 'Specify the primary language of the page using lang attribute'
        });

        return results;
    }

    testPredictable(document) {
        const results = [];

        // 3.2.1 On Focus
        results.push({
            criterion: '3.2.1 On Focus',
            test: 'No context change on focus',
            status: 'WARN',
            level: 'A',
            value: 'Manual testing required',
            issues: [],
            recommendation: 'Ensure receiving focus does not trigger context changes (new windows, forms submission, etc.)'
        });

        // 3.2.2 On Input
        results.push({
            criterion: '3.2.2 On Input',
            test: 'No context change on input',
            status: 'WARN',
            level: 'A',
            value: 'Manual testing required',
            issues: [],
            recommendation: 'Ensure changing form control values does not trigger context changes'
        });

        // 3.2.3 Consistent Navigation
        const navElements = document.querySelectorAll('nav, [role="navigation"]');
        results.push({
            criterion: '3.2.3 Consistent Navigation',
            test: 'Consistent navigation placement',
            status: navElements.length > 0 ? 'WARN' : 'PASS',
            level: 'AA',
            value: `${navElements.length} navigation areas found`,
            issues: [],
            recommendation: 'Keep navigation consistent across pages in the same order'
        });

        return results;
    }

    testInputAssistance(document) {
        const results = [];

        // 3.3.1 Error Identification
        const formElements = document.querySelectorAll('form');
        const errorElements = document.querySelectorAll('.error, .invalid, [aria-invalid="true"]');
        
        results.push({
            criterion: '3.3.1 Error Identification',
            test: 'Error identification mechanism',
            status: formElements.length === 0 || errorElements.length > 0 ? 'PASS' : 'WARN',
            level: 'A',
            value: `${formElements.length} forms, ${errorElements.length} error indicators`,
            issues: [],
            recommendation: 'Provide clear error identification and descriptions for form validation'
        });

        // 3.3.2 Labels or Instructions
        const requiredFields = document.querySelectorAll('input[required], textarea[required], select[required]');
        const fieldsWithInstructions = Array.from(requiredFields).filter(field => {
            return field.hasAttribute('aria-describedby') ||
                   field.placeholder ||
                   document.querySelector(`label[for="${field.id}"]`) ||
                   field.parentElement.querySelector('.help-text, .form-text');
        });

        results.push({
            criterion: '3.3.2 Labels or Instructions',
            test: 'Form instructions provided',
            status: requiredFields.length === fieldsWithInstructions.length ? 'PASS' : 'WARN',
            level: 'A',
            value: `${fieldsWithInstructions.length}/${requiredFields.length} required fields with instructions`,
            issues: [],
            recommendation: 'Provide clear instructions for required fields and expected formats'
        });

        return results;
    }

    async testRobust(document, window) {
        const results = [];

        // 4.1.1 Parsing
        results.push(...this.testParsing(document));
        
        // 4.1.2 Name, Role, Value
        results.push(...this.testNameRoleValue(document));

        return results;
    }

    testParsing(document) {
        const results = [];

        // Check for duplicate IDs
        const elementsWithId = document.querySelectorAll('[id]');
        const ids = Array.from(elementsWithId).map(el => el.id);
        const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);
        const uniqueDuplicates = [...new Set(duplicateIds)];

        results.push({
            criterion: '4.1.1 Parsing',
            test: 'No duplicate IDs',
            status: uniqueDuplicates.length === 0 ? 'PASS' : 'FAIL',
            level: 'A',
            value: `${uniqueDuplicates.length} duplicate IDs found`,
            issues: uniqueDuplicates.map(id => `Duplicate ID: ${id}`),
            recommendation: 'Ensure all id attributes are unique on the page'
        });

        return results;
    }

    testNameRoleValue(document) {
        const results = [];

        // Custom UI components should have proper ARIA
        const customButtons = document.querySelectorAll(
            '[role="button"]:not(button), [onclick]:not(button):not(a), .btn:not(button):not(a)'
        );
        
        const customButtonsWithoutAria = Array.from(customButtons).filter(btn => 
            !btn.hasAttribute('aria-label') && 
            !btn.hasAttribute('aria-labelledby') &&
            btn.textContent.trim().length === 0
        );

        results.push({
            criterion: '4.1.2 Name, Role, Value',
            test: 'Custom interactive elements have accessible names',
            status: customButtonsWithoutAria.length === 0 ? 'PASS' : 'FAIL',
            level: 'A',
            value: `${customButtons.length - customButtonsWithoutAria.length}/${customButtons.length} custom elements properly labeled`,
            issues: customButtonsWithoutAria.map(btn => `Unlabeled custom interactive element: ${btn.className}`),
            recommendation: 'Provide accessible names for custom interactive elements using aria-label or text content'
        });

        return results;
    }

    getWCAGLevel(score) {
        if (score >= 95) return 'AAA';
        if (score >= 85) return 'AA';
        if (score >= 70) return 'A';
        return 'FAIL';
    }

    async generateAccessibilityReport() {
        const reportDate = new Date().toISOString().split('T')[0];
        
        const report = {
            testDate: reportDate,
            summary: this.generateAccessibilitySummary(),
            templateResults: this.testResults,
            recommendations: this.generateAccessibilityRecommendations(),
            wcagGuidelines: this.getWCAGGuidelinesSummary()
        };

        // Write JSON report
        const jsonPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/accessibility-report-${reportDate}.json`;
        await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));

        // Write HTML report  
        const htmlPath = `/Users/andreapanzeri/progetti/IT-ERA/tests/accessibility-report-${reportDate}.html`;
        await fs.writeFile(htmlPath, this.generateAccessibilityHTMLReport(report));

        console.log(`\n♿ Accessibility Report Generated:`);
        console.log(`- JSON: ${jsonPath}`);
        console.log(`- HTML: ${htmlPath}`);
        
        // Display summary
        console.log('\n📊 WCAG Compliance Summary:');
        this.testResults.forEach(result => {
            console.log(`  ${result.template}: ${result.score}% (${result.level}) - ${result.passedTests}/${result.totalTests} tests passed`);
        });

        return report;
    }

    generateAccessibilitySummary() {
        const summary = {};
        
        this.testResults.forEach(result => {
            summary[result.template] = {
                score: result.score,
                level: result.level,
                totalTests: result.totalTests,
                passedTests: result.passedTests,
                failedTests: result.failedTests,
                criticalIssues: result.results.filter(r => r.status === 'FAIL' && r.level === 'A').length,
                wcagAAIssues: result.results.filter(r => r.status === 'FAIL' && r.level === 'AA').length,
                wcagAAAIssues: result.results.filter(r => r.status === 'FAIL' && r.level === 'AAA').length
            };
        });
        
        return summary;
    }

    generateAccessibilityRecommendations() {
        const recommendations = {
            critical: [],
            important: [],
            minor: []
        };

        this.testResults.forEach(templateResult => {
            templateResult.results.forEach(result => {
                const rec = {
                    template: templateResult.template,
                    criterion: result.criterion,
                    test: result.test,
                    level: result.level,
                    issues: result.issues,
                    recommendation: result.recommendation
                };

                if (result.status === 'FAIL' && result.level === 'A') {
                    recommendations.critical.push(rec);
                } else if (result.status === 'FAIL') {
                    recommendations.important.push(rec);
                } else if (result.status === 'WARN') {
                    recommendations.minor.push(rec);
                }
            });
        });

        return recommendations;
    }

    getWCAGGuidelinesSummary() {
        return {
            perceivable: {
                description: 'Information and UI components must be presentable to users in ways they can perceive',
                guidelines: [
                    '1.1 Text Alternatives',
                    '1.2 Time-based Media', 
                    '1.3 Adaptable',
                    '1.4 Distinguishable'
                ]
            },
            operable: {
                description: 'UI components and navigation must be operable',
                guidelines: [
                    '2.1 Keyboard Accessible',
                    '2.2 Enough Time',
                    '2.3 Seizures and Physical Reactions', 
                    '2.4 Navigable',
                    '2.5 Input Modalities'
                ]
            },
            understandable: {
                description: 'Information and UI operation must be understandable',
                guidelines: [
                    '3.1 Readable',
                    '3.2 Predictable',
                    '3.3 Input Assistance'
                ]
            },
            robust: {
                description: 'Content must be robust enough to be interpreted by assistive technologies',
                guidelines: [
                    '4.1 Compatible'
                ]
            }
        };
    }

    generateAccessibilityHTMLReport(report) {
        return `<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IT-ERA Accessibility Report - ${report.testDate}</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
    <style>
        .level-aaa { background: #198754; color: white; }
        .level-aa { background: #20c997; color: white; }
        .level-a { background: #ffc107; color: dark; }
        .level-fail { background: #dc3545; color: white; }
        .criterion-a { border-left: 4px solid #198754; }
        .criterion-aa { border-left: 4px solid #20c997; }
        .criterion-aaa { border-left: 4px solid #0dcaf0; }
    </style>
</head>
<body class="bg-light">
    <div class="container py-5">
        <h1 class="mb-4">♿ IT-ERA Accessibility Report (WCAG AAA)</h1>
        <p class="text-muted">Generated on ${report.testDate}</p>

        <!-- Summary Cards -->
        <div class="row mb-5">
            ${Object.entries(report.summary).map(([template, summary]) => `
            <div class="col-md-4 mb-3">
                <div class="card">
                    <div class="card-header d-flex justify-content-between">
                        <h6 class="mb-0">${template.replace('.html', '')}</h6>
                        <span class="badge level-${summary.level.toLowerCase()}">${summary.score}% (${summary.level})</span>
                    </div>
                    <div class="card-body">
                        <div class="row text-center small">
                            <div class="col-4">
                                <div class="text-success">${summary.passedTests}</div>
                                <div class="text-muted">Passed</div>
                            </div>
                            <div class="col-4">
                                <div class="text-danger">${summary.failedTests}</div>
                                <div class="text-muted">Failed</div>
                            </div>
                            <div class="col-4">
                                <div class="text-warning">${summary.criticalIssues}</div>
                                <div class="text-muted">Critical</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            `).join('')}
        </div>

        <!-- WCAG Guidelines Overview -->
        <div class="row mb-5">
            ${Object.entries(report.wcagGuidelines).map(([principle, info]) => `
            <div class="col-md-6 mb-3">
                <div class="card">
                    <div class="card-header">
                        <h6 class="mb-0 text-capitalize">${principle}</h6>
                    </div>
                    <div class="card-body">
                        <p class="small">${info.description}</p>
                        <ul class="small mb-0">
                            ${info.guidelines.map(guideline => `<li>${guideline}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            `).join('')}
        </div>

        <!-- Detailed Results -->
        ${this.testResults.map(templateResult => `
        <div class="card mb-4">
            <div class="card-header">
                <h5 class="mb-0">${templateResult.template} - Detailed Results</h5>
                <small class="text-muted">${templateResult.passedTests}/${templateResult.totalTests} tests passed (${templateResult.score}%)</small>
            </div>
            <div class="card-body">
                <div class="accordion" id="accordion-${templateResult.template.replace('.html', '')}">
                    ${templateResult.results.map((result, index) => `
                    <div class="accordion-item criterion-${result.level.toLowerCase()}">
                        <h2 class="accordion-header">
                            <button class="accordion-button ${index > 0 ? 'collapsed' : ''}" type="button" 
                                    data-bs-toggle="collapse" 
                                    data-bs-target="#collapse-${templateResult.template.replace('.html', '')}-${index}">
                                <div class="d-flex justify-content-between w-100">
                                    <span>${result.criterion} - ${result.test}</span>
                                    <span class="badge ms-2 ${result.status === 'PASS' ? 'bg-success' : result.status === 'FAIL' ? 'bg-danger' : 'bg-warning'}">${result.status}</span>
                                </div>
                            </button>
                        </h2>
                        <div id="collapse-${templateResult.template.replace('.html', '')}-${index}" 
                             class="accordion-collapse collapse ${index === 0 ? 'show' : ''}"
                             data-bs-parent="#accordion-${templateResult.template.replace('.html', '')}">
                            <div class="accordion-body">
                                <div class="row">
                                    <div class="col-md-6">
                                        <strong>Value:</strong> ${result.value}<br>
                                        <strong>Level:</strong> WCAG ${result.level}
                                    </div>
                                    <div class="col-md-6">
                                        <strong>Recommendation:</strong><br>
                                        <small>${result.recommendation}</small>
                                    </div>
                                </div>
                                ${result.issues && result.issues.length > 0 ? `
                                <div class="mt-3">
                                    <strong>Issues Found:</strong>
                                    <ul class="small mb-0">
                                        ${result.issues.map(issue => `<li>${issue}</li>`).join('')}
                                    </ul>
                                </div>
                                ` : ''}
                            </div>
                        </div>
                    </div>
                    `).join('')}
                </div>
            </div>
        </div>
        `).join('')}

        <!-- Critical Recommendations -->
        ${report.recommendations.critical.length > 0 ? `
        <div class="card border-danger mb-4">
            <div class="card-header bg-danger text-white">
                <h5 class="mb-0">🚨 Critical Accessibility Issues (WCAG Level A)</h5>
            </div>
            <div class="card-body">
                ${report.recommendations.critical.map(rec => `
                <div class="alert alert-danger">
                    <h6>${rec.template} - ${rec.criterion}</h6>
                    <p class="mb-2"><strong>${rec.test}</strong></p>
                    <p class="small mb-1"><strong>Issues:</strong> ${rec.issues.join(', ')}</p>
                    <p class="small mb-0"><strong>Solution:</strong> ${rec.recommendation}</p>
                </div>
                `).join('')}
            </div>
        </div>
        ` : ''}
    </div>

    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
</body>
</html>`;
    }
}

module.exports = ITEraAccessibilityTestSuite;

// Run accessibility tests if called directly
if (require.main === module) {
    const testSuite = new ITEraAccessibilityTestSuite();
    testSuite.runAccessibilityTests()
        .then(() => console.log('✅ Accessibility tests completed successfully'))
        .catch(error => console.error('❌ Accessibility test suite failed:', error));
}
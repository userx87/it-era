#!/usr/bin/env node

/**
 * IT-ERA Comprehensive Online Production Tester
 * Testa tutti i sistemi IT-ERA in produzione per verificare l'efficacia delle correzioni
 */

const { execSync } = require('child_process');
const fs = require('fs');

class ComprehensiveOnlineTester {
    constructor() {
        this.baseUrl = 'https://it-era.it';
        this.testResults = {
            linkValidity: [],
            formFunctionality: [],
            navigationMenu: [],
            mobileResponsiveness: [],
            emergencyContact: [],
            performance: [],
            conversionElements: []
        };
        this.priorityPages = [];
        this.allPages = [];
        this.startTime = Date.now();
        
        // Configurazione test
        this.testConfig = {
            timeout: 15000, // 15 secondi timeout
            userAgent: 'Mozilla/5.0 (compatible; IT-ERA-Tester/1.0)',
            mobileUserAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
            maxConcurrent: 5, // Test paralleli
            retryAttempts: 2
        };
        
        // Pagine prioritarie da testare in dettaglio
        this.criticalPages = [
            'https://it-era.it',
            'https://it-era.it/contatti.html',
            'https://it-era.it/servizi-it/computer-non-si-accende-milano.html',
            'https://it-era.it/servizi-it/computer-non-si-accende-bergamo.html',
            'https://it-era.it/servizi-it/servizi-it/computer-non-si-accende-brescia.html'
        ];
    }
    
    // Ottieni tutte le pagine dalla sitemap
    async getAllPagesFromSitemap() {
        console.log('🗺️ Fetching sitemap for online testing...');
        
        try {
            const sitemapContent = execSync(`curl -s -A "${this.testConfig.userAgent}" "${this.baseUrl}/sitemap.xml"`, { 
                encoding: 'utf8',
                timeout: this.testConfig.timeout 
            });
            
            const urlMatches = sitemapContent.match(/https:\/\/it-era\.it[^<]*/g);
            
            if (urlMatches) {
                this.allPages = urlMatches;
                console.log(`  📄 Found ${this.allPages.length} pages to test online`);
                return true;
            }
            
            throw new Error('No URLs found in sitemap');
            
        } catch (error) {
            console.error('❌ Error fetching sitemap:', error.message);
            return false;
        }
    }
    
    // TEST 1: Link Validity - Verifica che tutte le pagine siano accessibili
    async testLinkValidity() {
        console.log('\n🔗 TEST 1: LINK VALIDITY - Testing all 568 pages online...');
        
        const results = [];
        const batchSize = this.testConfig.maxConcurrent;
        
        for (let i = 0; i < this.allPages.length; i += batchSize) {
            const batch = this.allPages.slice(i, i + batchSize);
            console.log(`  Testing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(this.allPages.length/batchSize)} (${batch.length} pages)`);
            
            const batchPromises = batch.map(url => this.testSinglePageValidity(url));
            const batchResults = await Promise.all(batchPromises);
            results.push(...batchResults);
            
            // Progress indicator
            const successCount = batchResults.filter(r => r.status === 'SUCCESS').length;
            console.log(`    ✅ ${successCount}/${batch.length} pages accessible`);
        }
        
        this.testResults.linkValidity = results;
        
        const summary = this.summarizeLinkValidityResults(results);
        console.log(`\n📊 LINK VALIDITY SUMMARY:`);
        console.log(`  ✅ Accessible: ${summary.accessible}/${results.length} (${summary.accessiblePercent}%)`);
        console.log(`  ❌ Failed: ${summary.failed}/${results.length} (${summary.failedPercent}%)`);
        console.log(`  ⚠️ Slow: ${summary.slow}/${results.length} (${summary.slowPercent}%)`);
        
        return summary;
    }
    
    // Testa validità di una singola pagina
    async testSinglePageValidity(url) {
        const startTime = Date.now();
        
        try {
            // Test con curl per ottenere status HTTP e tempo di risposta
            const curlCommand = `curl -s -o /dev/null -w "%{http_code},%{time_total},%{size_download}" -A "${this.testConfig.userAgent}" -m ${this.testConfig.timeout/1000} "${url}"`;
            const response = execSync(curlCommand, { encoding: 'utf8', timeout: this.testConfig.timeout });
            
            const [httpCode, timeTotal, sizeDownload] = response.trim().split(',');
            const responseTime = Math.round(parseFloat(timeTotal) * 1000);
            const contentSize = parseInt(sizeDownload);
            
            const status = httpCode === '200' ? 'SUCCESS' : 'FAILED';
            const isSlow = responseTime > 3000;
            
            return {
                url,
                status,
                httpCode: parseInt(httpCode),
                responseTime,
                contentSize,
                isSlow,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                url,
                status: 'ERROR',
                httpCode: 0,
                responseTime: Date.now() - startTime,
                contentSize: 0,
                isSlow: true,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }
    
    // TEST 2: Form Functionality - Verifica integrazione Resend
    async testFormFunctionality() {
        console.log('\n📝 TEST 2: FORM FUNCTIONALITY - Testing Resend integration...');
        
        const results = [];
        const testPages = [...this.criticalPages, ...this.allPages.slice(0, 50)]; // Test prime 50 + critiche
        
        for (const url of testPages) {
            console.log(`  🔍 Testing forms on: ${url}`);
            const result = await this.testPageFormFunctionality(url);
            results.push(result);
            
            const status = result.hasWorkingForm ? '✅' : result.hasForm ? '⚠️' : '❌';
            console.log(`    ${status} Form status: ${result.formStatus}`);
        }
        
        this.testResults.formFunctionality = results;
        
        const summary = this.summarizeFormResults(results);
        console.log(`\n📊 FORM FUNCTIONALITY SUMMARY:`);
        console.log(`  ✅ Working Forms: ${summary.workingForms}/${results.length} (${summary.workingPercent}%)`);
        console.log(`  📝 Forms Present: ${summary.formsPresent}/${results.length} (${summary.presentPercent}%)`);
        console.log(`  🔗 Resend Integration: ${summary.resendIntegration}/${results.length} (${summary.resendPercent}%)`);
        
        return summary;
    }
    
    // Testa funzionalità form di una pagina
    async testPageFormFunctionality(url) {
        try {
            const content = execSync(`curl -s -A "${this.testConfig.userAgent}" -m ${this.testConfig.timeout/1000} "${url}"`, { 
                encoding: 'utf8',
                timeout: this.testConfig.timeout 
            });
            
            const hasForm = content.includes('<form');
            const hasResendIntegration = content.includes('data-resend="true"');
            const hasResendScript = content.includes('resend') || content.includes('Resend');
            const hasSubmitButton = content.includes('type="submit"') || content.includes('button');
            const hasValidation = content.includes('required') && content.includes('validation');
            const hasErrorHandling = content.includes('error') && content.includes('success');
            
            let formStatus = 'No form found';
            let hasWorkingForm = false;
            
            if (hasForm) {
                if (hasResendIntegration && hasSubmitButton) {
                    formStatus = 'Fully functional with Resend';
                    hasWorkingForm = true;
                } else if (hasForm && hasSubmitButton) {
                    formStatus = 'Form present, needs Resend integration';
                    hasWorkingForm = false;
                } else {
                    formStatus = 'Form incomplete';
                    hasWorkingForm = false;
                }
            }
            
            return {
                url,
                hasForm,
                hasResendIntegration,
                hasResendScript,
                hasSubmitButton,
                hasValidation,
                hasErrorHandling,
                formStatus,
                hasWorkingForm,
                contentLength: content.length
            };
            
        } catch (error) {
            return {
                url,
                hasForm: false,
                hasResendIntegration: false,
                hasResendScript: false,
                hasSubmitButton: false,
                hasValidation: false,
                hasErrorHandling: false,
                formStatus: `Error: ${error.message}`,
                hasWorkingForm: false,
                contentLength: 0
            };
        }
    }
    
    // TEST 3: Navigation Menu - Verifica presenza menu
    async testNavigationMenu() {
        console.log('\n🧭 TEST 3: NAVIGATION MENU - Testing menu presence and functionality...');
        
        const results = [];
        const testPages = [...this.criticalPages, ...this.allPages.slice(0, 100)]; // Test prime 100 + critiche
        
        for (const url of testPages) {
            console.log(`  🔍 Testing navigation on: ${url}`);
            const result = await this.testPageNavigation(url);
            results.push(result);
            
            const status = result.hasFullNavigation ? '✅' : result.hasBasicNavigation ? '⚠️' : '❌';
            console.log(`    ${status} Navigation: ${result.navigationStatus}`);
        }
        
        this.testResults.navigationMenu = results;
        
        const summary = this.summarizeNavigationResults(results);
        console.log(`\n📊 NAVIGATION MENU SUMMARY:`);
        console.log(`  ✅ Full Navigation: ${summary.fullNavigation}/${results.length} (${summary.fullPercent}%)`);
        console.log(`  ⚠️ Basic Navigation: ${summary.basicNavigation}/${results.length} (${summary.basicPercent}%)`);
        console.log(`  📱 Mobile Menu: ${summary.mobileMenu}/${results.length} (${summary.mobilePercent}%)`);
        
        return summary;
    }
    
    // Testa navigazione di una pagina
    async testPageNavigation(url) {
        try {
            const content = execSync(`curl -s -A "${this.testConfig.userAgent}" -m ${this.testConfig.timeout/1000} "${url}"`, { 
                encoding: 'utf8',
                timeout: this.testConfig.timeout 
            });
            
            const hasNavTag = content.includes('<nav');
            const hasNavigationClass = content.includes('navigation') || content.includes('navbar');
            const hasMenu = content.includes('menu');
            const hasMobileMenu = content.includes('mobile-menu') || content.includes('hamburger');
            const hasInternalLinks = (content.match(/href="\/[^"]*"/g) || []).length > 5;
            const hasBreadcrumbs = content.includes('breadcrumb');
            
            let navigationStatus = 'No navigation found';
            let hasBasicNavigation = false;
            let hasFullNavigation = false;
            
            if (hasNavTag || hasNavigationClass) {
                if (hasInternalLinks && hasMobileMenu) {
                    navigationStatus = 'Full navigation with mobile support';
                    hasFullNavigation = true;
                    hasBasicNavigation = true;
                } else if (hasInternalLinks) {
                    navigationStatus = 'Basic navigation present';
                    hasBasicNavigation = true;
                } else {
                    navigationStatus = 'Navigation structure found, needs links';
                }
            }
            
            return {
                url,
                hasNavTag,
                hasNavigationClass,
                hasMenu,
                hasMobileMenu,
                hasInternalLinks,
                hasBreadcrumbs,
                navigationStatus,
                hasBasicNavigation,
                hasFullNavigation,
                internalLinksCount: (content.match(/href="\/[^"]*"/g) || []).length
            };
            
        } catch (error) {
            return {
                url,
                hasNavTag: false,
                hasNavigationClass: false,
                hasMenu: false,
                hasMobileMenu: false,
                hasInternalLinks: false,
                hasBreadcrumbs: false,
                navigationStatus: `Error: ${error.message}`,
                hasBasicNavigation: false,
                hasFullNavigation: false,
                internalLinksCount: 0
            };
        }
    }
    
    // TEST 4: Mobile Responsiveness
    async testMobileResponsiveness() {
        console.log('\n📱 TEST 4: MOBILE RESPONSIVENESS - Testing mobile optimization...');
        
        const results = [];
        const testPages = this.criticalPages; // Test solo pagine critiche per mobile
        
        for (const url of testPages) {
            console.log(`  📱 Testing mobile on: ${url}`);
            const result = await this.testPageMobileResponsiveness(url);
            results.push(result);
            
            const status = result.isMobileOptimized ? '✅' : result.hasViewport ? '⚠️' : '❌';
            console.log(`    ${status} Mobile: ${result.mobileStatus}`);
        }
        
        this.testResults.mobileResponsiveness = results;
        
        const summary = this.summarizeMobileResults(results);
        console.log(`\n📊 MOBILE RESPONSIVENESS SUMMARY:`);
        console.log(`  ✅ Mobile Optimized: ${summary.optimized}/${results.length} (${summary.optimizedPercent}%)`);
        console.log(`  📱 Has Viewport: ${summary.hasViewport}/${results.length} (${summary.viewportPercent}%)`);
        
        return summary;
    }
    
    // Testa mobile responsiveness di una pagina
    async testPageMobileResponsiveness(url) {
        try {
            const content = execSync(`curl -s -A "${this.testConfig.mobileUserAgent}" -m ${this.testConfig.timeout/1000} "${url}"`, { 
                encoding: 'utf8',
                timeout: this.testConfig.timeout 
            });
            
            const hasViewport = content.includes('viewport');
            const hasResponsiveCSS = content.includes('responsive') || content.includes('@media');
            const hasMobileCSS = content.includes('mobile') || content.includes('sm:') || content.includes('md:');
            const hasTouchFriendly = content.includes('touch') || content.includes('tap');
            
            let mobileStatus = 'Not mobile optimized';
            let isMobileOptimized = false;
            
            if (hasViewport && (hasResponsiveCSS || hasMobileCSS)) {
                mobileStatus = 'Mobile optimized';
                isMobileOptimized = true;
            } else if (hasViewport) {
                mobileStatus = 'Basic mobile support';
            }
            
            return {
                url,
                hasViewport,
                hasResponsiveCSS,
                hasMobileCSS,
                hasTouchFriendly,
                mobileStatus,
                isMobileOptimized
            };
            
        } catch (error) {
            return {
                url,
                hasViewport: false,
                hasResponsiveCSS: false,
                hasMobileCSS: false,
                hasTouchFriendly: false,
                mobileStatus: `Error: ${error.message}`,
                isMobileOptimized: false
            };
        }
    }
    
    // TEST 5: Emergency Contact
    async testEmergencyContact() {
        console.log('\n🚨 TEST 5: EMERGENCY CONTACT - Testing 039 888 2041 prominence...');
        
        const results = [];
        const testPages = [...this.criticalPages, ...this.allPages.filter(url => url.includes('emergenza') || url.includes('computer-non-si-accende')).slice(0, 20)];
        
        for (const url of testPages) {
            console.log(`  📞 Testing emergency contact on: ${url}`);
            const result = await this.testPageEmergencyContact(url);
            results.push(result);
            
            const status = result.hasProminentContact ? '✅' : result.hasContact ? '⚠️' : '❌';
            console.log(`    ${status} Emergency: ${result.contactStatus}`);
        }
        
        this.testResults.emergencyContact = results;
        
        const summary = this.summarizeEmergencyResults(results);
        console.log(`\n📊 EMERGENCY CONTACT SUMMARY:`);
        console.log(`  ✅ Prominent Contact: ${summary.prominent}/${results.length} (${summary.prominentPercent}%)`);
        console.log(`  📞 Contact Present: ${summary.present}/${results.length} (${summary.presentPercent}%)`);
        console.log(`  🔗 Phone Links: ${summary.phoneLinks}/${results.length} (${summary.phonePercent}%)`);
        
        return summary;
    }
    
    // Testa emergency contact di una pagina
    async testPageEmergencyContact(url) {
        try {
            const content = execSync(`curl -s -A "${this.testConfig.userAgent}" -m ${this.testConfig.timeout/1000} "${url}"`, { 
                encoding: 'utf8',
                timeout: this.testConfig.timeout 
            });
            
            const hasPhoneNumber = content.includes('039 888 2041') || content.includes('0398882041');
            const hasPhoneLink = content.includes('tel:+390398882041') || content.includes('tel:0398882041');
            const hasEmergencyBanner = content.includes('emergenza') || content.includes('emergency');
            const hasWhatsApp = content.includes('whatsapp') || content.includes('wa.me');
            const phoneOccurrences = (content.match(/039 888 2041/g) || []).length;
            
            let contactStatus = 'No emergency contact found';
            let hasContact = false;
            let hasProminentContact = false;
            
            if (hasPhoneNumber) {
                hasContact = true;
                if (phoneOccurrences >= 2 && hasPhoneLink) {
                    contactStatus = 'Prominent emergency contact';
                    hasProminentContact = true;
                } else {
                    contactStatus = 'Emergency contact present';
                }
            }
            
            return {
                url,
                hasPhoneNumber,
                hasPhoneLink,
                hasEmergencyBanner,
                hasWhatsApp,
                phoneOccurrences,
                contactStatus,
                hasContact,
                hasProminentContact
            };
            
        } catch (error) {
            return {
                url,
                hasPhoneNumber: false,
                hasPhoneLink: false,
                hasEmergencyBanner: false,
                hasWhatsApp: false,
                phoneOccurrences: 0,
                contactStatus: `Error: ${error.message}`,
                hasContact: false,
                hasProminentContact: false
            };
        }
    }
    
    // TEST 6: Performance
    async testPerformance() {
        console.log('\n⚡ TEST 6: PERFORMANCE - Testing page load times...');
        
        const results = [];
        const testPages = this.criticalPages;
        
        for (const url of testPages) {
            console.log(`  ⏱️ Testing performance of: ${url}`);
            const result = await this.testPagePerformance(url);
            results.push(result);
            
            const status = result.loadTime < 2000 ? '✅' : result.loadTime < 5000 ? '⚠️' : '❌';
            console.log(`    ${status} Load time: ${result.loadTime}ms`);
        }
        
        this.testResults.performance = results;
        
        const summary = this.summarizePerformanceResults(results);
        console.log(`\n📊 PERFORMANCE SUMMARY:`);
        console.log(`  ⚡ Fast (<2s): ${summary.fast}/${results.length} (${summary.fastPercent}%)`);
        console.log(`  ⚠️ Acceptable (<5s): ${summary.acceptable}/${results.length} (${summary.acceptablePercent}%)`);
        console.log(`  📊 Average Load Time: ${summary.averageLoadTime}ms`);
        
        return summary;
    }
    
    // Testa performance di una pagina
    async testPagePerformance(url) {
        const attempts = 3;
        const loadTimes = [];
        
        for (let i = 0; i < attempts; i++) {
            try {
                const startTime = Date.now();
                execSync(`curl -s -o /dev/null -A "${this.testConfig.userAgent}" -m ${this.testConfig.timeout/1000} "${url}"`, { 
                    timeout: this.testConfig.timeout 
                });
                const loadTime = Date.now() - startTime;
                loadTimes.push(loadTime);
            } catch (error) {
                loadTimes.push(this.testConfig.timeout);
            }
        }
        
        const averageLoadTime = Math.round(loadTimes.reduce((a, b) => a + b, 0) / loadTimes.length);
        const isFast = averageLoadTime < 2000;
        const isAcceptable = averageLoadTime < 5000;
        
        return {
            url,
            loadTime: averageLoadTime,
            loadTimes,
            isFast,
            isAcceptable,
            attempts
        };
    }
    
    // TEST 7: Conversion Elements
    async testConversionElements() {
        console.log('\n🎯 TEST 7: CONVERSION ELEMENTS - Testing CTA and lead capture...');
        
        const results = [];
        const testPages = [...this.criticalPages, ...this.allPages.slice(0, 30)];
        
        for (const url of testPages) {
            console.log(`  🎯 Testing conversion elements on: ${url}`);
            const result = await this.testPageConversionElements(url);
            results.push(result);
            
            const status = result.isConversionOptimized ? '✅' : result.hasBasicCTA ? '⚠️' : '❌';
            console.log(`    ${status} Conversion: ${result.conversionStatus}`);
        }
        
        this.testResults.conversionElements = results;
        
        const summary = this.summarizeConversionResults(results);
        console.log(`\n📊 CONVERSION ELEMENTS SUMMARY:`);
        console.log(`  ✅ Optimized: ${summary.optimized}/${results.length} (${summary.optimizedPercent}%)`);
        console.log(`  🎯 Has CTA: ${summary.hasCTA}/${results.length} (${summary.ctaPercent}%)`);
        console.log(`  📝 Lead Capture: ${summary.leadCapture}/${results.length} (${summary.leadPercent}%)`);
        
        return summary;
    }
    
    // Testa conversion elements di una pagina
    async testPageConversionElements(url) {
        try {
            const content = execSync(`curl -s -A "${this.testConfig.userAgent}" -m ${this.testConfig.timeout/1000} "${url}"`, { 
                encoding: 'utf8',
                timeout: this.testConfig.timeout 
            });
            
            const ctaCount = (content.match(/btn|button|CTA/gi) || []).length;
            const hasContactForm = content.includes('<form') && content.includes('contact');
            const hasLeadCapture = content.includes('lead') || (content.includes('form') && content.includes('email'));
            const hasEmergencyContact = content.includes('039 888 2041');
            const hasWhatsApp = content.includes('whatsapp') || content.includes('wa.me');
            const hasSocialProof = content.includes('testimonial') || content.includes('review');
            
            let conversionStatus = 'No conversion elements';
            let hasBasicCTA = false;
            let isConversionOptimized = false;
            
            if (ctaCount > 0) {
                hasBasicCTA = true;
                if (ctaCount >= 3 && hasContactForm && hasEmergencyContact) {
                    conversionStatus = 'Conversion optimized';
                    isConversionOptimized = true;
                } else {
                    conversionStatus = 'Basic conversion elements';
                }
            }
            
            return {
                url,
                ctaCount,
                hasContactForm,
                hasLeadCapture,
                hasEmergencyContact,
                hasWhatsApp,
                hasSocialProof,
                conversionStatus,
                hasBasicCTA,
                isConversionOptimized
            };
            
        } catch (error) {
            return {
                url,
                ctaCount: 0,
                hasContactForm: false,
                hasLeadCapture: false,
                hasEmergencyContact: false,
                hasWhatsApp: false,
                hasSocialProof: false,
                conversionStatus: `Error: ${error.message}`,
                hasBasicCTA: false,
                isConversionOptimized: false
            };
        }
    }
    
    // Funzioni di summarizzazione risultati
    summarizeLinkValidityResults(results) {
        const accessible = results.filter(r => r.status === 'SUCCESS').length;
        const failed = results.filter(r => r.status === 'FAILED' || r.status === 'ERROR').length;
        const slow = results.filter(r => r.isSlow).length;
        
        return {
            accessible,
            failed,
            slow,
            total: results.length,
            accessiblePercent: Math.round((accessible / results.length) * 100),
            failedPercent: Math.round((failed / results.length) * 100),
            slowPercent: Math.round((slow / results.length) * 100)
        };
    }
    
    summarizeFormResults(results) {
        const workingForms = results.filter(r => r.hasWorkingForm).length;
        const formsPresent = results.filter(r => r.hasForm).length;
        const resendIntegration = results.filter(r => r.hasResendIntegration).length;
        
        return {
            workingForms,
            formsPresent,
            resendIntegration,
            total: results.length,
            workingPercent: Math.round((workingForms / results.length) * 100),
            presentPercent: Math.round((formsPresent / results.length) * 100),
            resendPercent: Math.round((resendIntegration / results.length) * 100)
        };
    }
    
    summarizeNavigationResults(results) {
        const fullNavigation = results.filter(r => r.hasFullNavigation).length;
        const basicNavigation = results.filter(r => r.hasBasicNavigation).length;
        const mobileMenu = results.filter(r => r.hasMobileMenu).length;
        
        return {
            fullNavigation,
            basicNavigation,
            mobileMenu,
            total: results.length,
            fullPercent: Math.round((fullNavigation / results.length) * 100),
            basicPercent: Math.round((basicNavigation / results.length) * 100),
            mobilePercent: Math.round((mobileMenu / results.length) * 100)
        };
    }
    
    summarizeMobileResults(results) {
        const optimized = results.filter(r => r.isMobileOptimized).length;
        const hasViewport = results.filter(r => r.hasViewport).length;
        
        return {
            optimized,
            hasViewport,
            total: results.length,
            optimizedPercent: Math.round((optimized / results.length) * 100),
            viewportPercent: Math.round((hasViewport / results.length) * 100)
        };
    }
    
    summarizeEmergencyResults(results) {
        const prominent = results.filter(r => r.hasProminentContact).length;
        const present = results.filter(r => r.hasContact).length;
        const phoneLinks = results.filter(r => r.hasPhoneLink).length;
        
        return {
            prominent,
            present,
            phoneLinks,
            total: results.length,
            prominentPercent: Math.round((prominent / results.length) * 100),
            presentPercent: Math.round((present / results.length) * 100),
            phonePercent: Math.round((phoneLinks / results.length) * 100)
        };
    }
    
    summarizePerformanceResults(results) {
        const fast = results.filter(r => r.isFast).length;
        const acceptable = results.filter(r => r.isAcceptable).length;
        const averageLoadTime = Math.round(results.reduce((sum, r) => sum + r.loadTime, 0) / results.length);
        
        return {
            fast,
            acceptable,
            averageLoadTime,
            total: results.length,
            fastPercent: Math.round((fast / results.length) * 100),
            acceptablePercent: Math.round((acceptable / results.length) * 100)
        };
    }
    
    summarizeConversionResults(results) {
        const optimized = results.filter(r => r.isConversionOptimized).length;
        const hasCTA = results.filter(r => r.hasBasicCTA).length;
        const leadCapture = results.filter(r => r.hasLeadCapture).length;
        
        return {
            optimized,
            hasCTA,
            leadCapture,
            total: results.length,
            optimizedPercent: Math.round((optimized / results.length) * 100),
            ctaPercent: Math.round((hasCTA / results.length) * 100),
            leadPercent: Math.round((leadCapture / results.length) * 100)
        };
    }
    
    // Genera report finale completo
    generateComprehensiveReport() {
        const totalTime = Date.now() - this.startTime;
        
        const report = {
            timestamp: new Date().toISOString(),
            testDuration: totalTime,
            summary: {
                totalPagesInSitemap: this.allPages.length,
                criticalPagesTested: this.criticalPages.length,
                testCategories: 7,
                overallStatus: 'COMPLETED'
            },
            results: this.testResults,
            recommendations: this.generateRecommendations()
        };
        
        fs.writeFileSync('comprehensive-online-test-report.json', JSON.stringify(report, null, 2));
        
        console.log('\n🎉 COMPREHENSIVE ONLINE TEST COMPLETED!');
        console.log('=====================================');
        console.log(`Test Duration: ${Math.round(totalTime/1000)}s`);
        console.log(`Total Pages in Sitemap: ${this.allPages.length}`);
        console.log(`Critical Pages Tested: ${this.criticalPages.length}`);
        console.log(`Test Categories: 7`);
        console.log('\n💾 Detailed report saved to: comprehensive-online-test-report.json');
        
        return report;
    }
    
    // Genera raccomandazioni
    generateRecommendations() {
        const recommendations = [];
        
        // Analizza risultati e genera raccomandazioni specifiche
        if (this.testResults.linkValidity.length > 0) {
            const failedPages = this.testResults.linkValidity.filter(r => r.status !== 'SUCCESS');
            if (failedPages.length > 0) {
                recommendations.push({
                    category: 'Link Validity',
                    priority: 'HIGH',
                    issue: `${failedPages.length} pages are not accessible`,
                    action: 'Fix broken pages and server issues'
                });
            }
        }
        
        return recommendations;
    }
    
    // Esegui tutti i test
    async runAllTests() {
        console.log('🚀 Starting Comprehensive Online Production Testing...\n');
        
        // Ottieni sitemap
        if (!await this.getAllPagesFromSitemap()) {
            console.error('❌ Cannot proceed without sitemap');
            return;
        }
        
        // Esegui tutti i test
        const linkValidityResults = await this.testLinkValidity();
        const formFunctionalityResults = await this.testFormFunctionality();
        const navigationResults = await this.testNavigationMenu();
        const mobileResults = await this.testMobileResponsiveness();
        const emergencyResults = await this.testEmergencyContact();
        const performanceResults = await this.testPerformance();
        const conversionResults = await this.testConversionElements();
        
        // Genera report finale
        const finalReport = this.generateComprehensiveReport();
        
        return finalReport;
    }
}

// Esegui se chiamato direttamente
if (require.main === module) {
    const tester = new ComprehensiveOnlineTester();
    tester.runAllTests()
        .then(report => {
            console.log('\n✅ All tests completed successfully!');
            process.exit(0);
        })
        .catch(error => {
            console.error('❌ Testing failed:', error);
            process.exit(1);
        });
}

module.exports = ComprehensiveOnlineTester;

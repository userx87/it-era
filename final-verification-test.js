#!/usr/bin/env node

const https = require('https');

// Test finale per verificare le correzioni
const SITE_BASE_URL = 'https://userx87.github.io/it-era';

class FinalVerificationTester {
    constructor() {
        this.results = {
            timestamp: new Date().toISOString(),
            tests: [],
            summary: {
                totalTests: 0,
                passedTests: 0,
                failedTests: 0,
                overallScore: 0
            },
            issues: [],
            fixes: []
        };
    }

    // Testa una singola URL
    async testUrl(url) {
        return new Promise((resolve) => {
            const req = https.request(url, { method: 'GET' }, (res) => {
                let data = '';
                
                res.on('data', chunk => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    resolve({
                        url: url,
                        status: res.statusCode,
                        success: res.statusCode >= 200 && res.statusCode < 400,
                        content: data,
                        size: data.length
                    });
                });
            });

            req.on('error', (error) => {
                resolve({
                    url: url,
                    status: 0,
                    success: false,
                    error: error.message
                });
            });

            req.setTimeout(10000, () => {
                req.destroy();
                resolve({
                    url: url,
                    status: 0,
                    success: false,
                    error: 'Timeout'
                });
            });

            req.end();
        });
    }

    // Test 1: Verifica chatbot duplicati
    testChatbotDuplicates(content) {
        const test = {
            name: 'Chatbot Duplicates Check',
            description: 'Verifica che non ci siano chatbot duplicati',
            passed: false,
            details: {}
        };

        // Conta i chatbot
        const chatbotButtons = (content.match(/id="chatbot-button"/g) || []).length;
        const chatbotToggles = (content.match(/id="chatbot-toggle"/g) || []).length;
        const chatbotWidgets = (content.match(/id="chatbot-widget"/g) || []).length;
        const oldChatbots = (content.match(/id="it-era-chatbot"/g) || []).length;

        test.details = {
            chatbotButtons: chatbotButtons,
            chatbotToggles: chatbotToggles,
            chatbotWidgets: chatbotWidgets,
            oldChatbots: oldChatbots,
            totalChatbots: chatbotButtons + chatbotToggles + chatbotWidgets + oldChatbots
        };

        // Deve esserci solo 1 chatbot moderno
        if (chatbotButtons === 1 && chatbotToggles === 0 && chatbotWidgets === 1 && oldChatbots === 0) {
            test.passed = true;
            this.results.fixes.push('✅ Chatbot duplicati rimossi - solo 1 chatbot moderno presente');
        } else {
            this.results.issues.push(`❌ Chatbot duplicati trovati: ${test.details.totalChatbots} totali`);
        }

        return test;
    }

    // Test 2: Verifica footer duplicati
    testFooterDuplicates(content) {
        const test = {
            name: 'Footer Duplicates Check',
            description: 'Verifica che non ci siano footer duplicati',
            passed: false,
            details: {}
        };

        // Conta i footer
        const footerTags = (content.match(/<footer/g) || []).length;
        const footerCloseTags = (content.match(/<\/footer>/g) || []).length;

        test.details = {
            footerOpenTags: footerTags,
            footerCloseTags: footerCloseTags
        };

        // Deve esserci solo 1 footer
        if (footerTags === 1 && footerCloseTags === 1) {
            test.passed = true;
            this.results.fixes.push('✅ Footer duplicati rimossi - solo 1 footer presente');
        } else {
            this.results.issues.push(`❌ Footer duplicati trovati: ${footerTags} aperture, ${footerCloseTags} chiusure`);
        }

        return test;
    }

    // Test 3: Verifica analytics setup
    testAnalyticsSetup(content) {
        const test = {
            name: 'Analytics Setup Check',
            description: 'Verifica che gli analytics siano configurati correttamente',
            passed: false,
            details: {}
        };

        // Verifica presenza sezioni analytics
        const hasAnalyticsHead = content.includes('ANALYTICS & TRACKING (HEAD SECTION)');
        const hasAnalyticsFooter = content.includes('ANALYTICS & TRACKING SCRIPTS');
        const hasGTMNoscript = content.includes('Google Tag Manager (noscript)');
        const hasCustomEvents = content.includes('Custom event tracking for IT-ERA');
        const hasStructuredData = content.includes('"@type": "LocalBusiness"');

        test.details = {
            analyticsHeadSection: hasAnalyticsHead,
            analyticsFooterSection: hasAnalyticsFooter,
            gtmNoscript: hasGTMNoscript,
            customEvents: hasCustomEvents,
            structuredData: hasStructuredData
        };

        const analyticsScore = Object.values(test.details).filter(Boolean).length;
        
        if (analyticsScore >= 4) {
            test.passed = true;
            this.results.fixes.push(`✅ Analytics setup completo - ${analyticsScore}/5 componenti presenti`);
        } else {
            this.results.issues.push(`❌ Analytics setup incompleto - ${analyticsScore}/5 componenti presenti`);
        }

        return test;
    }

    // Test 4: Verifica menu funzionante
    testMenuStructure(content) {
        const test = {
            name: 'Menu Structure Check',
            description: 'Verifica che il menu sia strutturato correttamente',
            passed: false,
            details: {}
        };

        // Verifica elementi menu
        const hasMobileMenuButton = content.includes('id="mobile-menu-button"');
        const hasMobileMenu = content.includes('id="mobile-menu"');
        const hasDesktopNav = content.includes('hidden lg:flex');
        const hasDropdown = content.includes('group-hover:opacity-100');

        test.details = {
            mobileMenuButton: hasMobileMenuButton,
            mobileMenu: hasMobileMenu,
            desktopNavigation: hasDesktopNav,
            dropdownMenu: hasDropdown
        };

        const menuScore = Object.values(test.details).filter(Boolean).length;
        
        if (menuScore >= 3) {
            test.passed = true;
            this.results.fixes.push(`✅ Menu strutturato correttamente - ${menuScore}/4 componenti presenti`);
        } else {
            this.results.issues.push(`❌ Menu incompleto - ${menuScore}/4 componenti presenti`);
        }

        return test;
    }

    // Test 5: Verifica design moderno
    testModernDesign(content) {
        const test = {
            name: 'Modern Design Check',
            description: 'Verifica che il design moderno sia implementato',
            passed: false,
            details: {}
        };

        // Verifica elementi design moderno
        const hasModernButtons = content.includes('btn-primary');
        const hasModernCards = content.includes('card-service');
        const hasGlassmorphism = content.includes('backdrop-blur');
        const hasGradients = content.includes('gradient-to-br');
        const hasModernSpacing = content.includes('rounded-3xl');

        test.details = {
            modernButtons: hasModernButtons,
            modernCards: hasModernCards,
            glassmorphism: hasGlassmorphism,
            gradients: hasGradients,
            modernSpacing: hasModernSpacing
        };

        const designScore = Object.values(test.details).filter(Boolean).length;
        
        if (designScore >= 4) {
            test.passed = true;
            this.results.fixes.push(`✅ Design moderno implementato - ${designScore}/5 elementi presenti`);
        } else {
            this.results.issues.push(`❌ Design moderno incompleto - ${designScore}/5 elementi presenti`);
        }

        return test;
    }

    // Test 6: Verifica JavaScript funzionante
    testJavaScriptFunctionality(content) {
        const test = {
            name: 'JavaScript Functionality Check',
            description: 'Verifica che il JavaScript sia funzionante',
            passed: false,
            details: {}
        };

        // Verifica funzioni JavaScript
        const hasMobileMenuJS = content.includes('mobile-menu-button');
        const hasChatbotJS = content.includes('chatbot-button');
        const hasScrollEffects = content.includes('IntersectionObserver');
        const hasEventTracking = content.includes('addEventListener');

        test.details = {
            mobileMenuJS: hasMobileMenuJS,
            chatbotJS: hasChatbotJS,
            scrollEffects: hasScrollEffects,
            eventTracking: hasEventTracking
        };

        const jsScore = Object.values(test.details).filter(Boolean).length;
        
        if (jsScore >= 3) {
            test.passed = true;
            this.results.fixes.push(`✅ JavaScript funzionante - ${jsScore}/4 funzioni presenti`);
        } else {
            this.results.issues.push(`❌ JavaScript incompleto - ${jsScore}/4 funzioni presenti`);
        }

        return test;
    }

    // Esegue tutti i test
    async runAllTests() {
        console.log('🔧 FINAL VERIFICATION TEST');
        console.log('===========================\n');

        const url = `${SITE_BASE_URL}/`;
        console.log(`📄 Testing: ${url}`);

        const result = await this.testUrl(url);
        
        if (result.success) {
            console.log(`  ✅ Status: ${result.status} OK`);
            console.log(`  📊 Size: ${(result.size / 1024).toFixed(1)}KB\n`);

            // Esegui tutti i test
            const tests = [
                this.testChatbotDuplicates(result.content),
                this.testFooterDuplicates(result.content),
                this.testAnalyticsSetup(result.content),
                this.testMenuStructure(result.content),
                this.testModernDesign(result.content),
                this.testJavaScriptFunctionality(result.content)
            ];

            this.results.tests = tests;
            this.results.summary.totalTests = tests.length;
            this.results.summary.passedTests = tests.filter(t => t.passed).length;
            this.results.summary.failedTests = tests.filter(t => !t.passed).length;
            this.results.summary.overallScore = Math.round((this.results.summary.passedTests / this.results.summary.totalTests) * 100);

            // Stampa risultati
            tests.forEach((test, index) => {
                console.log(`${index + 1}. ${test.name}: ${test.passed ? '✅ PASS' : '❌ FAIL'}`);
                console.log(`   ${test.description}`);
                Object.entries(test.details).forEach(([key, value]) => {
                    console.log(`   - ${key}: ${value}`);
                });
                console.log('');
            });

        } else {
            console.log(`  ❌ FAILED: ${result.error || result.status}`);
        }

        this.printSummary();
    }

    // Stampa riassunto finale
    printSummary() {
        console.log('🏆 FINAL VERIFICATION SUMMARY');
        console.log('==============================');
        console.log(`🎯 Overall Score: ${this.results.summary.overallScore}/100`);
        console.log(`✅ Passed Tests: ${this.results.summary.passedTests}/${this.results.summary.totalTests}`);
        console.log(`❌ Failed Tests: ${this.results.summary.failedTests}/${this.results.summary.totalTests}`);

        if (this.results.fixes.length > 0) {
            console.log('\n🔧 FIXES VERIFIED:');
            this.results.fixes.forEach(fix => {
                console.log(`  ${fix}`);
            });
        }

        if (this.results.issues.length > 0) {
            console.log('\n⚠️  REMAINING ISSUES:');
            this.results.issues.forEach(issue => {
                console.log(`  ${issue}`);
            });
        }

        if (this.results.summary.overallScore >= 90) {
            console.log('\n🎉 EXCELLENT! All major issues have been fixed.');
        } else if (this.results.summary.overallScore >= 80) {
            console.log('\n✅ GOOD! Most issues have been resolved.');
        } else {
            console.log('\n⚠️  NEEDS WORK! Some issues still need attention.');
        }

        console.log(`\n🌐 Test completed at: ${this.results.timestamp}`);
        console.log(`🔗 Site URL: ${SITE_BASE_URL}`);
    }
}

// Esegui i test
const tester = new FinalVerificationTester();
tester.runAllTests().catch(console.error);

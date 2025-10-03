#!/usr/bin/env node

/**
 * Contact Form Testing Script
 * Tests contact form API endpoint with various scenarios
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const API_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
const API_ENDPOINT = '/api/contact';

/**
 * Make HTTP POST request
 */
function makeRequest(data) {
    return new Promise((resolve, reject) => {
        const url = new URL(API_ENDPOINT, API_URL);
        const isHttps = url.protocol === 'https:';
        const client = isHttps ? https : require('http');

        const postData = JSON.stringify(data);

        const options = {
            hostname: url.hostname,
            port: url.port || (isHttps ? 443 : 80),
            path: url.pathname,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = client.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};
                    resolve({
                        statusCode: res.statusCode,
                        data: jsonBody
                    });
                } catch (e) {
                    resolve({
                        statusCode: res.statusCode,
                        data: { raw: body }
                    });
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

/**
 * Test cases
 */
const testCases = [
    {
        name: 'Valid Contact Form - Basic',
        data: {
            name: 'Test User',
            email: 'test@example.com',
            message: 'This is a test message from automated testing script.'
        },
        expectedStatus: 200
    },
    {
        name: 'Valid Contact Form - Full Data',
        data: {
            name: 'Mario Rossi',
            email: 'mario.rossi@example.com',
            phone: '+39 339 1234567',
            company: 'Test SRL',
            service: 'Consulenza IT',
            message: 'Richiesta di preventivo per servizi IT',
            urgency: 'medium'
        },
        expectedStatus: 200
    },
    {
        name: 'Emergency Contact',
        data: {
            name: 'Emergency User',
            email: 'emergency@example.com',
            phone: '+39 339 9999999',
            company: 'Critical Business',
            service: 'Assistenza Urgente',
            message: 'URGENZA: Server down, necessario intervento immediato',
            urgency: 'emergency'
        },
        expectedStatus: 200
    },
    {
        name: 'Missing Required Field - Name',
        data: {
            email: 'test@example.com',
            message: 'Test message'
        },
        expectedStatus: 400
    },
    {
        name: 'Missing Required Field - Email',
        data: {
            name: 'Test User',
            message: 'Test message'
        },
        expectedStatus: 400
    },
    {
        name: 'Missing Required Field - Message',
        data: {
            name: 'Test User',
            email: 'test@example.com'
        },
        expectedStatus: 400
    },
    {
        name: 'Empty Form',
        data: {},
        expectedStatus: 400
    }
];

/**
 * Run all tests
 */
async function runTests() {
    console.log('🧪 Contact Form API Testing\n');
    console.log('='.repeat(80));
    console.log(`Target API: ${API_URL}${API_ENDPOINT}`);
    console.log('='.repeat(80) + '\n');

    let passed = 0;
    let failed = 0;

    for (let i = 0; i < testCases.length; i++) {
        const test = testCases[i];

        process.stdout.write(`${i + 1}. ${test.name}... `);

        try {
            const result = await makeRequest(test.data);

            if (result.statusCode === test.expectedStatus) {
                console.log('✅ PASS');
                passed++;

                if (result.data.success) {
                    console.log(`   ✉️  Email ID: ${result.data.id || 'N/A'}`);
                    console.log(`   📬 Message: ${result.data.message}`);
                } else if (result.data.error) {
                    console.log(`   ⚠️  Error (expected): ${result.data.error}`);
                }
            } else {
                console.log('❌ FAIL');
                console.log(`   Expected: ${test.expectedStatus}, Got: ${result.statusCode}`);
                console.log(`   Response:`, result.data);
                failed++;
            }
        } catch (error) {
            console.log('❌ ERROR');
            console.log(`   ${error.message}`);
            failed++;
        }

        console.log('');
    }

    // Summary
    console.log('='.repeat(80));
    console.log(`\n📊 Test Summary:\n`);
    console.log(`   Total Tests: ${testCases.length}`);
    console.log(`   ✅ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`   Success Rate: ${((passed / testCases.length) * 100).toFixed(1)}%\n`);

    if (failed === 0) {
        console.log('🎉 All tests passed!\n');
    } else {
        console.log('⚠️  Some tests failed. Please review the errors above.\n');
        process.exit(1);
    }
}

/**
 * Configuration check
 */
function checkConfig() {
    console.log('🔍 Configuration Check:\n');

    const requiredVars = [
        'RESEND_API_KEY',
        'NEXT_PUBLIC_SITE_URL',
        'NEXT_PUBLIC_COMPANY_EMAIL'
    ];

    let allPresent = true;

    requiredVars.forEach(varName => {
        const value = process.env[varName];
        if (value) {
            console.log(`   ✅ ${varName}: ${value.substring(0, 20)}...`);
        } else {
            console.log(`   ❌ ${varName}: NOT SET`);
            allPresent = false;
        }
    });

    console.log('');

    if (!allPresent) {
        console.log('⚠️  Warning: Some environment variables are missing.\n');
    }

    return allPresent;
}

// Main
(async () => {
    try {
        checkConfig();
        await runTests();
    } catch (error) {
        console.error('\n❌ Fatal Error:', error.message);
        process.exit(1);
    }
})();

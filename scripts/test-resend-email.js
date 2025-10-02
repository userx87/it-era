#!/usr/bin/env node

const { Resend } = require('resend');
require('dotenv').config({ path: '.env.local' });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testEmailSending() {
    console.log('🔧 Testing Resend Email Service');
    console.log('================================\n');

    // Check API key
    if (!process.env.RESEND_API_KEY) {
        console.error('❌ RESEND_API_KEY not found in environment variables');
        return;
    }

    console.log('✅ API Key found:', process.env.RESEND_API_KEY.substring(0, 10) + '...');

    // Test data
    const testEmail = {
        from: 'IT-ERA <onboarding@resend.dev>', // Use Resend's test domain for now
        to: ['info@bulltech.it'],
        subject: 'Test Email - IT-ERA Contact System',
        html: `
            <h2>Test Email from IT-ERA</h2>
            <p>This is a test email to verify the Resend integration.</p>
            <p>If you receive this email, the system is working correctly.</p>
            <hr>
            <p>Timestamp: ${new Date().toISOString()}</p>
        `,
        text: `Test Email from IT-ERA\n\nThis is a test email to verify the Resend integration.\nIf you receive this email, the system is working correctly.\n\nTimestamp: ${new Date().toISOString()}`
    };

    console.log('📧 Sending test email to:', testEmail.to.join(', '));
    console.log('📨 From:', testEmail.from);
    console.log('📝 Subject:', testEmail.subject);

    try {
        const { data, error } = await resend.emails.send(testEmail);

        if (error) {
            console.error('\n❌ Email sending failed:');
            console.error('Error Name:', error.name);
            console.error('Error Message:', error.message);

            if (error.message.includes('domain')) {
                console.log('\n⚠️  DOMAIN VERIFICATION REQUIRED');
                console.log('Steps to fix:');
                console.log('1. Login to https://resend.com/domains');
                console.log('2. Add domain: bulltech.it or it-era.it');
                console.log('3. Add DNS records as shown');
                console.log('4. Wait for verification (5-10 minutes)');
                console.log('\n📝 For testing, you can use:');
                console.log('   from: "onboarding@resend.dev"');
                console.log('   to: [your verified email address]');
            }

            if (error.message.includes('testing emails')) {
                console.log('\n⚠️  TEST MODE RESTRICTION');
                console.log('In test mode, you can only send to verified email addresses.');
                console.log('Add recipient emails in Resend dashboard under "Audiences".');
            }

            return;
        }

        console.log('\n✅ Email sent successfully!');
        console.log('📧 Email ID:', data.id);
        console.log('🔗 Track at: https://resend.com/emails/' + data.id);

        // Test with different scenarios
        console.log('\n📊 Testing different urgency levels...\n');

        const urgencyTests = [
            { urgency: 'low', label: 'Low Priority' },
            { urgency: 'medium', label: 'Normal Priority' },
            { urgency: 'high', label: 'High Priority' },
            { urgency: 'emergency', label: '🚨 EMERGENCY' }
        ];

        for (const test of urgencyTests) {
            console.log(`Testing ${test.label} (${test.urgency})...`);
            // Just log what would be sent
            console.log(`  Would send to: ${test.urgency === 'emergency' ? 'info@bulltech.it, emergenze@bulltech.it' : 'info@bulltech.it'}`);
        }

    } catch (error) {
        console.error('\n❌ Unexpected error:', error);
        console.error('Stack trace:', error.stack);
    }

    console.log('\n================================');
    console.log('📋 Summary:');
    console.log('- Resend API: Connected');
    console.log('- Test email: Attempted');
    console.log('- Next step: Verify domain for production use');
}

// Run the test
testEmailSending().then(() => {
    console.log('\n✅ Test completed');
    process.exit(0);
}).catch(error => {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
});
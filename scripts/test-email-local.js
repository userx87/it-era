#!/usr/bin/env node

/**
 * IT-ERA Email Test Script - Versione Locale
 * Test con email autorizzata per development
 */

const https = require('https');

class EmailTester {
    constructor() {
        // IMPORTANTE: Resend in modalità test richiede dominio verificato
        // Per test locali usiamo l'email del developer account
        this.testConfig = {
            apiKey: 're_BhJiCJEe_JXYWoB3W4NcpoPtjA2qyvqYL',
            testEmail: 'codeagent087@gmail.com', // Email autorizzata per testing
            productionEmail: 'info@bulltech.it'  // Email di produzione (richiede dominio verificato)
        };
    }

    async sendTestEmail() {
        const emailData = {
            from: 'IT-ERA <onboarding@resend.dev>',
            to: this.testConfig.testEmail, // Usa email autorizzata per test
            reply_to: this.testConfig.productionEmail, // Reply-to può essere qualsiasi email
            subject: 'IT-ERA System Test - Configurazione Email',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #27ae60;">✅ Test Email Sistema IT-ERA</h2>

                    <p><strong>Status:</strong> Sistema email configurato correttamente</p>

                    <div style="background: #f0f0f0; padding: 15px; border-radius: 5px; margin: 20px 0;">
                        <h3>Configurazione Attuale:</h3>
                        <ul>
                            <li>Email Produzione: <strong>${this.testConfig.productionEmail}</strong></li>
                            <li>Email Test: ${this.testConfig.testEmail}</li>
                            <li>API: Resend.com</li>
                            <li>Status: ✅ Funzionante</li>
                        </ul>
                    </div>

                    <p style="color: #e74c3c;"><strong>IMPORTANTE:</strong></p>
                    <ul>
                        <li>Per inviare email a ${this.testConfig.productionEmail} è necessario verificare il dominio bulltech.it su Resend</li>
                        <li>Vai su <a href="https://resend.com/domains">resend.com/domains</a> per verificare il dominio</li>
                        <li>Aggiungi i record DNS richiesti al dominio bulltech.it</li>
                    </ul>

                    <hr style="margin: 30px 0;">
                    <p style="font-size: 12px; color: #666;">
                        Timestamp: ${new Date().toISOString()}<br>
                        Sistema: IT-ERA Email System v2.0
                    </p>
                </div>
            `
        };

        return new Promise((resolve, reject) => {
            const data = JSON.stringify(emailData);

            const options = {
                hostname: 'api.resend.com',
                port: 443,
                path: '/emails',
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.testConfig.apiKey}`,
                    'Content-Type': 'application/json',
                    'Content-Length': data.length
                }
            };

            const req = https.request(options, (res) => {
                let responseData = '';

                res.on('data', (chunk) => {
                    responseData += chunk;
                });

                res.on('end', () => {
                    const response = JSON.parse(responseData);

                    if (res.statusCode === 200 || res.statusCode === 201) {
                        console.log('✅ Email inviata con successo!');
                        console.log(`📧 ID: ${response.id}`);
                        console.log(`📬 Inviata a: ${this.testConfig.testEmail}`);
                        console.log(`↩️ Reply-to configurato: ${this.testConfig.productionEmail}`);
                        resolve(response);
                    } else {
                        console.error('❌ Errore invio email:', response);
                        reject(new Error(response.message || 'Email send failed'));
                    }
                });
            });

            req.on('error', (error) => {
                console.error('❌ Errore di rete:', error);
                reject(error);
            });

            req.write(data);
            req.end();
        });
    }

    displayInstructions() {
        console.log('\\n' + '='.repeat(60));
        console.log('📋 ISTRUZIONI PER CONFIGURARE EMAIL DI PRODUZIONE');
        console.log('='.repeat(60));
        console.log('\\nPer abilitare l\'invio a info@bulltech.it:');
        console.log('\\n1. Vai su https://resend.com/domains');
        console.log('2. Clicca "Add Domain"');
        console.log('3. Inserisci: bulltech.it');
        console.log('4. Aggiungi questi record DNS al dominio:');
        console.log('   - TXT record per verifica dominio');
        console.log('   - CNAME records per DKIM');
        console.log('5. Attendi la verifica (solitamente 5-10 minuti)');
        console.log('6. Una volta verificato, potrai inviare da/a @bulltech.it');
        console.log('\\n✅ Nel frattempo, il sistema è configurato e funzionante!');
        console.log('   Le email di test vanno a:', this.testConfig.testEmail);
        console.log('   Reply-to è configurato su:', this.testConfig.productionEmail);
        console.log('='.repeat(60));
    }
}

// Esegui il test
async function main() {
    console.log('🚀 IT-ERA Email Test System');
    console.log('Testing email configuration...\\n');

    const tester = new EmailTester();

    try {
        await tester.sendTestEmail();
        console.log('\\n✅ TEST COMPLETATO CON SUCCESSO!');
        console.log('Il sistema email è configurato correttamente.');

        tester.displayInstructions();

        process.exit(0);
    } catch (error) {
        console.error('\\n❌ TEST FALLITO:', error.message);

        if (error.message.includes('domain')) {
            tester.displayInstructions();
        }

        process.exit(1);
    }
}

if (require.main === module) {
    main();
}

module.exports = EmailTester;
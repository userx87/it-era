#!/usr/bin/env node

/**
 * Resend Domain Verification Script
 * Verifica e configura il dominio bulltech.it su Resend
 */

const https = require('https');
require('dotenv').config({ path: '.env.local' });

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const DOMAIN = 'bulltech.it';

if (!RESEND_API_KEY) {
    console.error('❌ RESEND_API_KEY non trovata in .env.local');
    process.exit(1);
}

/**
 * Make API request to Resend
 */
function makeResendRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.resend.com',
            path: path,
            method: method,
            headers: {
                'Authorization': `Bearer ${RESEND_API_KEY}`,
                'Content-Type': 'application/json'
            }
        };

        const req = https.request(options, (res) => {
            let body = '';

            res.on('data', (chunk) => {
                body += chunk;
            });

            res.on('end', () => {
                try {
                    const jsonBody = body ? JSON.parse(body) : {};

                    if (res.statusCode >= 200 && res.statusCode < 300) {
                        resolve(jsonBody);
                    } else {
                        reject({
                            statusCode: res.statusCode,
                            error: jsonBody
                        });
                    }
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);

        if (data) {
            req.write(JSON.stringify(data));
        }

        req.end();
    });
}

/**
 * List all domains
 */
async function listDomains() {
    console.log('📋 Recupero lista domini...\n');
    try {
        const response = await makeResendRequest('GET', '/domains');
        return response.data || [];
    } catch (error) {
        console.error('❌ Errore nel recuperare i domini:', error);
        return [];
    }
}

/**
 * Add a new domain
 */
async function addDomain(domain) {
    console.log(`➕ Aggiunta dominio: ${domain}...\n`);
    try {
        const response = await makeResendRequest('POST', '/domains', {
            name: domain,
            region: 'eu-west-1' // Europa per GDPR compliance
        });
        return response;
    } catch (error) {
        if (error.statusCode === 400 && error.error.message?.includes('already exists')) {
            console.log('⚠️  Il dominio esiste già');
            return null;
        }
        throw error;
    }
}

/**
 * Get domain details
 */
async function getDomain(domainId) {
    try {
        const response = await makeResendRequest('GET', `/domains/${domainId}`);
        return response;
    } catch (error) {
        console.error('❌ Errore nel recuperare dettagli dominio:', error);
        return null;
    }
}

/**
 * Verify domain
 */
async function verifyDomain(domainId) {
    console.log('🔍 Verifica dominio in corso...\n');
    try {
        const response = await makeResendRequest('POST', `/domains/${domainId}/verify`);
        return response;
    } catch (error) {
        console.error('❌ Errore nella verifica:', error);
        return null;
    }
}

/**
 * Format DNS records for display
 */
function formatDNSRecords(records) {
    if (!records || records.length === 0) {
        return 'Nessun record DNS da configurare';
    }

    let output = '\n📝 RECORD DNS DA CONFIGURARE:\n';
    output += '=' .repeat(80) + '\n\n';

    records.forEach((record, index) => {
        output += `${index + 1}. ${record.record_type} Record\n`;
        output += `   Nome:    ${record.name}\n`;
        output += `   Valore:  ${record.value}\n`;
        output += `   Status:  ${record.status || 'pending'}\n`;
        if (record.priority) {
            output += `   Priority: ${record.priority}\n`;
        }
        output += '\n';
    });

    output += '=' .repeat(80) + '\n';
    return output;
}

/**
 * Main function
 */
async function main() {
    console.log('🚀 Resend Domain Verification Tool\n');
    console.log('=' .repeat(80));
    console.log(`Dominio da verificare: ${DOMAIN}`);
    console.log('=' .repeat(80) + '\n');

    try {
        // 1. List existing domains
        const domains = await listDomains();
        let targetDomain = domains.find(d => d.name === DOMAIN);

        console.log(`Trovati ${domains.length} domini:\n`);
        domains.forEach(d => {
            console.log(`  - ${d.name} (${d.status}) ${d.id === targetDomain?.id ? '← TARGET' : ''}`);
        });
        console.log('');

        // 2. Add domain if not exists
        if (!targetDomain) {
            console.log(`⚠️  Dominio ${DOMAIN} non trovato. Aggiunta in corso...\n`);
            const newDomain = await addDomain(DOMAIN);

            if (newDomain) {
                targetDomain = newDomain;
                console.log('✅ Dominio aggiunto con successo!');
                console.log(`   ID: ${newDomain.id}\n`);
            } else {
                console.log('ℹ️  Recupero informazioni dominio esistente...\n');
                const updatedDomains = await listDomains();
                targetDomain = updatedDomains.find(d => d.name === DOMAIN);
            }
        }

        if (!targetDomain) {
            console.error('❌ Impossibile trovare o creare il dominio');
            process.exit(1);
        }

        // 3. Get domain details
        console.log(`📊 Dettagli dominio ${DOMAIN}:\n`);
        const domainDetails = await getDomain(targetDomain.id);

        if (domainDetails) {
            console.log(`   ID:          ${domainDetails.id}`);
            console.log(`   Nome:        ${domainDetails.name}`);
            console.log(`   Status:      ${domainDetails.status}`);
            console.log(`   Region:      ${domainDetails.region || 'us-east-1'}`);
            console.log(`   Created:     ${domainDetails.created_at || 'N/A'}\n`);

            // 4. Show DNS records
            if (domainDetails.records && domainDetails.records.length > 0) {
                console.log(formatDNSRecords(domainDetails.records));

                // Instructions
                console.log('\n📖 ISTRUZIONI:\n');
                console.log('1. Accedi al pannello DNS del tuo provider (es. Cloudflare, GoDaddy, etc.)');
                console.log('2. Aggiungi i record DNS sopra elencati');
                console.log('3. Attendi 5-10 minuti per la propagazione DNS');
                console.log('4. Esegui di nuovo questo script per verificare\n');

                // 5. Try to verify
                if (domainDetails.status !== 'verified') {
                    console.log('🔄 Tentativo di verifica automatica...\n');
                    const verificationResult = await verifyDomain(targetDomain.id);

                    if (verificationResult) {
                        if (verificationResult.status === 'verified') {
                            console.log('✅ DOMINIO VERIFICATO CON SUCCESSO!\n');
                            console.log('🎉 Ora puoi inviare email da qualsiasi indirizzo @bulltech.it\n');
                        } else {
                            console.log(`⏳ Status verifica: ${verificationResult.status}\n`);
                            console.log('ℹ️  I record DNS potrebbero non essere ancora propagati.');
                            console.log('   Attendi alcuni minuti e riprova.\n');
                        }
                    }
                } else {
                    console.log('✅ DOMINIO GIÀ VERIFICATO!\n');
                    console.log('🎉 Puoi inviare email da qualsiasi indirizzo @bulltech.it\n');
                }
            }
        }

        // 6. Update .env.production with correct from address
        console.log('📝 Aggiornamento configurazione...\n');
        console.log('✅ Ricorda di aggiornare l\'API per usare:');
        console.log(`   from: "IT-ERA <noreply@${DOMAIN}>"\n`);

    } catch (error) {
        console.error('\n❌ ERRORE:', error);

        if (error.statusCode === 401) {
            console.log('\n⚠️  API Key non valida. Verifica RESEND_API_KEY in .env.local');
        } else if (error.statusCode === 403) {
            console.log('\n⚠️  Accesso negato. Verifica i permessi dell\'API Key.');
        }

        process.exit(1);
    }
}

// Run
main().catch(console.error);
#!/usr/bin/env node
/**
 * SendGrid Account Diagnostic Tool
 * Diagnosi completa per identificare il vero problema con l'errore "Maximum credits exceeded"
 */

const API_KEYS = [
  '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',
  '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',
  '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'
];

const SENDER_EMAIL = 'info@it-era.it';

async function testApiKey(apiKey, keyIndex) {
  console.log(`\n🔍 TESTING API KEY #${keyIndex + 1}`);
  console.log(`Key: ${apiKey.substring(0, 20)}...${apiKey.substring(apiKey.length - 10)}`);
  
  try {
    // Test 1: Verificare validità API key
    console.log('\n📡 Test 1: API Key Validation');
    const authResponse = await fetch('https://api.sendgrid.com/v3/user/profile', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (authResponse.ok) {
      const profile = await authResponse.json();
      console.log('✅ API Key VALIDA');
      console.log(`Account: ${profile.username || 'N/A'}`);
      console.log(`Email: ${profile.email || 'N/A'}`);
    } else {
      console.log('❌ API Key INVALIDA o REVOCATA');
      const error = await authResponse.text();
      console.log(`Errore: ${error}`);
      return false;
    }

    // Test 2: Verificare stato account
    console.log('\n💰 Test 2: Account Status & Credits');
    const creditsResponse = await fetch('https://api.sendgrid.com/v3/user/credits', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (creditsResponse.ok) {
      const credits = await creditsResponse.json();
      console.log('✅ Credits Info:');
      console.log(JSON.stringify(credits, null, 2));
    } else {
      console.log('❌ Impossibile recuperare info crediti');
      const error = await creditsResponse.text();
      console.log(`Errore: ${error}`);
    }

    // Test 3: Verificare sender authentication
    console.log('\n🔐 Test 3: Sender Authentication Status');
    const sendersResponse = await fetch('https://api.sendgrid.com/v3/senders', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (sendersResponse.ok) {
      const senders = await sendersResponse.json();
      console.log('✅ Senders configurati:');
      senders.forEach(sender => {
        console.log(`- ${sender.from.email}: ${sender.verified ? '✅ Verificato' : '❌ Non verificato'}`);
      });
    } else {
      console.log('❌ Impossibile recuperare senders');
    }

    // Test 4: Verificare dominio authentication
    console.log('\n🌐 Test 4: Domain Authentication');
    const domainsResponse = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (domainsResponse.ok) {
      const domains = await domainsResponse.json();
      console.log('✅ Domini autenticati:');
      domains.forEach(domain => {
        console.log(`- ${domain.domain}: ${domain.valid ? '✅ Valido' : '❌ Non valido'}`);
      });
      
      // Verifica specifica per it-era.it
      const itEraDomain = domains.find(d => d.domain === 'it-era.it');
      if (itEraDomain) {
        console.log(`\n🎯 Dominio it-era.it: ${itEraDomain.valid ? '✅ OK' : '❌ PROBLEMA!'}`);
        if (!itEraDomain.valid) {
          console.log('🚨 CAUSA PROBABILE: Dominio it-era.it non più valido!');
        }
      } else {
        console.log('\n🚨 PROBLEMA: Dominio it-era.it non trovato nei domini autenticati!');
      }
    }

    // Test 5: Simulare invio email per vedere errore esatto
    console.log('\n📧 Test 5: Simulate Email Send');
    const sendResponse = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'test@example.com' }]
        }],
        from: { 
          email: SENDER_EMAIL,
          name: 'IT-ERA Test'
        },
        subject: 'Diagnostic Test',
        content: [{
          type: 'text/plain',
          value: 'Test diagnostic'
        }]
      })
    });

    if (sendResponse.ok) {
      console.log('✅ Email inviata con successo (simulazione)');
    } else {
      console.log('❌ ERRORE NELL\'INVIO:');
      const errorText = await sendResponse.text();
      console.log(`Status: ${sendResponse.status}`);
      console.log(`Response: ${errorText}`);
      
      try {
        const errorJson = JSON.parse(errorText);
        console.log('\n🔍 ANALISI ERRORE:');
        if (errorJson.errors) {
          errorJson.errors.forEach(error => {
            console.log(`- ${error.message}`);
            if (error.field) console.log(`  Campo: ${error.field}`);
            if (error.help) console.log(`  Help: ${error.help}`);
          });
        }
      } catch (e) {
        console.log('Errore non in formato JSON');
      }
    }

    return true;

  } catch (error) {
    console.log(`❌ Errore durante test API Key: ${error.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 SENDGRID DIAGNOSTIC TOOL');
  console.log('===========================');
  
  let validKeys = 0;
  
  for (let i = 0; i < API_KEYS.length; i++) {
    const isValid = await testApiKey(API_KEYS[i], i);
    if (isValid) validKeys++;
    
    if (i < API_KEYS.length - 1) {
      console.log('\n' + '='.repeat(50));
    }
  }
  
  console.log('\n🎯 RIEPILOGO DIAGNOSTICA');
  console.log('========================');
  console.log(`API Keys valide: ${validKeys}/${API_KEYS.length}`);
  
  if (validKeys === 0) {
    console.log('\n🚨 PROBLEMA CRITICO: Tutte le API key sono invalide o revocate');
    console.log('SOLUZIONI:');
    console.log('1. Accedere al dashboard SendGrid');
    console.log('2. Verificare stato account (sospeso?)');
    console.log('3. Rigenerare nuove API keys');
    console.log('4. Controllare sender authentication');
  } else if (validKeys < API_KEYS.length) {
    console.log('\n⚠️  ATTENZIONE: Alcune API keys non funzionano');
  }
  
  console.log('\n📋 PROSSIMI PASSI:');
  console.log('1. Accedi a https://app.sendgrid.com');
  console.log('2. Controlla Dashboard > Account Details');
  console.log('3. Verifica Settings > Sender Authentication');
  console.log('4. Controlla Activity > All Activity per blocchi');
}

if (require.main === module) {
  main().catch(console.error);
}

module.exports = { testApiKey };
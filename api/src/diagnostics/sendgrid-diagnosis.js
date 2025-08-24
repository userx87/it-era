/**
 * SendGrid Diagnostic Tool for IT-ERA Email Issues
 * Comprehensive analysis of SendGrid configuration problems
 */

// DIAGNOSI PROBLEMI SENDGRID - IT-ERA.IT

/**
 * POSSIBILI CAUSE ERRORE 500:
 * 
 * 1. API KEY INVALIDA O LIMITATA
 * - La key potrebbe non avere permessi "Mail Send"
 * - La key potrebbe essere stata revocata
 * - La key potrebbe avere restrizioni IP
 * 
 * 2. DOMINIO NON AUTENTICATO CORRETTAMENTE
 * - it-era.it deve essere autenticato via Domain Authentication
 * - SPF, DKIM, DMARC records potrebbero essere mancanti
 * - Il mittente deve essere autorizzato per il dominio
 * 
 * 3. PROBLEMI CONFIGURAZIONE MITTENTE
 * - Email mittente non verificata su SendGrid
 * - Dominio mittente non corrisponde a quello autenticato
 * - Mancanza di Sender Identity verificata
 */

// TEST DIAGNOSTICI IMMEDIATI

const SENDGRID_API_KEY = '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';

/**
 * Test 1: Verifica API Key e Permessi
 */
async function testApiKeyPermissions() {
  console.log('🔍 Test 1: Verificando API Key e Permessi...');
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/scopes', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ API Key valida');
      console.log('Permessi disponibili:', data.scopes);
      
      // Verifica se ha il permesso mail.send
      const hasMailSend = data.scopes.includes('mail.send');
      console.log(`Mail Send Permission: ${hasMailSend ? '✅ SI' : '❌ NO'}`);
      
      return { valid: true, hasMailSend, scopes: data.scopes };
    } else {
      console.log('❌ API Key non valida o problema di autenticazione');
      console.log('Errore:', data);
      return { valid: false, error: data };
    }
  } catch (error) {
    console.log('❌ Errore durante test API Key:', error.message);
    return { valid: false, error: error.message };
  }
}

/**
 * Test 2: Verifica Stato Dominio
 */
async function testDomainAuthentication() {
  console.log('🔍 Test 2: Verificando autenticazione dominio it-era.it...');
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/whitelabel/domains', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Richiesta domini riuscita');
      
      const iteraDomain = data.find(domain => domain.domain === 'it-era.it');
      
      if (iteraDomain) {
        console.log('✅ Dominio it-era.it trovato');
        console.log('Stato validazione:', iteraDomain.valid ? '✅ VALIDO' : '❌ NON VALIDO');
        console.log('DNS Records:', iteraDomain.dns);
        return { found: true, valid: iteraDomain.valid, domain: iteraDomain };
      } else {
        console.log('❌ Dominio it-era.it NON trovato nella lista domini autenticati');
        console.log('Domini disponibili:', data.map(d => d.domain));
        return { found: false, availableDomains: data.map(d => d.domain) };
      }
    } else {
      console.log('❌ Errore recupero domini:', data);
      return { error: data };
    }
  } catch (error) {
    console.log('❌ Errore durante test dominio:', error.message);
    return { error: error.message };
  }
}

/**
 * Test 3: Verifica Sender Identity
 */
async function testSenderIdentity() {
  console.log('🔍 Test 3: Verificando Sender Identity...');
  
  try {
    const response = await fetch('https://api.sendgrid.com/v3/verified_senders', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Richiesta sender identity riuscita');
      
      const senders = data.results || [];
      const iteraSenders = senders.filter(sender => 
        sender.from_email.includes('@it-era.it')
      );
      
      console.log('Sender IT-ERA trovati:', iteraSenders.length);
      
      iteraSenders.forEach(sender => {
        console.log(`- ${sender.from_email}: ${sender.verified ? '✅ VERIFICATO' : '❌ NON VERIFICATO'}`);
      });
      
      return { senders: iteraSenders, allSenders: senders };
    } else {
      console.log('❌ Errore recupero sender identity:', data);
      return { error: data };
    }
  } catch (error) {
    console.log('❌ Errore durante test sender identity:', error.message);
    return { error: error.message };
  }
}

/**
 * Test 4: Test Invio Email con Logging Dettagliato
 */
async function testEmailSend() {
  console.log('🔍 Test 4: Tentativo invio email con logging dettagliato...');
  
  const emailData = {
    personalizations: [{
      to: [{ email: 'andrea@bulltech.it' }],
    }],
    from: { 
      email: 'info@it-era.it',
      name: 'IT-ERA Sistema Notifiche'
    },
    subject: 'Test Diagnostico SendGrid - IT-ERA',
    content: [{
      type: 'text/html',
      value: '<h1>Test Diagnostico</h1><p>Questa è una email di test per diagnosticare i problemi SendGrid.</p>',
    }],
  };

  try {
    console.log('📤 Inviando email con payload:', JSON.stringify(emailData, null, 2));
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData),
    });

    console.log('📨 Status Code:', response.status);
    console.log('📨 Status Text:', response.statusText);
    console.log('📨 Headers:', Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log('📨 Response Body:', responseText);
    
    if (response.ok) {
      console.log('✅ Email inviata con successo!');
      return { success: true, status: response.status };
    } else {
      console.log('❌ Invio fallito');
      
      let errorData;
      try {
        errorData = JSON.parse(responseText);
      } catch {
        errorData = { message: responseText };
      }
      
      return { success: false, status: response.status, error: errorData };
    }
  } catch (error) {
    console.log('❌ Errore durante invio:', error.message);
    return { success: false, error: error.message };
  }
}

/**
 * ESEGUIRE TUTTI I TEST
 */
async function runFullDiagnosis() {
  console.log('🚀 INIZIANDO DIAGNOSI COMPLETA SENDGRID - IT-ERA.IT');
  console.log('=' .repeat(60));
  
  const results = {};
  
  // Test 1: API Key
  results.apiKey = await testApiKeyPermissions();
  console.log('\n');
  
  // Test 2: Dominio
  results.domain = await testDomainAuthentication();
  console.log('\n');
  
  // Test 3: Sender Identity
  results.senderIdentity = await testSenderIdentity();
  console.log('\n');
  
  // Test 4: Invio Email
  results.emailSend = await testEmailSend();
  console.log('\n');
  
  console.log('📊 RISULTATI DIAGNOSI:');
  console.log('=' .repeat(60));
  console.log('API Key valida:', results.apiKey.valid ? '✅' : '❌');
  console.log('Permessi Mail Send:', results.apiKey.hasMailSend ? '✅' : '❌');
  console.log('Dominio autenticato:', results.domain.found && results.domain.valid ? '✅' : '❌');
  console.log('Invio email riuscito:', results.emailSend.success ? '✅' : '❌');
  
  return results;
}

// SOLUZIONI BASATE SU DIAGNOSI

/**
 * SOLUZIONE 1: API Key senza permessi Mail Send
 */
const SOLUTION_API_KEY = `
❌ PROBLEMA: API Key non ha permessi Mail Send
✅ SOLUZIONE:
1. Vai su SendGrid Dashboard > Settings > API Keys
2. Crea una nuova API Key con "Full Access" o almeno "Mail Send"
3. Sostituisci la key nel tuo Worker Cloudflare
`;

/**
 * SOLUZIONE 2: Dominio non autenticato
 */
const SOLUTION_DOMAIN = `
❌ PROBLEMA: Dominio it-era.it non autenticato su SendGrid
✅ SOLUZIONE:
1. Vai su SendGrid Dashboard > Settings > Sender Authentication
2. Clicca "Authenticate Your Domain"
3. Inserisci it-era.it come dominio
4. Aggiungi i DNS records forniti da SendGrid al tuo provider DNS
5. Verifica l'autenticazione
`;

/**
 * SOLUZIONE 3: Sender Identity non verificata
 */
const SOLUTION_SENDER = `
❌ PROBLEMA: Email mittente non verificata
✅ SOLUZIONE RAPIDA (Single Sender):
1. Vai su SendGrid Dashboard > Settings > Sender Authentication
2. Clicca "Create a Single Sender"
3. Aggiungi info@it-era.it o noreply@it-era.it
4. Verifica l'email ricevuta

✅ SOLUZIONE COMPLETA (Domain Authentication):
Usa l'autenticazione dominio completa (SOLUZIONE 2)
`;

module.exports = {
  runFullDiagnosis,
  testApiKeyPermissions,
  testDomainAuthentication,
  testSenderIdentity,
  testEmailSend,
  SOLUTION_API_KEY,
  SOLUTION_DOMAIN,
  SOLUTION_SENDER
};
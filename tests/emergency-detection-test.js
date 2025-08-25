/**
 * IT-ERA Emergency Detection System Test Suite
 * Tests the critical emergency detection and bypass functionality
 */

const emergencyTestScenarios = [
  // CRITICAL SERVER EMERGENCIES
  {
    name: "Server Down Emergency",
    message: "Il nostro server è down da 2 ore, non riusciamo a lavorare!",
    expectedEmergency: true,
    expectedType: "SERVER_DOWN",
    expectedScore: 65, // server + down + non riusciamo lavorare
    context: { location: "Milano" }
  },
  
  {
    name: "Website Offline Emergency",
    message: "URGENTE: Il sito è offline e stiamo perdendo soldi ogni ora",
    expectedEmergency: true,
    expectedType: "BUSINESS_CRITICAL", 
    expectedScore: 90, // urgente + offline + perdendo soldi
    context: { location: "Bergamo" }
  },

  // RANSOMWARE/SECURITY EMERGENCIES
  {
    name: "Ransomware Attack",
    message: "Abbiamo un ransomware! Tutti i file sono criptati, aiuto!",
    expectedEmergency: true,
    expectedType: "SECURITY_BREACH",
    expectedScore: 90, // ransomware + file criptati
    context: { location: "Como" }
  },

  {
    name: "Hacker Attack",
    message: "Siamo stati hackerati! Il sistema è compromesso, emergenza!",
    expectedEmergency: true,
    expectedType: "SECURITY_BREACH",
    expectedScore: 110, // hack + emergenza + critico
    context: { location: "Lecco" }
  },

  // BUSINESS CRITICAL EMERGENCIES  
  {
    name: "Business Critical - Production Down",
    message: "La produzione è ferma, perdendo 5000€ ogni ora. Intervento immediato!",
    expectedEmergency: true,
    expectedType: "BUSINESS_CRITICAL",
    expectedScore: 85, // produzione ferma + perdendo + immediato
    context: { location: "Monza" }
  },

  {
    name: "All Systems Down",
    message: "Tutto fermo! Sistema bloccato, clienti arrabbiati, panico!",
    expectedEmergency: true, 
    expectedType: "GENERAL_EMERGENCY",
    expectedScore: 90, // tutto fermo + sistema bloccato + panico
    context: { location: "Varese" }
  },

  // DATA LOSS EMERGENCIES
  {
    name: "Critical Data Loss",
    message: "Abbiamo perso tutti i dati! Il database è cancellato, recupero urgente!",
    expectedEmergency: true,
    expectedType: "DATA_LOSS", 
    expectedScore: 90, // perso dati + database cancellato + urgente
    context: { location: "Pavia" }
  },

  // NON-EMERGENCY SCENARIOS (should NOT trigger)
  {
    name: "Normal Assistance Request",
    message: "Vorrei un preventivo per assistenza IT per la mia azienda",
    expectedEmergency: false,
    expectedScore: 0,
    context: { location: "Milano" }
  },

  {
    name: "General IT Question",
    message: "Quali servizi offrite per la sicurezza informatica?",
    expectedEmergency: false, 
    expectedScore: 0,
    context: { location: "Roma" }
  },

  {
    name: "Mild Urgency (not emergency)",
    message: "Ho un problema con la stampante, potreste aiutarmi?",
    expectedEmergency: false,
    expectedScore: 0,
    context: { location: "Torino" }
  }
];

// Mock the emergency detection functions (copied from chatbot-worker.js)
function detectEmergency(message, context = {}) {
  const msg = message.toLowerCase().trim();
  const city = context.location || context.comune || "Milano";
  
  // Emergency keywords and phrases
  const emergencyKeywords = [
    // Server/Infrastructure Emergencies
    'server down', 'server offline', 'server crash', 'server bloccato', 'server non funziona',
    'sito down', 'sito offline', 'sito non funziona', 'sito bloccato', 'sistema down',
    'database down', 'database offline', 'database corrotto', 'rete down', 'connessione down',
    
    // Ransomware/Security Emergencies
    'ransomware', 'virus', 'malware', 'cyber attack', 'attacco informatico', 'hackerato',
    'hack', 'hacker', 'violazione dati', 'data breach', 'sicurezza compromessa',
    'file criptati', 'richiesta riscatto', 'riscatto bitcoin', 'cryptolocker',
    
    // Business Critical Emergencies
    'emergenza', 'urgente', 'critico', 'bloccati', 'fermi', 'non possiamo lavorare',
    'perdendo soldi', 'perdita economica', 'disastro', 'panico', 'help urgente',
    'tutto fermo', 'sistema bloccato', 'non riusciamo', 'impossibile lavorare',
    
    // Data Loss Emergencies
    'perso dati', 'dati cancellati', 'hard disk rotto', 'backup non funziona',
    'recupero dati urgente', 'file spariti', 'database cancellato', 'disco rotto',
    
    // Time-sensitive phrases
    'ogni ora', 'ogni minuto', 'subito', 'ora', 'adesso', 'immediato',
    'non può aspettare', 'tempo limitato', 'scadenza', 'cliente arrabbiato'
  ];
  
  const businessImpactPhrases = [
    'perdendo soldi', 'perdita economica', 'clienti arrabbiati', 'lavoro fermo',
    'produzione ferma', 'vendite bloccate', 'fatturato a rischio', 'business fermo',
    'dipendenti bloccati', 'ordini fermi', 'magazzino fermo', 'spedizioni ferme'
  ];
  
  // Check for emergency patterns
  const hasEmergencyKeyword = emergencyKeywords.some(keyword => msg.includes(keyword));
  const hasBusinessImpact = businessImpactPhrases.some(phrase => msg.includes(phrase));
  const hasUrgencyIndicators = msg.includes('urgente') || msg.includes('subito') || 
                              msg.includes('emergenza') || msg.includes('critico');
  
  // Emergency scenarios scoring
  let emergencyScore = 0;
  
  if (hasEmergencyKeyword) emergencyScore += 40;
  if (hasBusinessImpact) emergencyScore += 30;
  if (hasUrgencyIndicators) emergencyScore += 20;
  if (msg.includes('down') || msg.includes('offline')) emergencyScore += 25;
  if (msg.includes('ransomware') || msg.includes('virus')) emergencyScore += 50;
  if (msg.includes('hackerato') || msg.includes('hack')) emergencyScore += 45;
  if (msg.includes('perdendo') && (msg.includes('soldi') || msg.includes('denaro'))) emergencyScore += 35;
  if (msg.includes('tutto') && msg.includes('fermo')) emergencyScore += 30;
  
  // Emergency threshold
  const isEmergency = emergencyScore >= 40;
  
  if (isEmergency) {
    return {
      isEmergency: true,
      emergencyScore,
      emergencyType: determineEmergencyType(msg),
      city,
      timestamp: new Date().toISOString(),
      ticketId: generateEmergencyTicketId()
    };
  }
  
  return { isEmergency: false, emergencyScore };
}

function determineEmergencyType(message) {
  const msg = message.toLowerCase();
  
  if (msg.includes('ransomware') || msg.includes('virus') || msg.includes('hack')) {
    return 'SECURITY_BREACH';
  }
  if (msg.includes('server') && (msg.includes('down') || msg.includes('crash'))) {
    return 'SERVER_DOWN';
  }
  if (msg.includes('perdendo soldi') || msg.includes('business fermo')) {
    return 'BUSINESS_CRITICAL';
  }
  if (msg.includes('dati') && (msg.includes('perso') || msg.includes('cancellati'))) {
    return 'DATA_LOSS';
  }
  
  return 'GENERAL_EMERGENCY';
}

function generateEmergencyTicketId() {
  const timestamp = Date.now();
  return `CRITICAL-${timestamp}`;
}

// Test runner
function runEmergencyDetectionTests() {
  console.log('🚨 IT-ERA EMERGENCY DETECTION SYSTEM TEST SUITE 🚨\n');
  console.log('=' .repeat(60));
  
  let totalTests = emergencyTestScenarios.length;
  let passedTests = 0;
  let failedTests = 0;
  
  emergencyTestScenarios.forEach((scenario, index) => {
    console.log(`\n[TEST ${index + 1}] ${scenario.name}`);
    console.log(`Message: "${scenario.message}"`);
    console.log(`Context: ${JSON.stringify(scenario.context)}`);
    
    const result = detectEmergency(scenario.message, scenario.context);
    
    // Check if emergency detection matches expected
    const emergencyMatch = result.isEmergency === scenario.expectedEmergency;
    
    // Check emergency type if it's an emergency
    let typeMatch = true;
    if (scenario.expectedEmergency && result.isEmergency) {
      typeMatch = result.emergencyType === scenario.expectedType;
    }
    
    // Check score is within reasonable range
    const scoreMatch = Math.abs(result.emergencyScore - scenario.expectedScore) <= 20;
    
    const testPassed = emergencyMatch && typeMatch && scoreMatch;
    
    if (testPassed) {
      console.log('✅ PASSED');
      passedTests++;
    } else {
      console.log('❌ FAILED');
      failedTests++;
    }
    
    console.log(`Expected: Emergency=${scenario.expectedEmergency}, Type=${scenario.expectedType}, Score~${scenario.expectedScore}`);
    console.log(`Actual: Emergency=${result.isEmergency}, Type=${result.emergencyType || 'N/A'}, Score=${result.emergencyScore}`);
    
    if (result.isEmergency) {
      console.log(`🎫 Ticket ID: ${result.ticketId}`);
      console.log(`📍 City: ${result.city}`);
    }
  });
  
  console.log('\n' + '=' .repeat(60));
  console.log('TEST SUMMARY:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`✅ Passed: ${passedTests}`);
  console.log(`❌ Failed: ${failedTests}`);
  console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
  
  if (failedTests === 0) {
    console.log('\n🎉 ALL TESTS PASSED! Emergency detection system is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please review the emergency detection logic.');
  }
  
  // Test the emergency response format
  console.log('\n' + '=' .repeat(60));
  console.log('TESTING EMERGENCY RESPONSE FORMAT:');
  
  const sampleEmergency = {
    isEmergency: true,
    emergencyScore: 95,
    emergencyType: 'SERVER_DOWN',
    city: 'Milano',
    timestamp: new Date().toISOString(),
    ticketId: 'CRITICAL-1756051234567'
  };
  
  const emergencyResponse = generateEmergencyResponse(sampleEmergency);
  console.log('\nSample Emergency Response:');
  console.log('Message:', emergencyResponse.message);
  console.log('Options:', emergencyResponse.options);
  console.log('Priority:', emergencyResponse.priority);
  console.log('Bypasses flows:', emergencyResponse.bypassAllFlows);
  
  return { totalTests, passedTests, failedTests };
}

function generateEmergencyResponse(emergencyData, context = {}) {
  const { city, emergencyType, ticketId } = emergencyData;
  
  const emergencyResponse = {
    message: `[IT-ERA] EMERGENZA RICEVUTA!
🚨 INTERVENTO IMMEDIATO ${city.toUpperCase()}
Numero Emergenza H24: 039 888 2041

Team in partenza: ETA 45 minuti
Ticket priorità MASSIMA: #${ticketId}

CHIAMACI ORA: 039 888 2041`,
    
    options: [
      "CHIAMA ORA: 039 888 2041",
      "Invia posizione per intervento", 
      "Descrizione dettagliata emergenza"
    ],
    
    nextStep: "emergency_immediate_response",
    intent: "emergency_critical",
    confidence: 1.0,
    escalate: true,
    priority: 'immediate',
    emergencyType,
    ticketId,
    bypassAllFlows: true,
    requiresImmediateAction: true,
    aiPowered: false,
    emergency: true
  };
  
  return emergencyResponse;
}

// Run the tests
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = { 
    runEmergencyDetectionTests, 
    detectEmergency, 
    emergencyTestScenarios 
  };
} else {
  // Browser environment or direct execution
  runEmergencyDetectionTests();
}
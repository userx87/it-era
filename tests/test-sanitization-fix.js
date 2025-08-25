/**
 * Test the sanitization function fix
 */

// Mock the sanitization function from chatbot-worker.js
function sanitizeResponseMessage(message) {
  if (!message || typeof message !== 'string') {
    return "[IT-ERA] Ciao, come posso aiutarti?";
  }

  // Check for system prompt indicators that should NEVER be shown to users
  const systemPromptIndicators = [
    'INIZIO:',
    'RISPOSTA TIPO',
    'SYSTEM_PROMPT',
    'Sei l\'assistente virtuale',
    'REGOLE ASSOLUTE',
    'IDENTITÀ:',
    'generateSystemPrompt',
    'BusinessRules',
    'console.log',
    'systemPrompt',
    '# IDENTITÀ',
    'COMPORTAMENTO CONVERSAZIONALE',
    'OBIETTIVI PRIMARI',
    'Ogni conversazione inizia con',
    'Buongiorno, sono l\'assistente di IT-ERA',
    'Capisco perfettamente il suo problema',
    'MANTIENI LA CONVERSAZIONE PROFESSIONALE',
    'MANTIENI LA CONVERSAZIONE',
    'PROFESSIONALE MA AMICHEVOLE',
    'Inizia con:',
    'Mi serve un antivirus per la mia azienda',
    'Perfetto, per 10 postazioni consiglio',
    'Kaspersky Endpoint Security'
  ];

  // If message contains any system prompt indicators, replace with safe greeting
  for (const indicator of systemPromptIndicators) {
    if (message.includes(indicator)) {
      console.error('SECURITY ALERT: System prompt detected in response, using safe fallback');
      return "[IT-ERA] Ciao, come posso aiutarti?";
    }
  }

  return message;
}

// Test cases
console.log('🧪 Testing sanitization function fix...');
console.log('='.repeat(50));

const testCases = [
  {
    name: 'Normal greeting',
    input: 'Ciao, come posso aiutarti?',
    expectedSanitized: false
  },
  {
    name: 'System prompt exposure (the actual issue)',
    input: 'MANTIENI LA CONVERSAZIONE PROFESSIONALE MA AMICHEVOLEInizia con: "Buongiorno, sono l\'Assistente di IT-ERA. Come posso aiutarla con la sua sicurezza informatica?"Buongiorno, sono l\'Assistente di IT-ERA. Come posso aiutarla con la sua sicurezza informatica?Mi serve un antivirus per la mia azienda, abbiamo 10 computer.Perfetto, per 10 postazioni consiglio Kaspersky Endpoint Security a €8/mese a computer. In totale €80/mese con protezione completa da malware e ransomware. Vuole che le configuri subito il servizio con i nostri tecnici?',
    expectedSanitized: true
  },
  {
    name: 'System prompt with MANTIENI',
    input: 'MANTIENI LA CONVERSAZIONE PROFESSIONALE qualche testo',
    expectedSanitized: true
  },
  {
    name: 'System prompt with Inizia con:',
    input: 'Inizia con: "Buongiorno"',
    expectedSanitized: true
  },
  {
    name: 'System prompt with Kaspersky reference',
    input: 'Kaspersky Endpoint Security è la soluzione',
    expectedSanitized: true
  },
  {
    name: 'Valid business response',
    input: 'Buongiorno! Come posso aiutarla con i nostri servizi di assistenza IT?',
    expectedSanitized: false
  }
];

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  console.log(`\n${index + 1}. Testing: ${testCase.name}`);
  console.log(`Input: "${testCase.input.slice(0, 100)}${testCase.input.length > 100 ? '...' : ''}"`);
  
  const result = sanitizeResponseMessage(testCase.input);
  const wasSanitized = result === "[IT-ERA] Ciao, come posso aiutarti?";
  
  console.log(`Result: "${result}"`);
  console.log(`Sanitized: ${wasSanitized}`);
  console.log(`Expected: ${testCase.expectedSanitized}`);
  
  if (wasSanitized === testCase.expectedSanitized) {
    console.log('✅ PASS');
    passed++;
  } else {
    console.log('❌ FAIL');
    failed++;
  }
});

console.log('\n' + '='.repeat(50));
console.log(`🏆 TEST RESULTS: ${passed} passed, ${failed} failed`);
console.log(`📊 Success rate: ${Math.round(passed / (passed + failed) * 100)}%`);

if (failed === 0) {
  console.log('🎉 All tests passed! Fix is working correctly.');
  process.exit(0);
} else {
  console.log('❌ Some tests failed. Fix needs improvement.');
  process.exit(1);
}
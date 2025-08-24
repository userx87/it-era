#!/usr/bin/env node

/**
 * Lombardy Municipality Coverage Analysis
 * Verifies that all 12 provinces are properly covered
 */

const fs = require('fs');
const path = require('path');

// Complete mapping of Lombardy municipalities by province
const LOMBARDY_PROVINCES = {
  'Milano (MI)': [
    'abbiategrasso', 'assago', 'basiano', 'basiglio', 'binasco', 'bollate', 'bresso', 
    'brugherio', 'buccinasco', 'cambiago', 'caronno-pertusella', 'cesano-boscone', 
    'cesano-maderno', 'cinisello-balsamo', 'cislago', 'cologno-monzese', 'cormano', 
    'corsico', 'cusano-milanino', 'garbagnate-milanese', 'lacchiarella', 'limbiate', 
    'locate-di-triulzi', 'milano', 'novate-milanese', 'opera', 'paderno-dugnano', 
    'pieve-emanuele', 'rho', 'rozzano', 'senago', 'sesto-san-giovanni', 'solaro', 
    'trezzano-sul-naviglio'
  ],
  
  'Bergamo (BG)': [
    'albino', 'almenno-san-bartolomeo', 'alzano-lombardo', 'bariano', 'bergamo', 
    'brignano-gera-d-adda', 'calvenzano', 'caravaggio', 'casirate-d-adda', 'casnigo', 
    'castione-della-presolana', 'cazzano-sant-andrea', 'clusone', 'colzate', 'curno', 
    'dalmine', 'fara-gera-d-adda', 'fiorano-al-serio', 'gandino', 'gazzaniga', 'gorle', 
    'grassobbio', 'leffe', 'lurano', 'misano-di-gera-d-adda', 'mozzo', 'nembro', 
    'orio-al-serio', 'osio-sotto', 'pagazzano', 'paladina', 'parre', 'pedrengo', 
    'ponte-nossa', 'ponte-san-pietro', 'pradalunga', 'premolo', 'ranica', 
    'romano-di-lombardia', 'san-pellegrino-terme', 'sant-omobono-terme', 
    'scanzorosciate', 'seriate', 'spirano', 'stezzano', 'torre-boldone', 
    'trescore-cremasco', 'treviglio', 'verdellino', 'vertova', 'villa-d-alme', 
    'villa-di-serio', 'zanica', 'zogno'
  ],
  
  'Brescia (BS)': [
    // Note: No Brescia municipalities found in current list - needs verification
  ],
  
  'Como (CO)': [
    'anzano-del-parco', 'appiano-gentile', 'bregnano', 'bulgarograsso', 'cabiate', 
    'cadorago', 'cantu', 'capiago-intimiano', 'carbonate', 'carimate', 'cermenate', 
    'cirimido', 'como', 'fenegro', 'figino-serenza', 'fino-mornasco', 'inverigo', 
    'lambrugo', 'limido-comasco', 'locate-varesino', 'lomazzo', 'lurate-caccivio', 
    'mariano-comense', 'montorfano', 'mozzate', 'novedrate', 'olgiate-comasco', 
    'rovellasca', 'rovello-porro', 'senna-comasco', 'turate', 'veniano'
  ],
  
  'Cremona (CR)': [
    'agnadello', 'casalpusterlengo', 'castiglione-d-adda', 'codogno', 'covo', 'crema', 
    'dovera', 'fombio', 'formigara', 'offanengo', 'pandino', 'pieve-fissiraga', 
    'pizzighettone', 'rivolta-d-adda', 'spino-d-adda', 'tavazzano-con-villavesco', 
    'trescore-cremasco', 'vaiano-cremasco'
  ],
  
  'Lecco (LC)': [
    'abbadia-lariana', 'airuno', 'annone-di-brianza', 'ballabio', 'barzago', 'barzio', 
    'bellano', 'calolziocorte', 'cassina-valsassina', 'colico', 'cortenova', 
    'costa-masnaga', 'cremeno', 'dervio', 'dolzago', 'ello', 'garlate', 'introbio', 
    'la-valletta-brianza', 'lecco', 'lierna', 'malgrate', 'mandello-del-lario', 
    'merate', 'moggio', 'montevecchia', 'morterone', 'nibionno', 'oggiono', 'olginate', 
    'osnago', 'pasturo', 'perledo', 'premana', 'primaluna', 'rogeno', 'taceno', 
    'valmadrera', 'varenna'
  ],
  
  'Lodi (LO)': [
    'borghetto-lodigiano', 'lodi', 'lodi-vecchio', 'maleo', 'montanaso-lombardo', 
    'ossago-lodigiano', 'san-fiorano', 'sant-angelo-lodigiano', 'somaglia', 
    'zelo-buon-persico'
  ],
  
  'Monza e Brianza (MB)': [
    'agrate-brianza', 'aicurzio', 'albiate', 'arcore', 'arosio', 'barlassina', 
    'bernareggio', 'besana-in-brianza', 'biassono', 'bovisio-masciago', 'brenna', 
    'burago-di-molgora', 'busnago', 'camparada', 'carate-brianza', 'carnate', 
    'carugo', 'casatenovo', 'cavenago-di-brianza', 'cernusco-lombardone', 'cesate', 
    'cogliate', 'concorezzo', 'cornate-d-adda', 'correzzana', 'desio', 'giussano', 
    'lazzate', 'lentate-sul-seveso', 'lesmo', 'lissone', 'masate', 'meda', 'mezzago', 
    'misinto', 'monza', 'muggio', 'nova-milanese', 'novate-brianza', 'ornago', 
    'renate', 'roncello', 'ronco-briantino', 'seregno', 'seveso', 'sovico', 
    'sulbiate', 'triuggio', 'uboldo', 'usmate-velate', 'varedo', 'vedano-al-lambro', 
    'verano-brianza', 'villasanta', 'vimercate'
  ],
  
  'Mantova (MN)': [
    // Note: No Mantova municipalities found in current list - needs verification
  ],
  
  'Pavia (PV)': [
    'besate', 'bubbiano', 'calvignasco', 'morimondo', 'noviglio', 'rosate', 
    'zibido-san-giacomo'
  ],
  
  'Sondrio (SO)': [
    // Note: No Sondrio municipalities found in current list - needs verification
  ],
  
  'Varese (VA)': [
    'gerenzano', 'origgio', 'saronno', 'uboldo'
  ]
};

function analyzeCoverage() {
  console.log('='.repeat(80));
  console.log('LOMBARDY MUNICIPALITY COVERAGE ANALYSIS');
  console.log('='.repeat(80));
  
  // Read municipality list from file names
  const pagesDir = path.join(__dirname, '../web/pages-draft');
  let files;
  
  try {
    files = fs.readdirSync(pagesDir);
  } catch (err) {
    console.error('Error reading pages-draft directory:', err.message);
    return;
  }
  
  const municipalities = files
    .filter(file => file.startsWith('assistenza-it-') && file.endsWith('.html'))
    .map(file => file.replace('assistenza-it-', '').replace('.html', ''))
    .sort();
  
  console.log(`Total municipalities found: ${municipalities.length}`);
  console.log('');
  
  // Analyze coverage by province
  const coverageReport = {};
  const uncategorizedMunicipalities = [...municipalities];
  
  Object.keys(LOMBARDY_PROVINCES).forEach(province => {
    const expectedMunicipalities = LOMBARDY_PROVINCES[province];
    const foundMunicipalities = municipalities.filter(m => expectedMunicipalities.includes(m));
    const missingMunicipalities = expectedMunicipalities.filter(m => !municipalities.includes(m));
    
    coverageReport[province] = {
      expected: expectedMunicipalities.length,
      found: foundMunicipalities.length,
      missing: missingMunicipalities,
      coverage: expectedMunicipalities.length > 0 ? (foundMunicipalities.length / expectedMunicipalities.length * 100).toFixed(1) : '0.0'
    };
    
    // Remove categorized municipalities from uncategorized list
    foundMunicipalities.forEach(m => {
      const index = uncategorizedMunicipalities.indexOf(m);
      if (index > -1) uncategorizedMunicipalities.splice(index, 1);
    });
  });
  
  // Display results
  console.log('PROVINCE-BY-PROVINCE ANALYSIS:');
  console.log('-'.repeat(80));
  
  let totalExpected = 0;
  let totalFound = 0;
  
  Object.keys(coverageReport).forEach(province => {
    const report = coverageReport[province];
    totalExpected += report.expected;
    totalFound += report.found;
    
    console.log(`${province}: ${report.found}/${report.expected} municipalities (${report.coverage}%)`);
    
    if (report.missing.length > 0) {
      console.log(`  Missing: ${report.missing.join(', ')}`);
    }
    
    if (report.found === 0 && report.expected === 0) {
      console.log('  ⚠️  No municipalities mapped for this province - needs verification');
    }
  });
  
  console.log('');
  console.log('-'.repeat(80));
  console.log(`TOTAL COVERAGE: ${totalFound}/${totalExpected} expected municipalities`);
  
  if (uncategorizedMunicipalities.length > 0) {
    console.log('');
    console.log('UNCATEGORIZED MUNICIPALITIES:');
    console.log('(These may need to be added to province mappings)');
    uncategorizedMunicipalities.forEach(m => console.log(`- ${m}`));
  }
  
  // Check for missing provinces
  console.log('');
  console.log('PROVINCE STATUS CHECK:');
  console.log('-'.repeat(40));
  
  const missingProvinces = Object.keys(coverageReport).filter(p => 
    coverageReport[p].expected === 0 || coverageReport[p].found === 0
  );
  
  if (missingProvinces.length > 0) {
    console.log('⚠️  Provinces with incomplete coverage:');
    missingProvinces.forEach(p => {
      const status = coverageReport[p].expected === 0 ? 'No municipalities mapped' : 'Missing municipalities';
      console.log(`   ${p}: ${status}`);
    });
  } else {
    console.log('✅ All provinces have municipality coverage');
  }
  
  // Final verification
  console.log('');
  console.log('LOMBARDY PROVINCE VERIFICATION:');
  console.log('-'.repeat(40));
  console.log('Required provinces (12):');
  
  const requiredProvinces = [
    'Milano (MI)', 'Bergamo (BG)', 'Brescia (BS)', 'Como (CO)',
    'Cremona (CR)', 'Lecco (LC)', 'Lodi (LO)', 'Monza e Brianza (MB)',
    'Mantova (MN)', 'Pavia (PV)', 'Sondrio (SO)', 'Varese (VA)'
  ];
  
  requiredProvinces.forEach(province => {
    const hasData = Object.keys(coverageReport).includes(province) && coverageReport[province].found > 0;
    console.log(`${hasData ? '✅' : '❌'} ${province}`);
  });
  
  console.log('');
  console.log('='.repeat(80));
}

// Run analysis
analyzeCoverage();
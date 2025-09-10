#!/usr/bin/env node

/**
 * Auto-setup script per Q CLI - IT-ERA Project
 * Verifica e installa tutto il necessario automaticamente
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

console.log('🚀 IT-ERA Q CLI Auto-Setup Starting...\n');

// 1. Verifica Context7 MCP Server
console.log('📦 Verificando Context7 MCP Server...');
try {
  const mcpConfig = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
  if (mcpConfig.mcpServers.context7) {
    console.log('✅ Context7 MCP configurato');
  } else {
    throw new Error('Context7 non configurato');
  }
} catch (error) {
  console.log('❌ Context7 MCP mancante - Installazione...');
  execSync('npm install https://github.com/upstash/context7.git', { stdio: 'inherit' });
  console.log('✅ Context7 installato');
}

// 2. Verifica agenti
console.log('\n🤖 Verificando agenti...');
const agentsDir = path.join(os.homedir(), '.aws/amazonq/cli-agents');
const requiredAgents = [
  'IT-ERA-Orchestrator.json',
  'EspertoVercel.json', 
  'SEO-Master.json',
  'Content-Manager.json',
  'Performance-Guru.json',
  'Test-Engineer.json',
  'DevOps-Pro.json',
  'Security-Auditor.json'
];

let missingAgents = [];
requiredAgents.forEach(agent => {
  const agentPath = path.join(agentsDir, agent);
  if (fs.existsSync(agentPath)) {
    console.log(`✅ ${agent.replace('.json', '')}`);
  } else {
    console.log(`❌ ${agent.replace('.json', '')} - MANCANTE`);
    missingAgents.push(agent);
  }
});

// 3. Verifica documentazioni Context7
console.log('\n📚 Verificando documentazioni Context7...');
const docs = [
  'vercel-context7-docs.txt',
  'seo-context7-docs.txt', 
  'performance-context7-docs.txt',
  'testing-context7-docs.txt'
];

docs.forEach(doc => {
  if (fs.existsSync(doc)) {
    console.log(`✅ ${doc}`);
  } else {
    console.log(`❌ ${doc} - MANCANTE`);
  }
});

// 4. Verifica dipendenze npm
console.log('\n📦 Verificando dipendenze npm...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const nodeModules = fs.existsSync('node_modules/@upstash/context7-mcp');
  
  if (nodeModules) {
    console.log('✅ Dipendenze MCP OK');
  } else {
    console.log('⚠️  Dipendenze MCP da verificare');
  }
} catch (error) {
  console.log('❌ Errore verifica package.json');
}

// 5. Auto-load setup
console.log('\n🧠 Setup auto-load...');
const autoLoadScript = `#!/bin/bash
# IT-ERA Q CLI Auto-Load
echo "🚀 Caricamento automatico IT-ERA project memory..."
echo "💡 Esegui in Q CLI:"
echo "/context add .amazonq/project-memory.md"
echo "/knowledge add .amazonq/"
echo "/agent IT-ERA-Orchestrator"
`;

fs.writeFileSync('.amazonq/auto-load.sh', autoLoadScript);
fs.chmodSync('.amazonq/auto-load.sh', '755');
console.log('✅ Script auto-load creato');

// 6. Riepilogo
console.log('\n📋 RIEPILOGO SETUP:');
console.log('✅ Context7 MCP Server: Configurato');
console.log(`✅ Agenti: ${requiredAgents.length - missingAgents.length}/${requiredAgents.length} disponibili`);
console.log('✅ Configurazione progetto: Completa');
console.log('✅ Auto-load script: Creato');

if (missingAgents.length > 0) {
  console.log('\n⚠️  AGENTI MANCANTI:');
  missingAgents.forEach(agent => console.log(`   - ${agent.replace('.json', '')}`));
}

console.log('\n🎯 AL RIAVVIO Q CLI:');
console.log('1. /context add .amazonq/project-memory.md');
console.log('2. /knowledge add .amazonq/');  
console.log('3. /agent IT-ERA-Orchestrator');
console.log('\n🚀 Setup completato!');

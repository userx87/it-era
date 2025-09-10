#!/usr/bin/env node

/**
 * AUTO-MEMORY HOOK for IT-ERA
 * Salva automaticamente ogni modifica in memoria persistente
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configurazione
const PROJECT = 'it-era';
const MEMORY_LOG = path.join(process.cwd(), '.claude', 'memory-log.json');

// Funzione per salvare in memoria
function saveToMemory(key, value, namespace = 'auto') {
  const command = `npx claude-flow@alpha memory store "${namespace}/${PROJECT}/${key}" "${value}"`;
  
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error saving to memory: ${error}`);
      return;
    }
    console.log(`✅ Auto-saved to memory: ${key}`);
    
    // Log locale per backup
    logToFile(key, value, namespace);
  });
}

// Backup locale
function logToFile(key, value, namespace) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    namespace,
    key,
    value
  };
  
  let log = [];
  if (fs.existsSync(MEMORY_LOG)) {
    log = JSON.parse(fs.readFileSync(MEMORY_LOG, 'utf8'));
  }
  
  log.push(entry);
  
  // Mantieni solo ultimi 1000 entries
  if (log.length > 1000) {
    log = log.slice(-1000);
  }
  
  fs.writeFileSync(MEMORY_LOG, JSON.stringify(log, null, 2));
}

// PATTERN DI SALVATAGGIO AUTOMATICO

// 1. Dopo ogni modifica di file
exports.onFileEdit = (filePath, oldContent, newContent) => {
  const timestamp = new Date().toISOString();
  const key = `edit/${timestamp}`;
  const value = JSON.stringify({
    file: filePath,
    timestamp,
    changes: newContent.length - oldContent.length
  });
  
  saveToMemory(key, value, 'edits');
};

// 2. Dopo ogni comando bash
exports.onBashCommand = (command, output) => {
  const timestamp = new Date().toISOString();
  const key = `bash/${timestamp}`;
  const value = JSON.stringify({
    command,
    timestamp,
    success: !output.includes('error')
  });
  
  saveToMemory(key, value, 'commands');
};

// 3. Dopo ogni creazione file
exports.onFileCreate = (filePath, content) => {
  const timestamp = new Date().toISOString();
  const key = `create/${timestamp}`;
  const value = JSON.stringify({
    file: filePath,
    timestamp,
    size: content.length
  });
  
  saveToMemory(key, value, 'files');
};

// 4. Dopo ogni task completato
exports.onTaskComplete = (task) => {
  const key = `task/${task.id}`;
  const value = JSON.stringify({
    task: task.content,
    completed: new Date().toISOString()
  });
  
  saveToMemory(key, value, 'tasks');
};

// 5. Ogni 5 minuti - snapshot dello stato
setInterval(() => {
  const snapshot = {
    timestamp: new Date().toISOString(),
    workingDir: process.cwd(),
    memoryUsage: process.memoryUsage(),
    uptime: process.uptime()
  };
  
  saveToMemory('snapshot/latest', JSON.stringify(snapshot), 'state');
}, 5 * 60 * 1000);

// 6. Salva decisioni importanti
exports.onDecision = (decision, rationale) => {
  const timestamp = new Date().toISOString();
  const key = `decision/${timestamp}`;
  const value = JSON.stringify({
    decision,
    rationale,
    timestamp
  });
  
  saveToMemory(key, value, 'decisions');
};

console.log('🧠 Auto-Memory Hook Activated for IT-ERA');
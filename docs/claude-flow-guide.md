# Claude Flow - Guida Completa

## Introduzione

Claude Flow è un sistema avanzato di automazione AI e gestione workflow integrato nel progetto IT-ERA. Fornisce capacità di intelligenza artificiale, gestione delle sessioni, persistenza della memoria e automazione dei workflow per migliorare l'efficienza operativa.

## Caratteristiche Principali

### 🤖 Intelligenza Artificiale Ibrida
- Integrazione seamless con il sistema Auggie esistente
- Fallback automatico tra provider AI (Claude, OpenAI, Auggie)
- Routing intelligente basato sul tipo di task

### 📊 Gestione Sessioni Avanzata
- Sessioni persistenti con checkpoint automatici
- Rollback e ripristino dello stato
- Tracking completo delle attività

### 🧠 Sistema Memoria Intelligente
- Namespace organizzati per categorie
- Ricerca avanzata e indicizzazione
- Persistenza automatica e cache ottimizzata

### ⚡ Automazione Workflow
- Workflow predefiniti per task comuni
- Esecuzione parallela e gestione code
- Monitoraggio in tempo reale

### 📈 Analytics e Monitoraggio
- Metriche dettagliate delle performance
- Tracking errori e debugging
- Report automatici

## Installazione e Setup

### Prerequisiti
- Node.js >= 18.0.0
- npm >= 9.0.0
- Spazio disco per memoria persistente

### Installazione
```bash
# Le dipendenze sono già installate nel progetto IT-ERA
npm install

# Verifica installazione
npm run claude-flow -- --version
```

### Configurazione
Crea il file `.claude-flow/config.json`:

```json
{
  "enabled": true,
  "debug": false,
  "memoryBackend": "filesystem",
  "autoSave": true,
  "autoSaveInterval": 30000,
  "maxSessions": 10
}
```

## Utilizzo

### 1. Interfaccia Web
Accedi al dashboard web:
```
http://localhost:3000/claude-flow/dashboard.html
```

Funzionalità disponibili:
- Gestione sessioni
- Esecuzione workflow
- Esplorazione memoria
- Visualizzazione analytics

### 2. CLI (Command Line Interface)
```bash
# Mostra stato sistema
npm run claude-flow status

# Crea nuova sessione
npm run claude-flow session create --name "Mia Sessione"

# Lista sessioni
npm run claude-flow session list

# Esegui workflow
npm run claude-flow workflow execute code_analysis

# Modalità interattiva
npm run claude-flow interactive
```

### 3. API REST
Base URL: `/api/claude-flow`

#### Sessioni
```bash
# Crea sessione
POST /api/claude-flow/sessions
{
  "name": "Nome Sessione",
  "description": "Descrizione opzionale"
}

# Lista sessioni
GET /api/claude-flow/sessions

# Ottieni sessione
GET /api/claude-flow/sessions/{sessionId}

# Termina sessione
DELETE /api/claude-flow/sessions/{sessionId}
```

#### Workflow
```bash
# Esegui workflow
POST /api/claude-flow/workflows/execute
{
  "workflowName": "code_analysis",
  "sessionId": "optional-session-id"
}

# Stato workflow
GET /api/claude-flow/workflows/{workflowId}

# Lista workflow disponibili
GET /api/claude-flow/workflows
```

#### Memoria
```bash
# Salva in memoria
POST /api/claude-flow/memory
{
  "key": "chiave",
  "data": { "qualsiasi": "dato" },
  "namespace": "categoria"
}

# Recupera da memoria
GET /api/claude-flow/memory/{namespace}/{key}

# Cerca in memoria
GET /api/claude-flow/memory/search?q=query&namespace=categoria
```

## Workflow Disponibili

### 1. Code Analysis (`code_analysis`)
Analizza la qualità del codice e suggerisce miglioramenti.

**Passi:**
1. Scansione file
2. Analisi qualità codice
3. Generazione report

**Utilizzo:**
```bash
npm run claude-flow workflow execute code_analysis
```

### 2. Performance Optimization (`performance_optimization`)
Ottimizza le performance dell'applicazione.

**Passi:**
1. Analisi performance
2. Identificazione bottleneck
3. Suggerimenti ottimizzazione

### 3. Run Tests (`run_tests`)
Esegue suite completa di test.

**Passi:**
1. Test unitari
2. Test integrazione
3. Test end-to-end

### 4. Deploy (`deploy`)
Prepara e esegue deployment.

**Passi:**
1. Test pre-deployment
2. Deploy produzione
3. Verifica post-deployment

## Integrazione con Auggie

Claude Flow si integra seamlessly con il sistema Auggie esistente:

### Routing Ibrido
```javascript
// Il sistema sceglie automaticamente il provider migliore
const result = await claudeFlow.executeHybridTask({
  type: 'code_generation',
  instruction: 'Crea componente React'
});
```

### Fallback Chain
1. **Claude Flow** - Per workflow e automazione
2. **Auggie** - Per generazione codice
3. **OpenAI** - Fallback generale
4. **Static** - Risposte predefinite

### Compatibilità
- Mantiene compatibilità con API esistenti
- Estende funzionalità senza breaking changes
- Migrazione graduale possibile

## Esempi Pratici

### Esempio 1: Sessione Completa
```javascript
// Crea sessione
const session = await claudeFlow.createSession({
  name: 'Ottimizzazione IT-ERA',
  description: 'Sessione per ottimizzare il sito'
});

// Salva contesto
await claudeFlow.storeMemory('context', {
  project: 'IT-ERA',
  goal: 'performance optimization',
  priority: 'high'
}, session.memory.namespace);

// Esegui workflow
const workflow = await claudeFlow.executeWorkflow('performance_optimization', {
  sessionId: session.id
});

// Monitora progresso
console.log(`Workflow ${workflow.id} in esecuzione...`);
```

### Esempio 2: Integrazione Chatbot
```javascript
// Nel chatbot esistente
if (message.includes('analizza codice')) {
  const workflow = await fetch('/api/claude-flow/workflows/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      workflowName: 'code_analysis',
      options: { trigger: 'chatbot', message }
    })
  });
  
  return `🤖 Ho avviato l'analisi del codice! ID: ${workflow.id}`;
}
```

### Esempio 3: Memoria Condivisa
```javascript
// Salva risultati analisi
await claudeFlow.storeMemory('analysis_results', {
  timestamp: new Date(),
  issues: ['Performance issue in API', 'Memory leak in component'],
  suggestions: ['Optimize database queries', 'Fix memory management']
}, 'code_analysis');

// Recupera in seguito
const results = await claudeFlow.retrieveMemory('analysis_results', 'code_analysis');
console.log('Problemi trovati:', results.issues);
```

## Monitoraggio e Debug

### Metriche Disponibili
- **Sessioni**: Create, attive, durata media
- **Workflow**: Eseguiti, completati, falliti
- **Memoria**: Operazioni, hit rate, dimensione
- **Performance**: Tempo risposta, throughput
- **Errori**: Totali, per tipo, per componente

### Visualizzazione
```bash
# Stato completo sistema
npm run claude-flow status

# Analytics via API
curl http://localhost:3000/api/claude-flow/analytics
```

### Debug Mode
```bash
# Abilita debug
export CLAUDE_FLOW_DEBUG=true
npm run claude-flow status
```

## Best Practices

### 1. Gestione Sessioni
- Usa nomi descrittivi per le sessioni
- Termina sessioni non utilizzate
- Sfrutta i checkpoint per rollback

### 2. Memoria
- Organizza dati in namespace logici
- Usa chiavi descrittive
- Pulisci dati obsoleti periodicamente

### 3. Workflow
- Monitora l'esecuzione dei workflow
- Gestisci errori appropriatamente
- Usa workflow personalizzati per task specifici

### 4. Performance
- Monitora metriche regolarmente
- Ottimizza workflow lenti
- Usa cache per dati frequenti

## Troubleshooting

### Problemi Comuni

#### 1. Engine non si inizializza
```bash
# Verifica configurazione
cat .claude-flow/config.json

# Controlla permessi directory
ls -la .claude-flow/

# Debug inizializzazione
CLAUDE_FLOW_DEBUG=true npm run claude-flow status
```

#### 2. Workflow falliscono
```bash
# Controlla log errori
npm run claude-flow workflow status {workflowId}

# Verifica sessione attiva
npm run claude-flow session list --active
```

#### 3. Memoria non persistente
```bash
# Verifica backend memoria
grep memoryBackend .claude-flow/config.json

# Controlla spazio disco
df -h .claude-flow/memory/
```

### Log e Debugging
I log sono disponibili in:
- Console (se debug abilitato)
- Memoria sistema (`system` namespace)
- File analytics (`.claude-flow/analytics/`)

## Estensioni e Personalizzazioni

### Workflow Personalizzati
Crea file in `lib/claude-flow/workflows/custom-workflow.json`:

```json
{
  "name": "Custom Workflow",
  "description": "Il mio workflow personalizzato",
  "steps": [
    {
      "name": "Step 1",
      "type": "ai_task",
      "params": {
        "task": "custom_task",
        "prompt": "Esegui task personalizzato"
      }
    }
  ]
}
```

### Plugin e Integrazioni
Il sistema supporta estensioni tramite:
- Handler personalizzati per step
- Integrazioni API esterne
- Provider AI aggiuntivi

## Supporto

Per supporto e domande:
- 📧 Email: info@it-era.it
- 📞 Telefono: 039 888 2041
- 🌐 Sito: https://www.it-era.it

## API Reference

Vedi [API Reference completa](claude-flow-api.md) per dettagli su tutti gli endpoint disponibili.

## Changelog

### v1.0.0 (2024-12-10)
- Rilascio iniziale
- Integrazione completa con IT-ERA
- Dashboard web
- CLI completa
- API REST
- Sistema analytics
- Integrazione Auggie

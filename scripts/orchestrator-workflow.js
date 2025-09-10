#!/usr/bin/env node

/**
 * IT-ERA Orchestrator Workflow Script
 * Gestisce l'esecuzione coordinata degli agenti specializzati
 */

const workflows = {
  standard: [
    { agent: 'Security-Auditor', phase: 'VERIFICA', description: 'Audit sicurezza e vulnerabilità' },
    { agent: 'Test-Engineer', phase: 'TESTING', description: 'Test completi e coverage' },
    { 
      agents: ['Content-Manager', 'SEO-Master', 'Performance-Guru'], 
      phase: 'SVILUPPO', 
      description: 'Sviluppo coordinato contenuti, SEO e performance',
      parallel: true 
    },
    { agent: 'Test-Engineer', phase: 'TESTING FINALE', description: 'Validazione pre-deploy' },
    { 
      agents: ['DevOps-Pro', 'EspertoVercel'], 
      phase: 'CHECK ONLINE', 
      description: 'Deploy e monitoraggio',
      parallel: true 
    }
  ],
  
  hotfix: [
    { agent: 'Security-Auditor', phase: 'VERIFICA RAPIDA', description: 'Security check hotfix' },
    { agent: 'Test-Engineer', phase: 'TESTING CRITICO', description: 'Test essenziali' },
    { agent: 'DevOps-Pro', phase: 'DEPLOY HOTFIX', description: 'Deploy immediato' }
  ],
  
  'content-only': [
    { agent: 'Content-Manager', phase: 'CONTENT UPDATE', description: 'Aggiornamento contenuti' },
    { agent: 'SEO-Master', phase: 'SEO OPTIMIZATION', description: 'Ottimizzazione SEO' },
    { agent: 'Test-Engineer', phase: 'CONTENT TESTING', description: 'Test contenuti' },
    { agent: 'DevOps-Pro', phase: 'CONTENT DEPLOY', description: 'Deploy contenuti' }
  ],
  
  performance: [
    { agent: 'Performance-Guru', phase: 'PERFORMANCE AUDIT', description: 'Analisi performance' },
    { agent: 'Test-Engineer', phase: 'PERFORMANCE TESTING', description: 'Test performance' },
    { agent: 'DevOps-Pro', phase: 'PERFORMANCE DEPLOY', description: 'Deploy ottimizzazioni' }
  ]
};

const qualityGates = {
  'Security-Auditor': ['No critical vulnerabilities', 'Security headers OK', 'Rate limiting active'],
  'Test-Engineer': ['All tests passing', 'Coverage > 80%', 'No failing E2E tests'],
  'Content-Manager': ['Content validated', 'No broken links', 'SEO meta complete'],
  'SEO-Master': ['Sitemap updated', 'Schema markup valid', 'Keywords optimized'],
  'Performance-Guru': ['Lighthouse > 90', 'Core Web Vitals green', 'Assets optimized'],
  'DevOps-Pro': ['Build successful', 'Deploy completed', 'Health checks passing'],
  'EspertoVercel': ['Vercel deploy OK', 'Domain active', 'Functions working']
};

function getWorkflowInstructions(workflowType = 'standard') {
  const workflow = workflows[workflowType];
  if (!workflow) {
    throw new Error(`Workflow '${workflowType}' non trovato. Disponibili: ${Object.keys(workflows).join(', ')}`);
  }
  
  return {
    workflow,
    qualityGates,
    instructions: `
🎯 **WORKFLOW: ${workflowType.toUpperCase()}**

📋 **FASI DA ESEGUIRE:**
${workflow.map((step, i) => {
  if (step.agents) {
    return `${i + 1}. **${step.phase}** (${step.parallel ? 'PARALLELO' : 'SEQUENZIALE'})
   Agenti: ${step.agents.join(', ')}
   ${step.description}`;
  } else {
    return `${i + 1}. **${step.phase}**
   Agente: ${step.agent}
   ${step.description}`;
  }
}).join('\n\n')}

🔍 **QUALITY GATES:**
Ogni agente deve soddisfare i propri quality gates prima di procedere.

⚠️ **REGOLE ORCHESTRAZIONE:**
- Esegui le fasi nell'ordine specificato
- Verifica quality gates prima di procedere
- In caso di fallimento, ferma il workflow e riporta errori
- Usa context7 per decision making avanzato
- Crea TODO list per tracking progress
`
  };
}

module.exports = { workflows, qualityGates, getWorkflowInstructions };

if (require.main === module) {
  const workflowType = process.argv[2] || 'standard';
  console.log(getWorkflowInstructions(workflowType).instructions);
}

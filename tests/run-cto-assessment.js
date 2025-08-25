#!/usr/bin/env node
/**
 * Execute CTO Technical Assessment for IT-ERA Chatbot
 * This script simulates Ing. Roberto Ferrari testing the chatbot
 */

const fs = require('fs');
const path = require('path');

// Import the test class
const CTOTechnicalTest = require('./cto-technical-test.js');

/**
 * Main execution function
 */
async function runAssessment() {
  console.log("Initializing IT-ERA Chatbot Technical Assessment...\n");
  
  // Create test instance
  const ctoTest = new CTOTechnicalTest();
  
  try {
    // Run complete assessment
    const report = await ctoTest.runCompleteAssessment();
    
    // Save report to file
    const reportPath = path.join(__dirname, 'cto-assessment-report.json');
    const reportSummaryPath = path.join(__dirname, 'cto-assessment-summary.md');
    
    // Save detailed JSON report
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nDetailed report saved to: ${reportPath}`);
    
    // Generate and save markdown summary
    const markdownSummary = generateMarkdownSummary(report);
    fs.writeFileSync(reportSummaryPath, markdownSummary);
    console.log(`Summary report saved to: ${reportSummaryPath}`);
    
    // Print immediate feedback
    printImmediateFeedback(report);
    
  } catch (error) {
    console.error("Assessment execution failed:", error);
    process.exit(1);
  }
}

/**
 * Generate markdown summary report
 */
function generateMarkdownSummary(report) {
  const timestamp = new Date().toLocaleString('it-IT');
  
  let markdown = `# IT-ERA Chatbot - Valutazione Tecnica CTO

## Informazioni Valutazione
- **Valutatore**: ${report.testProfile.name}
- **Azienda**: ${report.testProfile.company}
- **Data**: ${timestamp}
- **Scenario**: Migrazione Kubernetes per ${report.testProfile.employees} dipendenti
- **Budget**: ${report.testProfile.budget}

## Risultati Globali

| Metrica | Valore |
|---------|--------|
| **Punteggio Totale** | ${report.overallAssessment.score.toFixed(1)}/100 |
| **Voto** | ${report.overallAssessment.grade} |
| **Approvazione CTO** | ${report.technicalVerdict.ctoApproval ? '✅ SÌ' : '❌ NO'} |
| **Pronto per Enterprise** | ${report.technicalVerdict.readyForEnterprise ? '✅ SÌ' : '❌ NO'} |

## Verdetto Tecnico

> ${report.technicalVerdict.verdict}

## Dettaglio per Fase

`;

  // Add phase details
  report.phases.forEach(phase => {
    markdown += `### ${phase.phase}\n`;
    markdown += `**Punteggio Fase**: ${phase.overallScore.toFixed(1)}/100\n\n`;
    
    phase.results.forEach(result => {
      const status = result.analysis ? 
        (result.analysis.totalScore >= 70 ? '✅' : result.analysis.totalScore >= 50 ? '⚠️' : '❌') : 
        '❓';
      
      markdown += `- ${status} **${result.id}** (${result.difficulty})`;
      if (result.analysis) {
        markdown += ` - ${result.analysis.totalScore.toFixed(1)}/100`;
      }
      markdown += `\n`;
      
      // Add feedback if available
      if (result.analysis && result.analysis.feedback.length > 0) {
        result.analysis.feedback.forEach(feedback => {
          markdown += `  - ${feedback}\n`;
        });
      }
    });
    markdown += `\n`;
  });

  // Add recommendations
  if (report.recommendations && report.recommendations.length > 0) {
    markdown += `## Raccomandazioni\n\n`;
    report.recommendations.forEach(rec => {
      const priority = rec.priority === 'HIGH' ? '🔴' : rec.priority === 'MEDIUM' ? '🟡' : '🟢';
      markdown += `### ${priority} ${rec.area}\n`;
      markdown += `${rec.recommendation}\n\n`;
    });
  }

  // Add technical analysis
  markdown += `## Analisi Tecnica Dettagliata\n\n`;
  markdown += `Il chatbot è stato testato su scenari enterprise realistici che un CTO potrebbe presentare:\n\n`;
  markdown += `- **Kubernetes e Container Orchestration**\n`;
  markdown += `- **Cloud Architecture e Hybrid Solutions**\n`;
  markdown += `- **Security e Compliance (GDPR, PCI-DSS)**\n`;
  markdown += `- **DevOps e CI/CD Practices**\n`;
  markdown += `- **Monitoring e Observability**\n`;
  markdown += `- **Disaster Recovery e Business Continuity**\n`;
  markdown += `- **Performance Optimization**\n`;
  markdown += `- **Cost Analysis e ROI**\n\n`;

  markdown += `## Conclusioni\n\n`;
  if (report.overallAssessment.score >= 85) {
    markdown += `Il chatbot dimostra **eccellente competenza tecnica** e può gestire con sicurezza interazioni enterprise di alto livello.\n`;
  } else if (report.overallAssessment.score >= 70) {
    markdown += `Il chatbot ha **competenze tecniche adeguate** ma necessita miglioramenti per scenari enterprise complessi.\n`;
  } else {
    markdown += `Il chatbot **non soddisfa i requisiti** per supporto enterprise di alto livello e necessita significativi miglioramenti.\n`;
  }

  markdown += `\n---\n*Report generato automaticamente dal sistema di assessment tecnico IT-ERA*`;

  return markdown;
}

/**
 * Print immediate feedback to console
 */
function printImmediateFeedback(report) {
  console.log("\n" + "=".repeat(60));
  console.log("FEEDBACK IMMEDIATO - SIMULAZIONE CTO");
  console.log("=".repeat(60));
  
  const score = report.overallAssessment.score;
  
  console.log(`\nCome CTO di TechInnovate, la mia valutazione è:`);
  
  if (score >= 85) {
    console.log(`
✅ APPROVAZIONE COMPLETA
Il vostro chatbot dimostra competenza tecnica seria. 
I miei team possono interagire con fiducia per questioni enterprise.
Procederei con un pilot project da €10k per testare in ambiente reale.
`);
  } else if (score >= 70) {
    console.log(`
⚠️ APPROVAZIONE CONDIZIONATA  
Competenze di base presenti, ma serve miglioramento per scenari complessi.
Raccomando 30 giorni di training aggiuntivo prima del deployment.
Budget iniziale ridotto a €5k per test limitati.
`);
  } else if (score >= 50) {
    console.log(`
❌ NON APPROVATO
Competenza tecnica insufficiente per le nostre esigenze enterprise.
Il sistema non ispira fiducia per questioni mission-critical.
Consiglio di rivedere completamente la knowledge base tecnica.
`);
  } else {
    console.log(`
🚫 RESPINTO
Questo livello di competenza è inaccettabile per un'azienda tecnologica.
Non posso raccomandare questo strumento al management.
Necessaria riprogettazione completa prima di nuova valutazione.
`);
  }
  
  console.log(`\nPunteggio dettagliato:`);
  report.phases.forEach(phase => {
    const emoji = phase.overallScore >= 80 ? '🟢' : phase.overallScore >= 60 ? '🟡' : '🔴';
    console.log(`${emoji} ${phase.phase}: ${phase.overallScore.toFixed(1)}/100`);
  });
  
  if (report.recommendations && report.recommendations.length > 0) {
    console.log(`\nPriorità immediate:`);
    report.recommendations
      .filter(rec => rec.priority === 'HIGH')
      .forEach(rec => console.log(`🔴 ${rec.area}: ${rec.recommendation}`));
  }
  
  console.log("\n" + "=".repeat(60));
}

// Execute if run directly
if (require.main === module) {
  runAssessment().catch(console.error);
}

module.exports = { runAssessment, generateMarkdownSummary };
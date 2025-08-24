#!/usr/bin/env node

const PCRepairValidator = require('./pc-repair-validation');

async function main() {
  console.log('🚀 Starting comprehensive PC repair pages validation...\n');
  console.log('📋 Test Plan:');
  console.log('  • Check for removal of "gratuito" references');
  console.log('  • Validate placeholder replacements');
  console.log('  • Test chatbot functionality');
  console.log('  • Validate contact forms');
  console.log('  • Test mobile responsiveness');
  console.log('  • Measure Core Web Vitals');
  console.log('  • Check accessibility');
  console.log('  • Validate SEO elements');
  console.log('  • Generate visual validation report\n');

  const validator = new PCRepairValidator();
  
  try {
    const report = await validator.run();
    
    console.log('\n🎯 VALIDATION SUMMARY');
    console.log('====================================');
    console.log(`📊 Overall Score: ${report.summary.overallScore.toFixed(1)}%`);
    console.log(`✅ Passed Pages: ${report.summary.passedPages}/${report.metadata.pagesValidated}`);
    console.log(`❌ Failed Pages: ${report.summary.failedPages}/${report.metadata.pagesValidated}`);
    console.log(`⚠️  Total Issues: ${report.summary.totalIssues}`);
    console.log(`🚨 Critical Issues: ${report.summary.criticalIssues}`);
    
    if (report.recommendations.length > 0) {
      console.log('\n💡 TOP RECOMMENDATIONS:');
      report.recommendations.slice(0, 3).forEach(rec => {
        console.log(`   ${rec.priority}: ${rec.recommendation}`);
      });
    }
    
    console.log('\n📂 Report files generated in ./reports/');
    console.log('📷 Screenshots saved in ./screenshots/');
    
    // Exit with error code if critical issues found
    if (report.summary.criticalIssues > 0 || report.summary.overallScore < 70) {
      console.log('\n❌ Validation failed - issues require attention');
      process.exit(1);
    } else {
      console.log('\n✅ Validation passed - pages are production ready');
      process.exit(0);
    }
    
  } catch (error) {
    console.error('\n💥 Validation failed with error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

if (require.main === module) {
  main();
}

module.exports = main;
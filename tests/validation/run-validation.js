#!/usr/bin/env node

const LandingPageValidator = require('./landing-page-validator');

async function main() {
  const validator = new LandingPageValidator();
  
  try {
    console.log('🚀 Starting IT-ERA Landing Page Validation');
    console.log('Testing deployed pages at: https://13d750b1.it-era.pages.dev\n');
    
    const results = await validator.runValidation();
    
    // Save detailed results
    await validator.saveResults();
    
    console.log('✅ Validation completed successfully!');
    
    // Exit with appropriate code
    const successRate = results.filter(r => r.percentage >= 80).length / results.length;
    process.exit(successRate >= 0.8 ? 0 : 1);
    
  } catch (error) {
    console.error('❌ Validation failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = main;
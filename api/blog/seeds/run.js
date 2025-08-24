const database = require('../config/database');
const seedInitialData = require('./001_initial_data');

async function runSeeds() {
  try {
    console.log('🌱 Starting database seeding...');
    
    // Connect to database
    await database.connect();
    
    // Run seed functions
    await seedInitialData();
    
    console.log('✅ All seeds completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run seeds if called directly
if (require.main === module) {
  runSeeds();
}

module.exports = runSeeds;
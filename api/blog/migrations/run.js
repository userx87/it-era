const fs = require('fs');
const path = require('path');
const database = require('../config/database');

async function runMigrations() {
  try {
    console.log('🔄 Connecting to database...');
    await database.connect();
    
    console.log('📋 Running database migrations...');
    
    // Read and execute the initial schema
    const schemaPath = path.join(__dirname, '001_initial_schema.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    
    // Split by semicolon and execute each statement
    const statements = schemaSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);
    
    console.log(`📄 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement.trim()) {
        try {
          await database.run(statement);
          console.log(`✅ Statement ${i + 1}/${statements.length} completed`);
        } catch (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message);
          console.error('Statement:', statement);
          throw error;
        }
      }
    }
    
    console.log('✅ All migrations completed successfully!');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await database.close();
  }
}

// Run migrations if called directly
if (require.main === module) {
  runMigrations();
}

module.exports = runMigrations;
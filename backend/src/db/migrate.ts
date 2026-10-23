import fs from 'fs';
import path from 'path';
import { pool } from './index';

/**
 * Migration script: Reads schema.sql and runs it against the PostgreSQL database.
 * Run using: npm run migrate
 */
async function runMigration() {
  console.log('🔄 Running database migrations...');
  
  try {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    // Execute the schema statements
    await pool.query(sql);

    console.log('✅ Database migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Execute migration if this file is run directly
if (require.main === module) {
  runMigration();
}

export { runMigration };

import app from './app';
import { pool } from './db';
import dotenv from 'dotenv';

dotenv.config();

const PORT = process.env.PORT || 4000;

const server = app.listen(PORT, async () => {
  console.log(`===============================================`);
  console.log(`🚀 MiniLedger Backend Server is running!`);
  console.log(`📍 Port: http://localhost:${PORT}`);
  console.log(`🩺 Health: http://localhost:${PORT}/health`);
  console.log(`📁 Static files: http://localhost:${PORT}/uploads`);
  console.log(`===============================================`);

  // Verify database connection on startup
  try {
    const res = await pool.query('SELECT NOW()');
    console.log(`📦 Connected to PostgreSQL at: ${res.rows[0].now}`);
  } catch (err: any) {
    console.warn(`⚠️ Warning: PostgreSQL not reachable on startup (${err.message}).`);
    console.warn(`   Run 'docker compose up -d' or ensure PostgreSQL is running on port 5432.`);
  }
});

// Handle graceful shutdown
const shutdown = async () => {
  console.log('\n🛑 Shutting down server gracefully...');
  server.close(async () => {
    await pool.end();
    console.log('💤 PostgreSQL pool closed. Goodbye!');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

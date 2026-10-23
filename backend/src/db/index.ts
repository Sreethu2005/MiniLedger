import { Pool, QueryResult, QueryResultRow, types } from 'pg';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Prevent PostgreSQL DATE types (OID 1082) from being converted to JS Date objects
// with local timezone shifts. Keeps them as exact 'YYYY-MM-DD' strings.
types.setTypeParser(1082, (val: string) => val);

// Create a PostgreSQL connection pool.
// The pool manages multiple client connections automatically,
// improving performance by reusing connections across requests.
export const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgrespassword@localhost:5432/miniledger',
});

// Event listener for unexpected errors on idle pool clients
pool.on('error', (err: Error) => {
  console.error('Unexpected error on idle PostgreSQL client:', err);
});

/**
 * Execute a parameterized SQL query using the connection pool.
 * Parameterized queries ($1, $2, etc.) protect against SQL injection.
 * 
 * @param text The SQL query string
 * @param params Optional array of parameters
 */
export const query = async <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};

/**
 * Gracefully close all connections in the pool (useful for tests and shutdown).
 */
export const closePool = async (): Promise<void> => {
  await pool.end();
};

import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not set');
  process.exit(1);
}

const sql = postgres({ connection: { connectionString }, ssl: { rejectUnauthorized: false } });

(async () => {
  try {
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    console.log('Schema "drizzle" dropped successfully.');
  } catch (err) {
    console.error('Error dropping schema:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();

const fs = require('fs');
const path = require('path');
const postgres = require('postgres');

// Load .env.local manually
const envPath = path.join(__dirname, '.env.local');
let env = {};
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    if (!line || line.startsWith('#')) continue;
    const [key, ...rest] = line.split('=');
    env[key] = rest.join('=');
  }
}
const connectionString = env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL not found in .env.local');
  process.exit(1);
}

const sql = postgres(connectionString, { ssl: 'require' });

(async () => {
  try {
    await sql`DROP SCHEMA IF EXISTS drizzle CASCADE`;
    await sql`DROP SCHEMA IF EXISTS public CASCADE`;
    await sql`CREATE SCHEMA public`;
    console.log('✅ Drizzle and public schemas dropped/recreated successfully');
  } catch (err) {
    console.error('Error dropping schema:', err);
    process.exit(1);
  } finally {
    await sql.end();
  }
})();

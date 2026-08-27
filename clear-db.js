const { createClient } = require('@libsql/client');

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function clearAll() {
  const tables = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '__drizzle%'"
  );
  for (const row of tables.rows) {
    await client.execute(`DELETE FROM ${row.name}`);
    console.log(`Cleared ${row.name}`);
  }
}

clearAll();

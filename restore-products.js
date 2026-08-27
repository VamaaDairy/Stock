const { createClient } = require('@libsql/client');

const source = createClient({
  url: 'libsql://vamaa-dairy-recovery-darshankochar22.aws-ap-south-1.turso.io',
  authToken: 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3ODc4MjM1NjYsImlkIjoiMDFhMDQyOTMtZTkwMS03M2MyLWJjMjQtNjlhZmYwYjdhNTk3Iiwia2lkIjoic3VUcVFxMXA4S1JnT1NBMVM5T3cwQkxTVEVodGthNkE5OFJDdjhSNVRzbyIsInJpZCI6ImMwZjFmNGYzLWY5MDAtNGJmMi04ZDRkLThiZDMyYzkwMzUzOSJ9.2hIA7yMIG3DSVw2FImJ1-tZirtq-kx4gK5u9L5nF-Jk0boTbZ9tXHDBVBpuOPOnfHIfe3YoV0PYW8gk1sTCMDg',
});

const target = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

async function restore() {
  const { rows, columns } = await source.execute('SELECT * FROM products');
  console.log(`Found ${rows.length} products, columns: ${columns.join(', ')}`);

  for (const row of rows) {
    const placeholders = columns.map(() => '?').join(', ');
    const values = columns.map(c => row[c]);
    await target.execute({
      sql: `INSERT INTO products (${columns.join(', ')}) VALUES (${placeholders})`,
      args: values,
    });
  }
  console.log('Restore done.');
}

restore();

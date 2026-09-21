import pg from 'pg';

async function ensureDb(dbName) {
  const client = new pg.Client({ connectionString: 'postgresql://postgres:fairuz@127.0.0.1:5432/postgres' });
  try {
    await client.connect();
    const res = await client.query(`SELECT datname FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rows.length === 0) {
      console.log(`Creating database ${dbName}...`);
      await client.query(`CREATE DATABASE ${dbName}`);
      console.log(`Database ${dbName} created.`);
    } else {
      console.log(`Database ${dbName} already exists.`);
    }
  } catch (err) {
    console.log(`Error checking/creating ${dbName}:`, err.message);
  } finally {
    await client.end();
  }
}

async function main() {
  await ensureDb('finspire_dev');
  await ensureDb('finspire_test');
}

main();

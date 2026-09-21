import pg from 'pg';

const passwords = ['postgres', 'fairuz', 'password', 'admin', 'root', '123456', ''];

async function testPassword(pwd) {
  const url = `postgresql://postgres:${pwd}@127.0.0.1:5432/postgres`;
  const client = new pg.Client({ connectionString: url });
  try {
    await client.connect();
    console.log(`[SUCCESS] Password is: '${pwd}'`);
    await client.end();
    return true;
  } catch (err) {
    return false;
  }
}

async function main() {
  for (const pwd of passwords) {
    if (await testPassword(pwd)) {
      process.exit(0);
    }
  }
  console.log('[FAILED] None of the common passwords worked.');
}

main();

import pg from 'pg';
const pool = new pg.Pool({ connectionString: process.env.TEST_DATABASE_URL });
pool.query("UPDATE content_releases SET manifest_sha256 = '5b0ee4389a86cbe2b2352f5d16754fc38146dc17641bc5aeedbaa5670cb42362' WHERE status = 'active'").then(() => pool.end());

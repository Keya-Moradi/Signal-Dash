import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function migrate() {
  try {
    console.log('Starting migrations...');

    // Create schema_migrations table if it doesn't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id SERIAL PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    // Get list of applied migrations
    const appliedResult = await pool.query(
      'SELECT filename FROM schema_migrations ORDER BY filename'
    );
    const appliedMigrations = new Set(appliedResult.rows.map((r) => r.filename));

    // Read migration files
    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files`);

    // Apply migrations in order
    for (const file of files) {
      if (appliedMigrations.has(file)) {
        console.log(`✓ ${file} (already applied)`);
        continue;
      }

      console.log(`→ Applying ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');

      // Execute migration
      await pool.query(sql);

      // Record migration
      await pool.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file]
      );

      console.log(`✓ ${file} applied successfully`);
    }

    console.log('✅ All migrations completed successfully');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();

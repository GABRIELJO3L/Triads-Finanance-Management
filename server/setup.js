/**
 * setup.js — one-time setup script
 * Run: node setup.js
 * Creates all tables and sets the admin password.
 */
const pool = require('./db');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'triads@123';

async function setup() {
  console.log('\n🔧 Running Triads Finance setup...\n');
  const client = await pool.connect();
  try {
    // Run schema
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await client.query(schema);
    console.log('✅ Database schema created/verified');

    // Hash password and upsert admin user
    const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    await client.query(
      `INSERT INTO users (username, password_hash)
       VALUES ($1, $2)
       ON CONFLICT (username) DO UPDATE SET password_hash = $2`,
      [ADMIN_USERNAME, hash]
    );
    console.log(`✅ Admin user set: username="${ADMIN_USERNAME}", password="${ADMIN_PASSWORD}"`);
    console.log('\n🎉 Setup complete! You can now start the server with: npm run dev\n');
  } catch (err) {
    console.error('❌ Setup failed:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

setup();

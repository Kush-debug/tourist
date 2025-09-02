
const { Client } = require('pg');

async function seed() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL || "postgresql://tss_user:tss_pass@localhost:5432/travel_safe_shield",
    ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
  });

  await client.connect();

  // Sample users
  await client.query(`INSERT INTO users (username, password, role) VALUES 
    ('demo_user', 'password123', 'tourist'),
    ('demo_police', 'password123', 'police')
    ON CONFLICT DO NOTHING;`);

  // Sample alerts
  await client.query(`INSERT INTO alerts (user_id, message, status, latitude, longitude)
    VALUES (1, 'Help needed near Gateway of India!', 'active', 18.922, 72.834)
    ON CONFLICT DO NOTHING;`);

  console.log("Seed complete.");
  await client.end();
}

seed().catch(err => {
  console.error("Seed error", err);
  process.exit(1);
});

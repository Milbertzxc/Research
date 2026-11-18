const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: '127.0.0.1',
    port: 3306,
    user: 'root',
    password: '',
    database: 'mpdo_db'
  });

  const [users] = await conn.query("SELECT id, role, fullName, email, designation FROM users WHERE email LIKE '%@buenavista.gov.ph'");
  console.log('Seeded Buenavista users:');
  console.table(users);

  const [bry] = await conn.query("SELECT COUNT(*) as count FROM barangays WHERE id LIKE 'BV-%'");
  console.log('Seeded Buenavista barangays:', bry[0].count);

  const [settings] = await conn.query("SELECT * FROM settings WHERE `key` IN ('municipalityName', 'province', 'mapCenterLat', 'mapCenterLng')");
  console.log('Municipal Settings:');
  console.table(settings);

  await conn.end();
  process.exit(0);
})().catch(e => {
  console.error(e);
  process.exit(1);
});


const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host:               process.env.DB_HOST     || 'localhost',
  port:               Number(process.env.DB_PORT) || 3306,
  user:               process.env.DB_USER     || 'root',
  password:           process.env.DB_PASS     || '',
  database:           process.env.DB_NAME     || 'medtrust',
  waitForConnections: true,
  connectionLimit:    20,
  queueLimit:         0,
  charset:            'utf8mb4',
  timezone:           '+05:30',
});

pool.getConnection()
  .then(conn => {
    console.log('✅ MySQL connected');
    conn.release();
  })
  .catch(err => {
    if (err.code === 'ER_BAD_DB_ERROR') {
      console.error('❌ MySQL database not found:', process.env.DB_NAME || 'medtrust');
      console.error('Run schema import first:');
      console.error('  macOS/Linux/Git Bash: mysql -u root -p < backend/schema.sql');
      console.error('  Windows PowerShell:   Get-Content backend/schema.sql | mysql -u root -p');
    } else {
      console.error('❌ MySQL connection failed:', err.message);
    }
    process.exit(1);
  });

module.exports = pool;

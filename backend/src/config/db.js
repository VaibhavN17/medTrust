const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    require: true,
    rejectUnauthorized: false,
  },
  connectionTimeoutMillis: 15000,
  idleTimeoutMillis: 30000,
});

pool.connect()
  .then(() => {
    console.log("✅ Database connected");
  })
  .catch((err) => {
    console.error("❌ Database connection failed:", err.message);
  });

module.exports = pool;

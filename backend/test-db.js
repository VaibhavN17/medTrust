require("dotenv").config();

const { Client } = require("pg");

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

(async () => {
  try {
    await client.connect();
    console.log("✅ Connected");

    const res = await client.query("SELECT NOW()");
    console.log(res.rows);

    await client.end();
  } catch (err) {
    console.error("❌ ERROR:", err);
  }
})();

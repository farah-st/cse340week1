const { Pool } = require("pg");
require("dotenv").config();

/* ***************
 * Connection Pool
 * SSL Object needed for local testing of app
 * But will cause problems in production environment
 * If - else will make determination which to use
 * *************** */
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: true } : false,
});

const queryWithRetry = async (text, params, retries = 3) => {
  let attempt = 0;
  while (attempt < retries) {
    try {
      const res = await pool.query(text, params);
      if (process.env.NODE_ENV === "development") {
        console.log("Executed query:", text, "with params:", params);
      }
      return res;
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        console.error("Database Query Error:", {
          text,
          params,
          message: error.message,
          stack: error.stack,
        });
        throw new Error("Database query failed. Please check the logs for details.");
      }
      console.log(`Retrying query (${attempt}/${retries})`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // wait 1 second before retry
    }
  }
};

module.exports = {
  query: queryWithRetry,
  pool, // Ensures pool.connect() is available
};
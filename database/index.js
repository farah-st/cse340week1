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
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

module.exports = {
  query: async (text, params) => {
    try {
      const res = await pool.query(text, params);
      if (process.env.NODE_ENV === "development") {
        console.log("Executed query:", text, "with params:", params);
      }
      return res;
    } catch (error) {
      console.error("Database Query Error:", {
        text,
        params,
        message: error.message,
        stack: error.stack,
      });
      throw new Error("Database query failed. Please check the logs for details.");
    }
  },
  pool, // Ensures pool.connect() is available
};



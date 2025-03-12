const { Pool } = require("pg"); 
require("dotenv").config(); 

// Initialize PostgreSQL connection
const pool = new Pool({
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false, 
});

module.exports = { pool };

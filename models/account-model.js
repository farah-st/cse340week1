const pool = require("../database/");
// const bcrypt = require("bcryptjs"); // Remove if not used in this file

/* *****************************
 *   Register New Account
 * ***************************** */
async function registerAccount(firstname, lastname, email, password) {
  try {
    const sql = `
      INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type)
      VALUES ($1, $2, $3, $4, 'Client')
      RETURNING *;
    `;
    const result = await pool.query(sql, [firstname, lastname, email, password]);
    return result.rows[0]; // Return the inserted row
  } catch (error) {
    console.error("Database error in registerAccount:", error);
    throw error;
  }
}

/* **********************
 *   Check for Existing Email
 * ********************* */
async function checkExistingEmail(account_email) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1";
    const result = await pool.query(sql, [account_email]);
    return result.rowCount; // Returns number of matching rows
  } catch (error) {
    console.error("Error checking existing email:", error);
    throw new Error("Failed to check email existence.");
  }
}  

/* **********************
 *   Get Account by Email
 * ********************* */
async function getAccountByEmail(email) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1";
    const result = await pool.query(sql, [email]);
    return result.rows.length ? result.rows[0] : null; // Return account object if found, otherwise null
  } catch (error) {
    console.error("Error fetching account by email:", error);
    throw error;
  }
}

module.exports = { 
  registerAccount, 
  checkExistingEmail, 
  getAccountByEmail };

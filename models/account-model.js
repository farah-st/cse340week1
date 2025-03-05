const pool = require("../database/");
const bcrypt = require("bcryptjs");

/* *****************************
*   Register new account
* *************************** */
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
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email){
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1";
    const email = await pool.query(sql, [account_email]);
    return email.rowCount; // Return number of matching rows (email exists or not)
  } catch (error) {
    console.error("Error checking existing email:", error);
    throw new Error("Failed to check email existence.");
  }
}  

/* **********************
 *   Get account by email
 * ********************* */
async function getAccountByEmail(email) {
  try {
      const result = await pool.query("SELECT * FROM account WHERE account_email = $1", [email]);
      return result.rows.length ? result.rows[0] : null; // Return null if no user found
  } catch (error) {
      console.error("Error fetching account by email:", error);
      throw error;
  }
}

module.exports = {registerAccount, checkExistingEmail, getAccountByEmail};

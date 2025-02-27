const pool = require("../database/");

/* *****************************
*   Register new account
* *************************** */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
  try {
      const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *";
      const result = await pool.query(sql, [account_firstname, account_lastname, account_email, account_password]);
      return result;
  } catch (error) {
      console.error("Error registering account:", error);
      throw error; // Throw error instead of returning message
  }
}

/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email){
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1"
    const email = await pool.query(sql, [account_email])
    return email.rowCount
  } catch (error) {
    return error.message
  }
}  

/* **********************
 *   Get account
 * ********************* */
async function getAccountByEmail(email) {
  try {
      const result = await pool.query("SELECT * FROM account WHERE account_email = $1", [email]); // Ensure table name matches
      return result.rows.length ? result.rows[0] : null; // Return null if no user found
  } catch (error) {
      console.error("Error fetching account by email:", error);
      throw error;
  }
}


  module.exports = {registerAccount, checkExistingEmail, getAccountByEmail};
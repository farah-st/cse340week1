const pool = require("../database/");

/* *****************************
 *   Register New Account
 * *******************************/
async function registerAccount(firstname, lastname, email, password) {
  try {
    const sql = `
      INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type)
      VALUES ($1, $2, $3, $4, 'Client')
      RETURNING *;
    `;
    const result = await pool.query(sql, [firstname, lastname, email, password]);
    return result.rows[0]; 
  } catch (error) {
    console.error("Database error in registerAccount:", error);
    throw error;
  }
}

/* **********************
 *   Check for Existing Email
 * **********************/
async function checkExistingEmail(account_email) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1";
    const result = await pool.query(sql, [account_email]);
    return result.rowCount; 
  } catch (error) {
    console.error("Error checking existing email:", error);
    throw new Error("Failed to check email existence.");
  }
}  

/* **********************
 *   Get Account by Email
 * ***********************/
async function getAccountByEmail(email) {
  try {
    const sql = "SELECT * FROM account WHERE account_email = $1";
    const result = await pool.query(sql, [email]);
    return result.rows.length ? result.rows[0] : null; 
  } catch (error) {
    console.error("Error fetching account by email:", error);
    throw error;
  }
}

/* **********************
 *   Get Account by ID (New Function)
 * ***********************/
async function getAccountById(account_id) {
  try {
    const sql = "SELECT * FROM account WHERE account_id = $1";
    const result = await pool.query(sql, [account_id]);
    return result.rows.length ? result.rows[0] : null; 
  } catch (error) {
    console.error("Error fetching account by ID:", error);
    throw error;
  }
}

/* *****************************
 *  Update Account Info by ID
 * *****************************/
async function updateAccount(account_id, firstname, lastname, email) {
  try {
    const sql = `
      UPDATE account
      SET account_firstname = $1,
          account_lastname = $2,
          account_email = $3
      WHERE account_id = $4
      RETURNING *;
    `;
    const result = await pool.query(sql, [firstname, lastname, email, account_id]);
    return result.rows.length > 0; // true if updated
  } catch (error) {
    console.error("Error updating account info:", error);
    throw error;
  }
}

/* *****************************
 *  Update Account Password
 * *****************************/
async function updatePassword(account_id, hashedPassword) {
  try {
    const sql = `
      UPDATE account
      SET account_password = $1
      WHERE account_id = $2
      RETURNING *;
    `;
    const result = await pool.query(sql, [hashedPassword, account_id]);
    return result.rows.length > 0; // true if updated
  } catch (error) {
    console.error("Error updating password:", error);
    throw error;
  }
}

/* *****************************
 *  update User Role
 * *****************************/
async function updateUserRole(account_id, newRole) {
  try {
    const sql = "UPDATE account SET account_type = $1 WHERE account_id = $2 RETURNING *;";
    const result = await pool.query(sql, [newRole, account_id]);
    return result.rows.length > 0; // true if update succeeded
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

/* *****************************
 *  Get All Accounts
 * *****************************/
async function getAllAccounts() {
  try {
    const result = await pool.query(
      "SELECT account_id, account_firstname, account_lastname, account_email, account_type FROM account ORDER BY account_lastname"
    );
    return result.rows;
  } catch (error) {
    throw new Error("Database error retrieving accounts: " + error.message);
  }
}

module.exports = { 
  registerAccount, 
  checkExistingEmail, 
  getAccountByEmail, 
  getAccountById,
  updateAccount,
  updatePassword,
  updateUserRole,
  getAllAccounts
};
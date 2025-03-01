const pool = require("../database/");

/* **********************
 *   Get account by email
 * ********************* */
async function getAccountByEmail(email) {
    const query = 'SELECT * FROM account WHERE account_email = $1';
    const result = await pool.query(query, [email]);
    console.log("Query result:", result.rows); // Log the result
    return result.rows[0]; // Return the first matching account
}

/* **********************
 *   Register new account
 * ********************* */
async function registerAccount(account_firstname, account_lastname, account_email, account_password) {
    try {
        // Check if email already exists
        const emailExists = await checkExistingEmail(account_email);
        if (emailExists > 0) {
            throw new Error("Email already exists. Please use a different email.");
        }

        // Hash the password before inserting
        const hashedPassword = await bcrypt.hash(account_password, 10);

        // Insert new account
        const sql = "INSERT INTO account (account_firstname, account_lastname, account_email, account_password, account_type) VALUES ($1, $2, $3, $4, 'Client') RETURNING *";
        const result = await pool.query(sql, [account_firstname, account_lastname, account_email, hashedPassword]);
        return result;
    } catch (error) {
        console.error("Error registering account:", error);
        throw error;
    }
}

/* **********************
 *   Check for existing email
 * ********************* */
async function checkExistingEmail(account_email) {
    try {
        const sql = "SELECT * FROM account WHERE account_email = $1";
        const email = await pool.query(sql, [account_email]);
        return email.rowCount;
    } catch (error) {
        console.error("Error checking existing email:", error);
        throw error; // Throw the error instead of returning the message
    }
}

module.exports = { registerAccount, checkExistingEmail, getAccountByEmail };
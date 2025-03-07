const { pool } = require("../database/index");

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  try {
    const sql = `
      SELECT classification_id, classification_name 
      FROM public.classification 
      ORDER BY classification_name
    `;
    const result = await pool.query(sql);
    return result.rows;
  } catch (error) {
    console.error("Error fetching classifications:", error);
    throw new Error("Error fetching classifications.");
  }
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const sql = `
      SELECT i.*, c.classification_name
      FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1
    `;
    const result = await pool.query(sql, [classification_id]);
    return result.rows;
  } catch (error) {
    console.error("Error fetching inventory by classification ID:", error);
    throw new Error("Error fetching inventory by classification ID.");
  }
}

/* ***************************
 *  Get vehicle details by inv_id
 * ************************** */
async function getVehicleById(invId) {
  try {
    const sql = "SELECT * FROM public.inventory WHERE inv_id = $1";
    const result = await pool.query(sql, [invId]);
    return result.rows.length > 0 ? result.rows[0] : null;
  } catch (error) {
    console.error("Database error fetching vehicle details:", error);
    throw new Error("Error fetching vehicle details.");
  }
}

/* ***************************
 *  Insert New Classification into Database
 * ************************** */
async function addClassification(classification_name) {
  const client = await pool.connect();
  try {
    // Check if classification already exists
    const checkSql = "SELECT * FROM public.classification WHERE classification_name = $1";
    const checkResult = await client.query(checkSql, [classification_name]);
    if (checkResult.rows.length > 0) {
      throw new Error("Classification already exists.");
    }

    // Insert new classification
    const sql = `
      INSERT INTO public.classification (classification_name) 
      VALUES ($1) 
      RETURNING *;
    `;
    const result = await client.query(sql, [classification_name]);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting classification:", error);
    throw new Error("Error inserting classification.");
  } finally {
    client.release();
  }
}

/* ***************************
 *  Insert New Inventory Item into Database
 * ************************** */
async function addInventoryItem(vehicle) {
  try {
    const sql = `
      INSERT INTO public.inventory 
        (inv_make, inv_model, inv_year, inv_description, inv_price, inv_miles, inv_color, classification_id, inv_image, inv_thumbnail)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING inv_id;
    `;

    const params = [
      vehicle.inv_make,
      vehicle.inv_model,
      vehicle.inv_year,
      vehicle.inv_description,
      vehicle.inv_price,
      vehicle.inv_miles,
      vehicle.inv_color,
      vehicle.classification_id,
      vehicle.inv_image || "default-image.jpg",
      vehicle.inv_thumbnail || "default-thumbnail.jpg"
    ];

    if (process.env.NODE_ENV === "development") {
      console.log("Executing SQL:", sql);
      console.log("With Parameters:", params);
    }

    const result = await pool.query(sql, params);

    // Return only the inv_id from the inserted row
    return result.rows[0].inv_id;
  } catch (error) {
    console.error("Database Insert Error:", error);
    throw new Error("Error inserting inventory item. Please check logs for details.");
  }
}

/* *****************************
* Return account data using email address
* ***************************** */
async function getAccountByEmail (account_email) {
  try {
    const result = await pool.query(
      'SELECT account_id, account_firstname, account_lastname, account_email, account_type, account_password FROM account WHERE account_email = $1',
      [account_email])
    return result.rows[0]
  } catch (error) {
    return new Error("No matching email found")
  }
}

/* ***************************
 *  Export all functions
 * ************************** */
module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  addClassification,
  addInventoryItem,
  getAccountByEmail
};
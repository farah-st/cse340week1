const pool = require("../database/");

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  try {
    const result = await pool.query("SELECT classification_id, classification_name FROM public.classification ORDER BY classification_name");
    return result.rows;
  } catch (error) {
    console.error("Error fetching classifications:", error);
    throw error;
  }
}

/* ***************************
 *  Get all inventory items and 
 *  classification_name by classification_id
 * ************************** */
async function getInventoryByClassificationId(classification_id) {
  try {
    const result = await pool.query(
      `SELECT * FROM public.inventory AS i 
      JOIN public.classification AS c 
      ON i.classification_id = c.classification_id 
      WHERE i.classification_id = $1`,
      [classification_id]
    );
    return result.rows;
  } catch (error) {
    console.error("Error fetching inventory by classification ID:", error);
    throw error;
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
    console.error("Database error:", error);
    throw error;
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
    const sql = `INSERT INTO public.classification (classification_name) VALUES ($1) RETURNING *`;
    const result = await client.query(sql, [classification_name]);
    return result.rows[0];
  } catch (error) {
    console.error("Error inserting classification:", error);
    throw error;
  } finally {
    client.release();
  }
}

/* ***************************
 *  Insert New Inventory Item into Database
 * ************************** */
async function addInventoryItem(data) {
  const client = await pool.connect();
  try {
    const sql = `
      INSERT INTO public.inventory (inv_make, inv_model, inv_year, inv_description, 
                                    inv_image, inv_thumbnail, inv_price, inv_miles, 
                                    inv_color, classification_id) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *;
    `;
    const values = [
      data.inv_make,
      data.inv_model,
      data.inv_year,
      data.inv_description,
      data.inv_image,
      data.inv_thumbnail,
      data.inv_price,
      data.inv_miles,
      data.inv_color,
      data.classification_id
    ];
    const result = await client.query(sql, values);
    return result.rows[0];
  } catch (error) {
    console.error("Error adding inventory:", error);
    throw error;
  } finally {
    client.release();
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
  addInventoryItem
};





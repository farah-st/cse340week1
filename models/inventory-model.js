const pool = require("../database/");

/* ***************************
 *  Get all classification data
 * ************************** */
async function getClassifications() {
  try {
    const result = await pool.query("SELECT * FROM public.classification ORDER BY classification_name");
    return result.rows;
  } catch (error) {
    console.error("Error fetching classifications:", error);
    throw error;
  }
}

/* ***************************
 *  Get all inventory items and classification_name by classification_id
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
    throw error; // Ensure the error propagates properly
  }
}

/* ***************************
 *  Get vehicle details by inv_id
 * ************************** */
async function getVehicleById(invId) {
  try {
    const sql = "SELECT * FROM public.inventory WHERE inv_id = $1";
    const result = await pool.query(sql, [invId]);
    if (result.rows.length === 0) {
        return null;
    }
    return result.rows[0];
} catch (error) {
    console.error("Database error:", error);
    throw error;
}
}

// Export functions **after** declaration
module.exports = { getClassifications, getInventoryByClassificationId, getVehicleById };




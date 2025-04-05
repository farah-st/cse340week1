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

    console.log(`Fetched inventory for classification_id=${classification_id}:`, result.rows); // Debugging

    if (result.rows.length === 0) {
      return []; // Return an empty array if no items are found
    }

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
 *  Get vehicle details by inv_id
 * ************************** */
async function getInventoryById(invId) {
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
 *  Get inventory by type
 * ************************** */
async function getInventoryByType(typeId) {
  // Validate and sanitize typeId
  if (!typeId || isNaN(typeId)) {
      console.error(`Invalid typeId provided: ${typeId}`);
      return null;
  }

  try {
      const query = "SELECT * FROM inventory WHERE classification_id = $1";
      const values = [parseInt(typeId, 10)];

      const result = await pool.query(query, values);
      console.log(`Fetched inventory for type ${typeId}:`, result.rows);
      return result.rows;
  } catch (error) {
      console.error("Database query error:", error);
      return null;
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
 *  update Inventory Item
 * ************************** */
async function updateInventoryItem(item) {
  try {
      // Ensure `inv_thumbnail` is never null
      let inv_thumbnail = item.inv_thumbnail || item.inv_image; 

      const sql = `
          UPDATE inventory 
          SET inv_make = $1, inv_model = $2, inv_year = $3, inv_description = $4, 
              inv_image = $5, inv_thumbnail = $6, inv_price = $7, inv_miles = $8, 
              inv_color = $9, classification_id = $10
          WHERE inv_id = $11
          RETURNING *;
      `;
      const values = [
          item.inv_make, item.inv_model, item.inv_year, item.inv_description,
          item.inv_image, inv_thumbnail, item.inv_price, item.inv_miles,
          item.inv_color, item.classification_id, item.inv_id
      ];

      const result = await pool.query(sql, values);
      return result.rowCount > 0;
  } catch (error) {
      console.error("Error updating inventory item:", error);
      throw new Error("Database update failed.");
  }
}

/* ***************************
 *  Delete Inventory Item
 * ***************************/
async function deleteInventoryItem(inv_id) {
  try {
    const sql = 'DELETE FROM inventory WHERE inv_id = $1';
    const result = await pool.query(sql, [inv_id]);
    return result.rowCount; 
  } catch (error) {
    console.error("Delete Inventory Error:", error);
    throw new Error("Error deleting inventory item.");
  }
}

/* ***************************
 *  Delete Classification By Id
 * ***************************/
async function deleteClassification(classification_id) {
  try {
    const sql = "DELETE FROM classification WHERE classification_id = $1";
    const data = await pool.query(sql, [classification_id]);
    return data.rowCount;
  } catch (error) {
    throw new Error("Database error deleting classification: " + error.message);
  }
}

/* ***************************
 *  Export all functions
 * ************************** */
module.exports = {
  getClassifications,
  getInventoryByClassificationId,
  getVehicleById,
  getInventoryById,
  getInventoryByType,
  addClassification,
  addInventoryItem,
  getAccountByEmail,
  updateInventoryItem,
  deleteInventoryItem,
  deleteClassification
};
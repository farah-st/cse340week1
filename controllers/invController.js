const invModel = require("../models/inventory-model");
const utilities = require("../utilities/index");

const invCont = {};

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = utilities.handleErrors(async function (req, res) {
  const classification_id = req.params.classificationId;
  const data = await invModel.getInventoryByClassificationId(classification_id);

  if (!data || data.length === 0) {
    return res.status(404).render("errors/error", { message: "No vehicles found for this classification." });
  }

  const grid = await utilities.buildClassificationGrid(data);
  let nav = await utilities.getNav();
  const className = data[0].classification_name;

  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  });
});

/* ***************************
 *  Build vehicle detail view
 * ************************** */
invCont.buildDetailView = utilities.handleErrors(async function (req, res) {
  const invId = req.params.inv_id;
  console.log(`Looking for vehicle with ID: ${invId}`);

  const vehicle = await invModel.getVehicleById(invId);
  if (!vehicle) {
    return res.status(404).render("errors/error", { title: "Vehicle Not Found", message: "Vehicle not found" });
  }

  console.log("Vehicle found:", vehicle);

  const nav = await utilities.getNav();
  const vehicleHTML = utilities.buildVehicleDetailHTML(vehicle);

  res.render("./inventory/detail", {
    title: `${vehicle.inv_make} ${vehicle.inv_model}`,
    vehicleHTML,
    nav,
  });
});

/* ***************************
 *  Render Inventory Management View
 * ************************** */
invCont.renderManagement = utilities.handleErrors(async function (req, res) {
  let nav = await utilities.getNav();
  const message = req.flash("info"); // Get flash message for info

  res.render('inventory/management', {
    title: "Inventory Management",
    nav,
    message, // Pass the message to the view
  });
});

/* ***************************
 *  Render Add Classification View
 * ************************** */
invCont.renderAddClassification = async function (req, res) {
  let nav = await utilities.getNav();
  const message = req.flash("info"); // Get flash message for info

  res.render("inventory/add-classification", {
    title: "Add Classification",
    nav,
    message,
    errors: [],
  });
};

/* ***************************
 *  Handle Adding a Classification
 * ************************** */
invCont.addClassification = async function (req, res) {
  let nav = await utilities.getNav();
  const { classification_name } = req.body;

  try {
    // Insert into database
    const insertResult = await invModel.addClassification(classification_name);

    if (insertResult) {
      // Regenerate navigation
      nav = await utilities.getNav();

      // Success message and redirect to management view
      req.flash("info", "Classification added successfully!");
      return res.redirect("/inv/");
    } else {
      throw new Error("Classification insertion failed.");
    }
  } catch (error) {
    req.flash("error", error.message);
    res.render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      message: req.flash("error"),
      errors: [error.message],
    });
  }
};

/* ***************************
 *  Render Add Inventory View
 * ************************** */
invCont.renderAddInventory = async function (req, res) {
  try {
    let classificationList = await utilities.buildClassificationList();
    let nav = await utilities.getNav();

    res.render("./inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList,  // Pass the classification list to the view
      message: null,
    });
  } catch (error) {
    console.error("Error rendering add-inventory:", error);
    req.flash("error", "An error occurred while loading classifications.");
    res.status(500).render("./inventory/add-inventory", {
      title: "Add New Vehicle",
      nav: await utilities.getNav(),
      classificationList: [],  // Provide an empty list if there's an issue
      message: req.flash("error"),
    });
  }
};

/* ***************************
 *  Handle Adding New Inventory
 * ************************** */
invCont.addNewInventoryItem = async function (req, res) {
  try {
    const {
      inv_make,
      inv_model,
      inv_year,
      inv_price,
      classification_id,
      inv_description,
      inv_image,
      inv_thumbnail,
      inv_miles,
      inv_color,
    } = req.body;

    let nav = await utilities.getNav();
    const classificationList = await utilities.buildClassificationList(); // Build classification list

    // Validate required fields
    if (!inv_make || !inv_model || !inv_year || !inv_price || !classification_id) {
      req.flash("error", "All fields are required.");
      return res.status(400).render("./inventory/add-inventory", {
        title: "Add New Vehicle",
        nav,
        classificationList,  // Ensure classificationList is passed back
        message: req.flash("error"),
        inv_make,
        inv_model,
        inv_year,
        inv_price,
        classification_id,
        inv_description,
        inv_miles,
        inv_color
      });
    }

    // Insert into database
    const insertResult = await invModel.addInventoryItem({
      inv_make,
      inv_model,
      inv_year,
      inv_price,
      classification_id,
      inv_description,
      inv_image,     // If image uploading logic exists, make sure inv_image is handled
      inv_thumbnail, // Same for thumbnail
      inv_miles,
      inv_color,
    });

    // Handle database insert result
    if (insertResult && insertResult.rowCount && insertResult.rowCount > 0) {
      req.flash("info", "Vehicle added successfully!");
      return res.redirect("/inv/");
    } else {
      throw new Error("Failed to add the vehicle.");
    }
  } catch (error) {
    console.error("Error adding new inventory:", error);
    req.flash("error", "Internal server error.");
    const classificationList = await utilities.buildClassificationList(); // Rebuild the classification list
    res.status(500).render("./inventory/add-inventory", {
      title: "Add New Vehicle",
      nav: await utilities.getNav(),
      classificationList, // Make sure it's available on error as well
      message: req.flash("error"),
    });
  }
};

module.exports = invCont;

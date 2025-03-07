const invModel = require("../models/inventory-model");
const utilities = require("../utilities/index");
const multer = require("multer");

// Initialize controller object
const invCont = {};

/* ***************************
 *  Build inventory by classification view
 * *************************** */
invCont.buildByClassificationId = utilities.handleErrors(async (req, res) => {
  const classification_id = req.params.classificationId;
  const data = await invModel.getInventoryByClassificationId(classification_id);

  if (!data || data.length === 0) {
    return res.status(404).render("errors/error", { message: "No vehicles found for this classification." });
  }

  const grid = await utilities.buildClassificationGrid(data);
  const nav = await utilities.getNav();
  const className = data[0].classification_name;

  res.render("inventory/classification", {
    title: `${className} vehicles`,
    nav,
    grid,
  });
});

/* ***************************
 *  Build vehicle detail view
 * *************************** */
invCont.buildDetailView = utilities.handleErrors(async (req, res) => {
  const invId = req.params.inv_id;
  console.log(`Looking for vehicle with ID: ${invId}`);

  const vehicle = await invModel.getVehicleById(invId);
  if (!vehicle) {
    return res.status(404).render("errors/error", { title: "Vehicle Not Found", message: "Vehicle not found" });
  }

  console.log("Vehicle found:", vehicle);
  const nav = await utilities.getNav();
  const vehicleHTML = utilities.buildVehicleDetailHTML(vehicle);

  res.render("inventory/detail", {
    title: `${vehicle.inv_make} ${vehicle.inv_model}`,
    nav,
    vehicleHTML,
  });
});

/* ***************************
 *  Render Inventory Management View
 * *************************** */
invCont.renderManagement = utilities.handleErrors(async (req, res) => {
  const nav = await utilities.getNav();
  const message = req.flash("info");
  res.render("inventory/management", { 
    title: "Inventory Management", 
    nav, 
    message 
  });
});

/* ***************************
 *  Render Add Classification View
 * *************************** */
invCont.renderAddClassification = utilities.handleErrors(async (req, res) => {
  const nav = await utilities.getNav();
  const message = req.flash("info");
  // You can pass sticky data if needed; here we default to an empty classification name.
  res.render("inventory/add-classification", {
    title: "Add Classification",
    nav,
    message,
    errors: [],
    classification_name: req.body.classification_name || ""
  });
});

/* ***************************
 *  Handle Adding a Classification
 * *************************** */
invCont.addClassification = utilities.handleErrors(async (req, res) => {
  let nav = await utilities.getNav();
  const { classification_name } = req.body;

  try {
    const insertResult = await invModel.addClassification(classification_name);

    if (insertResult) {
      // Regenerate navigation if classifications have changed.
      nav = await utilities.getNav();
      req.flash("info", "Classification added successfully!");
      return res.redirect("/inv/");
    } else {
      throw new Error("Classification insertion failed.");
    }
  } catch (error) {
    req.flash("error", error.message);
    return res.render("inventory/add-classification", {
      title: "Add Classification",
      nav,
      message: req.flash("error"),
      errors: [error.message],
      classification_name
    });
  }
});

/* ***************************
 *  Render Add Inventory View
 * *************************** */
invCont.renderAddInventory = utilities.handleErrors(async (req, res) => {
  const classificationList = await utilities.buildClassificationList();
  const nav = await utilities.getNav();
  res.render("inventory/add-inventory", {
    title: "Add New Vehicle",
    nav,
    classificationList,
    message: null,
    // Sticky defaults (empty strings) for vehicle fields:
    inv_make: "",
    inv_model: "",
    inv_year: "",
    inv_description: "",
    inv_price: "",
    inv_miles: "",
    inv_color: ""
  });
});

/* ***************************
 *  Handle Adding New Inventory
 * *************************** */
// Set storage engine for multer to save files to 'public/images/vehicles' directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "public/images/vehicles");
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const upload = multer({ storage }).single("inv_image");

invCont.addNewInventoryItem = utilities.handleErrors(async (req, res) => {
  console.log("Inside the route handler for adding new inventory");

  // Use multer upload to handle file upload first
  upload(req, res, async (err) => {
    if (err) {
      console.error("Multer error:", err);
      req.flash("error", "File upload failed.");
      return res.redirect("/inv/add-inventory");
    }

    const {
      inv_make,
      inv_model,
      inv_year,
      inv_price,
      classification_id,
      inv_description,
      inv_miles,
      inv_color
    } = req.body;

    console.log("Vehicle data received:", req.body);

    const imagePath = req.file ? `/images/vehicles/${req.file.filename}` : "default-image.jpg";

    const parsedClassificationId = parseInt(classification_id, 10);
    if (isNaN(parsedClassificationId)) {
      req.flash("error", "Invalid classification ID.");
      return res.redirect("/inv/add-inventory");
    }

    const formattedYear = String(inv_year);

    try {
      const insertResult = await invModel.addInventoryItem({
        inv_make,
        inv_model,
        inv_year: formattedYear,
        inv_description,
        inv_price: Math.round(inv_price),
        classification_id: parsedClassificationId,
        inv_image: imagePath,
        inv_miles: parseInt(inv_miles, 10),
        inv_color
      });

      if (insertResult) {
        req.flash("info", "Vehicle added successfully!");
        return res.redirect("/inv/");
      } else {
        throw new Error("Failed to add the vehicle.");
      }
    } catch (error) {
      console.error("Error inserting inventory item:", error);
      req.flash("error", error.message);
      const nav = await utilities.getNav();
      const classificationList = await utilities.buildClassificationList();
      return res.render("inventory/add-inventory", {
        title: "Add New Vehicle",
        nav,
        classificationList,
        errors: [error.message],
        inv_make,
        inv_model,
        inv_year,
        inv_description,
        inv_price,
        inv_miles,
        inv_color
      });
    }
  });
});

/* ***************************
 *  Optional: Trigger Error for Testing
 * *************************** */
invCont.triggerError = (req, res) => {
  throw new Error("Intentional error triggered!");
};

module.exports = invCont;

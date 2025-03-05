const invModel = require("../models/inventory-model");
const utilities = require("../utilities/index");
const multer = require("multer");

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
// Set storage engine for multer to save files to 'uploads' directory
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/images/vehicles'); // Define where to store the file
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname); // To avoid file name conflicts
  }
});

const upload = multer({ storage: storage }).single("inv_image");

// Route to handle image upload for the 'add new inventory' form
invCont.addNewInventoryItem = async function (req, res) {
  console.log("Inside the route handler");

  try {
    // Ensure the upload middleware runs first
    upload(req, res, async function (err) {
      if (err) {
        console.error("Multer error:", err);
        req.flash("error", "File upload failed.");
        return res.redirect("/inv/add-inventory");
      }

      // Extract form data
      const {
        inv_make,
        inv_model,
        inv_year,
        inv_price,
        classification_id,
        inv_description,
        inv_miles,
        inv_color,
      } = req.body;

      console.log("Vehicle data received:", req.body);

      let imagePath = req.file ? `/images/vehicles/${req.file.filename}` : "default-image.jpg";

      // Ensure classification_id is an integer
      const parsedClassificationId = parseInt(classification_id, 10);
      if (isNaN(parsedClassificationId)) {
        req.flash("error", "Invalid classification ID.");
        return res.redirect("/inv/add-inventory");
      }

      // Ensure year is stored as a string
      const formattedYear = String(inv_year);

      // Add inventory item to database
      const insertResult = await invModel.addInventoryItem({
        inv_make,
        inv_model,
        inv_year: formattedYear,
        inv_price: Math.round(inv_price), // Ensure it's an integer
        classification_id: parsedClassificationId,
        inv_description,
        inv_image: imagePath,
        inv_miles: parseInt(inv_miles, 10),
        inv_color,
      });

      if (insertResult) {
        req.flash("info", "Vehicle added successfully!");
        return res.redirect("/inv/");
      } else {
        throw new Error("Failed to add the vehicle.");
      }
    });
  } catch (error) {
    console.error("Error adding new inventory:", error);
    req.flash("error", "Internal server error.");
    res.status(500).render("./inventory/add-inventory", {
      title: "Add New Vehicle",
      nav: await utilities.getNav(),
      message: req.flash("error"),
    });
  }
};

module.exports = invCont;

const invModel = require("../models/inventory-model");
const utilities = require("../utilities/index");
const { getClassifications } = require("../utilities/index");
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

  const vehicle = await invModel.getVehicleById(invId);
  if (!vehicle) {
    return res.status(404).render("errors/error", { title: "Vehicle Not Found", message: "Vehicle not found" });
  }

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
  try {
    const nav = await utilities.getNav();
    const message = req.flash("info");

    // Fetch classification list from DB
    const classificationList = await utilities.buildClassificationList();
    console.log("Classification list fetched from DB:", classificationList); // Debugging

    if (!req.session.account) {
      req.flash("error", "Unauthorized access. Please log in.");
      return res.redirect("/account/login");
    }   

    // Ensure classification data is passed to the template
    res.render("inventory/management", { 
      title: "Inventory Management", 
      nav,  
      message,
      classificationSelect: classificationList,
      user: req.session.account, 
    });
    
  } catch (error) {
    console.error("Error rendering Inventory Management page:", error);
    res.status(500).render("errors/error", { message: "Error loading Inventory Management." });
  }
});


/* ***************************
 *  Get Inventory by Type (Newly Added)
 * ****************************/
invCont.getInventoryByType = utilities.handleErrors(async (req, res) => {
  const typeId = parseInt(req.params.typeId, 10); // Ensure typeId is an integer

  if (!typeId || isNaN(typeId)) {
      console.error(`Invalid typeId provided: ${req.params.typeId}`);
      return res.status(400).render("errors/error", { 
          title: "Invalid Request",
          message: "Invalid type ID provided. Please check your request.",
          nav: await utilities.getNav() // Ensure nav is passed to the error page
      });
  }

  try {
      const inventoryList = await invModel.getInventoryByType(typeId);

      if (!inventoryList || inventoryList.length === 0) {
          return res.status(404).render("errors/error", {
              title: "No Inventory Found",
              message: "Sorry, no inventory found for this type.",
              nav: await utilities.getNav()
          });
      }

      const nav = await utilities.getNav();

      let grid = "";
      inventoryList.forEach((vehicle) => {
          grid += `
              <div class="vehicle-card">
                  <img src="${vehicle.inv_thumbnail}" alt="${vehicle.inv_make} ${vehicle.inv_model}">
                  <h3><a href="/inventory/detail/${vehicle.inv_id}" class="vehicle-link">${vehicle.inv_make} ${vehicle.inv_model}</a></h3>
                  <p>${vehicle.inv_description}</p>
                  <p>Price: $${vehicle.inv_price}</p>
              </div>
          `;
      });

      res.render("inventory/classification", { 
          title: "Inventory by Type",
          nav,
          grid
      });

  } catch (error) {
      console.error("Error fetching inventory by type:", error);
      res.status(500).render("errors/error", { 
          title: "Server Error",
          message: "Error retrieving inventory data.",
          nav: await utilities.getNav()
      });
  }
});

/* ***************************
 *  Render Add Classification View
 * *************************** */
invCont.renderAddClassification = utilities.handleErrors(async (req, res) => {
  const nav = await utilities.getNav();
  const message = req.flash("info");

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
      nav = await utilities.getNav();
      req.flash("info", "Classification added successfully!");
      return res.redirect("/inventory/");
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
    message: req.flash("info") || "",
    error: req.flash("error") || "",
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
  upload(req, res, async (err) => {
    if (err) {
      req.flash("error", "File upload failed.");
      return res.redirect("/inventory/add-inventory");
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

    console.log("📛 classification_id from form:", classification_id);
    
    const imagePath = req.file ? `/images/vehicles/${req.file.filename}` : "/images/default-image.jpg";
    const parsedClassificationId = parseInt(classification_id, 10);
    const formattedYear = String(inv_year);

    if (isNaN(parsedClassificationId)) {
      req.flash("error", "Invalid classification ID.");
      return res.redirect("/inventory/add-inventory");
    }

    try {
      console.log("📦 Attempting to insert vehicle with:", {
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
        return res.redirect("/inventory/add-inventory");
      } else {
        throw new Error("Failed to add the vehicle.");
      }
    } catch (error) {
      req.flash("error", error.message);
      return res.redirect("/inventory/add-inventory");
    }
  });
});

/* ***************************
 *  Get Inventory by Classification
 * *************************** */
invCont.getInventoryByClassification = utilities.handleErrors(async (req, res) => {
  const classificationId = req.params.classificationId;

  try {
    const inventory = await invModel.getInventoryByClassificationId(classificationId);
    res.json(inventory);
  } catch (error) {
    res.status(500).json({ message: "Error loading inventory data." });
  }
});

/* ***************************
 *  Trigger Error for Testing
 * *************************** */
invCont.triggerError = (req, res) => {
  throw new Error("Intentional error triggered!");
};

/* ***************************
 *  Return Inventory by Classification As JSON
 * ************************** */
invCont.getInventoryJSON = async (req, res, next) => {
  try {
    const classification_id = parseInt(req.params.classification_id, 10);

    if (isNaN(classification_id)) {
      return res.status(400).json({ error: "Invalid classification ID" });
    }

    const invData = await invModel.getInventoryByClassificationId(classification_id);

    if (!invData || invData.length === 0) {
      return res.status(404).json({ error: "No inventory found for this classification" });
    }

    res.json(invData);
  } catch (error) {
    console.error("Error fetching inventory data:", error);
    res.status(500).json({ error: "Server error retrieving inventory" });
  }
};

/* ***************************
 *  Build edit inventory view
 * ************************** */
invCont.editInventoryView = async function (req, res, next) {
  const inv_id = parseInt(req.params.inv_id, 10);

  if (!req.params.inv_id || isNaN(inv_id)) {
      console.error(`Invalid inventory ID received: ${req.params.inv_id}`);
      return res.status(400).render("errors/error", { 
          title: "Invalid Request",
          message: "Invalid inventory ID provided. Please check your request."
      });
  }

  let nav = await utilities.getNav();
  const itemData = await invModel.getInventoryById(inv_id);

  if (!itemData) {
      console.error(`Error: No inventory item found for ID ${inv_id}`);
      return res.status(404).render("errors/error", { 
          title: "Not Found",
          message: "Inventory item not found."
      });
  }

  const classifications = await getClassifications();

  let classificationSelect = `<select name="classification_id" id="classification_id">`;
  classifications.forEach(classification => {
      let selected = classification.classification_id === itemData.classification_id ? "selected" : "";
      classificationSelect += `<option value="${classification.classification_id}" ${selected}>${classification.classification_name}</option>`;
  });
  classificationSelect += `</select>`;

  const itemName = `${itemData.inv_make} ${itemData.inv_model}`;
  console.log("Classifications Data:", classifications);

  res.render("./inventory/edit", {
      title: "Edit " + itemName,
      nav,
      classificationSelect, 
      errors: [],
      inv_id: itemData.inv_id,
      inv_make: itemData.inv_make,
      inv_model: itemData.inv_model,
      inv_year: itemData.inv_year,
      inv_description: itemData.inv_description,
      inv_image: itemData.inv_image,
      inv_thumbnail: itemData.inv_thumbnail,
      inv_price: itemData.inv_price,
      inv_miles: itemData.inv_miles,
      inv_color: itemData.inv_color,
      classification_id: itemData.classification_id
  });
};
/* ***************************
 *  Render Update Inventory View
 * ************************** */
invCont.showUpdateForm = async function (req, res, next) {
  const inv_id = parseInt(req.params.id, 10);

  if (!inv_id || isNaN(inv_id)) {
      console.error(`Invalid inventory ID received: ${req.params.id}`);
      return res.status(400).render("errors/error", { 
          title: "Invalid Request",
          message: "Invalid inventory ID provided. Please check your request."
      });
  }

  let nav = await utilities.getNav();
  const itemData = await invModel.getInventoryById(inv_id);

  if (!itemData) {
      console.error(`Error: No inventory item found for ID ${inv_id}`);
      return res.status(404).render("errors/error", { 
          title: "Not Found",
          message: "Inventory item not found."
      });
  }

  const classifications = await getClassifications();

  let classificationSelect = `<select name="classification_id" id="classification_id">`;
  classifications.forEach(classification => {
      let selected = classification.classification_id === itemData.classification_id ? "selected" : "";
      classificationSelect += `<option value="${classification.classification_id}" ${selected}>${classification.classification_name}</option>`;
  });
  classificationSelect += `</select>`;

  const itemName = `${itemData.inv_make} ${itemData.inv_model}`;
  
  res.render("inventory/edit", {
      title: "Edit " + itemName,
      nav,
      classificationSelect,
      errors: [],
      inv_id: itemData.inv_id,
      inv_make: itemData.inv_make,
      inv_model: itemData.inv_model,
      inv_year: itemData.inv_year,
      inv_description: itemData.inv_description,
      inv_image: itemData.inv_image,
      inv_thumbnail: itemData.inv_thumbnail,
      inv_price: itemData.inv_price,
      inv_miles: itemData.inv_miles,
      inv_color: itemData.inv_color,
      classification_id: itemData.classification_id
  });
};

/* ***************************
*  Handle Inventory Update Submission
* ************************** */
invCont.processUpdate = async function (req, res, next) {
  upload(req, res, async (err) => {
      if (err) {
          req.flash("error", "File upload failed.");
          return res.redirect(`/inventory/update/${req.body.inv_id}`);
      }

      try {
          const {
              inv_id,
              inv_make,
              inv_model,
              inv_year,
              inv_description,
              inv_price,
              inv_miles,
              inv_color,
              classification_id,
              existing_image,
              existing_thumbnail
          } = req.body;

          // Validate classification_id
          const parsedClassificationId = parseInt(classification_id, 10);
          if (isNaN(parsedClassificationId)) {
              req.flash("error", `Invalid classification ID provided: ${classification_id}`);
              return res.redirect(`/inventory/update/${inv_id}`);
          }

          let imagePath = existing_image; // Default to existing image
          let thumbnailPath = existing_thumbnail; // Default to existing thumbnail

          if (req.file) {
              imagePath = `/images/vehicles/${req.file.filename}`;
              thumbnailPath = `/images/vehicles/${req.file.filename}`; // Ensure thumbnail is updated
          }

          const updateResult = await invModel.updateInventoryItem({
              inv_id,
              inv_make,
              inv_model,
              inv_year,
              inv_description,
              inv_price: Math.round(inv_price),
              inv_miles: parseInt(inv_miles, 10),
              inv_color,
              classification_id: parsedClassificationId, // Now correctly parsed as an integer
              inv_image: imagePath,
              inv_thumbnail: thumbnailPath // Ensure thumbnail is passed
          });

          if (updateResult) {
              req.flash("info", "Vehicle updated successfully!");
              return res.redirect("/inventory/");
          } else {
              throw new Error("Failed to update the vehicle.");
          }
      } catch (error) {
          req.flash("error", error.message);
          return res.redirect(`/inventory/update/${req.body.inv_id}`);
      }
  });
};

/* ***************************
 *  Deliver Delete Confirmation View
 * ************************** */
invCont.buildDeleteConfirmView = async function (req, res, next) {
  try {
      const inv_id = parseInt(req.params.inv_id, 10); // Ensure integer parsing
      if (Number.isNaN(inv_id)) {
          req.flash("error", "Invalid inventory ID.");
          return res.redirect("/inventory/");
      }

      const nav = await utilities.getNav(); // Build navigation for the view
      const itemData = await invModel.getInventoryById(inv_id); // Get inventory data

      if (!itemData) {
          console.warn(`Inventory item with ID ${inv_id} not found.`);
          req.flash("error", "Inventory item not found.");
          return res.redirect("/inventory/");
      }

      const name = `${itemData.inv_make} ${itemData.inv_model}`; // Build item name

      res.render("inventory/delete-confirm", {
          title: `Delete ${name}`,
          nav,
          errors: null,
          inv_id: itemData.inv_id,
          inv_make: itemData.inv_make,
          inv_model: itemData.inv_model,
          inv_year: itemData.inv_year,
          inv_price: itemData.inv_price,
      });
  } catch (error) {
      console.error("Error loading delete confirmation view:", error);
      next(error);
  }
};

/* ***************************
 *  Process Inventory Deletion
 * ***************************/
invCont.deleteInventoryItem = async function (req, res, next) {
  try {
      console.log("typeof invModel.deleteInventoryItem:", typeof invModel.deleteInventoryItem);

      const inv_id = parseInt(req.body.inv_id, 10);
      if (Number.isNaN(inv_id)) {
          req.flash("error", "Invalid inventory ID.");
          return res.redirect("/inventory/");
      }

      console.log("Checking invModel:", invModel);
      console.log("Attempting to delete inv_id:", inv_id);

      const deleteResult = await invModel.deleteInventoryItem(inv_id);

      if (deleteResult) {
          req.flash("success", "Vehicle successfully deleted.");
          return res.redirect("/inventory/");
      } else {
          console.warn(`Failed to delete vehicle with ID ${inv_id}`);
          req.flash("error", "Failed to delete the vehicle. Please try again.");
          return res.redirect(`/inventory/delete/${inv_id}`);
      }
  } catch (error) {
      console.error("Error processing delete:", error);
      next(error);
  }
};

/* ***************************
 *  Handle Classification Deletion
 * *************************** */
invCont.deleteClassification = utilities.handleErrors(async (req, res) => {
  const classification_id = parseInt(req.params.classification_id, 10);

  if (isNaN(classification_id)) {
    req.flash("error", "Invalid classification ID.");
    return res.redirect("/account/admin");
  }

  try {
    await invModel.deleteClassification(classification_id);
    req.flash("info", "Classification deleted successfully.");
    res.redirect("/account/admin");
  } catch (error) {
    console.error("Error deleting classification:", error);
    req.flash("error", "Error deleting classification.");
    res.redirect("/account/admin");
  }
});


module.exports = invCont;
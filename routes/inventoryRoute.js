// Needed Resources
const express = require("express");
const router = express.Router();
const invController = require("../controllers/invController");
const utilities = require("../utilities");

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route for displaying a specific vehicle's details
router.get("/detail/:inv_id", utilities.handleErrors(invController.buildDetailView));

// Intentional Error Route - Triggers a 500 Error (ensure this is disabled in production)
router.get("/trigger-error", utilities.handleErrors(invController.triggerError));

// Route to render the inventory management view
router.get("/", async (req, res) => {
  let nav = await utilities.getNav();  // Ensure nav is passed here
  const message = req.flash("info");
  console.log('Flash message:', message); // Log the message to see what it contains
  res.render("inventory/management", { title: "Inventory Management", nav, message });
});

// Route to render the Add Classification view
router.get("/add-classification", async (req, res) => {
  let nav = await utilities.getNav();  // Ensure nav is passed here
  const message = req.flash("info"); // Get flash message for info
  res.render("inventory/add-classification", { title: "Add Classification", nav, message, errors: [] });
});

// Route to process adding a classification
router.post("/add-classification", utilities.classificationValidation, invController.addClassification);

// Route to render Add Inventory Page
router.get('/add-inventory', invController.renderAddInventory);

// Route to handle adding a new inventory item (POST request)
router.post('/add-inventory', invController.addNewInventoryItem);

module.exports = router;

const express = require("express");
const router = express.Router();
const invController = require("../controllers/invController");
const utilities = require("../utilities");
const invValidate = require("../utilities/inventory-validation");

// Render Inventory Management view
router.get("/management", utilities.handleErrors(invController.renderManagement));

// Render the Add Classification view
router.get("/add-classification", utilities.handleErrors(invController.renderAddClassification));

// Process adding a new classification
router.post("/add-classification", utilities.handleErrors(invController.addClassification));

// Render the Add Inventory view
router.get("/add-inventory", utilities.handleErrors(invController.renderAddInventory));

// Process adding a new inventory item (with validation)
router.post(
  "/add-inventory",
  invValidate.addVehicleRules(),      // Validation rules middleware
  invValidate.checkVehicleData,         // Check validation and handle errors
  utilities.handleErrors(invController.addNewInventoryItem) // Controller function
);


// Other inventory routes
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));
router.get("/detail/:inv_id", utilities.handleErrors(invController.buildDetailView));

// Optional: trigger error route for testing
router.get("/trigger-error", utilities.handleErrors(invController.triggerError));

module.exports = router;


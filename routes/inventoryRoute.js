const express = require("express");
const router = express.Router();
const invController = require("../controllers/invController");
const utilities = require("../utilities");
const invValidate = require("../utilities/inventory-validation");

// Render Inventory Management view
router.get("/management", 
  utilities.handleErrors(invController.renderManagement)
);

// Render the Add Classification view
router.get("/add-classification", 
  utilities.handleErrors(invController.renderAddClassification)
);

// Process adding a new classification
router.post("/add-classification", 
  utilities.handleErrors(invController.addClassification)
);

// Render the Add Inventory view
router.get("/add-inventory", 
  utilities.handleErrors(invController.renderAddInventory)
);

// Process adding a new inventory item (with validation)
router.post(
  "/add-inventory",
  invValidate.addVehicleRules(),
  invValidate.checkVehicleData,
  utilities.handleErrors(invController.addNewInventoryItem)
);

// Get details of a specific inventory item
router.get("/detail/:inv_id", 
  utilities.handleErrors(invController.buildDetailView)
);

// Optional: trigger error route for testing
router.get("/trigger-error", 
  utilities.handleErrors(invController.triggerError)
);

// Default route to render Inventory Management view
router.get(
  "/",
  utilities.handleErrors(invController.renderManagement) 
);

// Get inventory by classification
router.get('/classification/:classificationId', 
  utilities.handleErrors(invController.getInventoryByClassification)
);

// Get inventory data in JSON format by classification ID
router.get("/getInventory/:classification_id", 
  utilities.handleErrors(invController.getInventoryJSON)
);

// Get inventory items by type
router.get("/type/:typeId", 
  utilities.handleErrors(invController.getInventoryByType)
);

// Render the Edit Inventory view
router.get(
  "/edit/:inv_id",
  utilities.handleErrors(invController.editInventoryView)
);

// Route to show the update form
router.get('/update/:id', 
  invController.showUpdateForm
);

// Route to process the update form submission
router.post('/update/:id', 
  invController.processUpdate
);

// Route to render the Delete Confirmation view
router.get("/delete/:inv_id", 
  utilities.handleErrors(invController.buildDeleteConfirmView)
);

// Route to process the Delete action
router.post("/delete/:inv_id", 
  utilities.handleErrors(invController.deleteInventoryItem)
);

module.exports = router;
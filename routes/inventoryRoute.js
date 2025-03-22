const express = require("express");
const router = express.Router();
const invController = require("../controllers/invController");
const utilities = require("../utilities");
const invValidate = require("../utilities/inventory-validation");
const authMiddleware = require("../middleware/authMiddleware");  // Import authMiddleware

//Protect Inventory Management view (Requires Employee or Admin)
router.get("/management", 
  authMiddleware,
  utilities.handleErrors(invController.renderManagement)
);

//Protect Add Classification view
router.get("/add-classification", 
  authMiddleware,
  utilities.handleErrors(invController.renderAddClassification)
);

// Protect Adding a new classification
router.post("/add-classification", 
  authMiddleware,
  utilities.handleErrors(invController.addClassification)
);

//Protect Add Inventory view
router.get("/add-inventory", 
  authMiddleware,
  utilities.handleErrors(invController.renderAddInventory)
);

//Protect Adding a new inventory item
router.post(
  "/add-inventory",
  authMiddleware,
  invValidate.addVehicleRules(),
  invValidate.checkVehicleData,
  utilities.handleErrors(invController.addNewInventoryItem)
);

//Protect Edit Inventory view
router.get(
  "/edit/:inv_id",
  authMiddleware,
  utilities.handleErrors(invController.editInventoryView)
);

//Protect Updating an inventory item
router.get(
  '/update/:id', 
  authMiddleware,
  invController.showUpdateForm
);

router.post(
  '/update/:id', 
  authMiddleware,
  invController.processUpdate
);

//Protect Delete Confirmation view
router.get(
  "/delete/:inv_id", 
  authMiddleware,
  utilities.handleErrors(invController.buildDeleteConfirmView)
);

//Protect Delete Inventory action
router.post(
  "/delete/:inv_id", 
  authMiddleware,
  utilities.handleErrors(invController.deleteInventoryItem)
);

// Public routes (No authentication needed)
router.get(
  "/detail/:inv_id", 
  utilities.handleErrors(invController.buildDetailView)
);

router.get(
  '/classification/:classificationId', 
  utilities.handleErrors(invController.getInventoryByClassification)
);

router.get(
  "/getInventory/:classification_id", 
  utilities.handleErrors(invController.getInventoryJSON)
);

router.get("/type/:typeId", 
  utilities.handleErrors(invController.getInventoryByType)
);

// Default route for Inventory Management (Protected)
router.get(
  "/",
  authMiddleware,
  utilities.handleErrors(invController.renderManagement) 
);

// Optional: Error testing route
router.get(
  "/trigger-error", 
  utilities.handleErrors(invController.triggerError)
);

router.get(
  "/management", 
  authMiddleware, utilities.handleErrors(invController.renderManagement)
);

module.exports = router;
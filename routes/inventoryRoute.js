// Needed Resources
const express = require("express");
const router = express.Router();
const invController = require("../controllers/invController");
const utilities = require("../utilities");

// Route to build inventory by classification view
router.get("/type/:classificationId", utilities.handleErrors(invController.buildByClassificationId));

// Route for displaying a specific vehicle's details
router.get("/detail/:inv_id", utilities.handleErrors(invController.buildDetailView));

// Intentional Error Route - Triggers a 500 Error
router.get("/trigger-error", utilities.handleErrors(invController.triggerError));

// Route to render the inventory management view
router.get("/", invController.renderManagement);

// Route to render the Add Classification view
router.get("/add-classification", invController.renderAddClassification);

// Route to process adding a classification
router.post("/add-classification", utilities.classificationValidation, invController.addClassification);

// Route to render add inventory page
router.get("/add-inventory", utilities.handleErrors(invController.renderAddInventory));
router.post("/add-inventory", utilities.handleErrors(invController.addNewInventory));

module.exports = router;





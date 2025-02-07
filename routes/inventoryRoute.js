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

module.exports = router;




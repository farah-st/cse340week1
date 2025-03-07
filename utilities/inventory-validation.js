// utilities/inventory-validation.js
const { body, validationResult } = require("express-validator");
const utilities = require("./index");

const invValidate = {};

// Validation rules for adding a new vehicle
invValidate.addVehicleRules = () => {
  return [
    body("inv_make").trim().notEmpty().withMessage("Make is required."),
    body("inv_model").trim().notEmpty().withMessage("Model is required."),
    body("inv_year")
      .trim()
      .notEmpty()
      .withMessage("Year is required.")
      .isNumeric()
      .withMessage("Year must be a number."),
    body("inv_description").trim().notEmpty().withMessage("Description is required."),
    body("inv_price")
      .trim()
      .notEmpty()
      .withMessage("Price is required.")
      .isNumeric()
      .withMessage("Price must be a number."),
    body("inv_miles")
      .trim()
      .notEmpty()
      .withMessage("Miles are required.")
      .isNumeric()
      .withMessage("Miles must be a number."),
    body("inv_color").trim().notEmpty().withMessage("Color is required.")
  ];
};

// Check validation results and re-render the form with sticky data if errors occur
invValidate.checkVehicleData = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    return res.render("inventory/add-inventory", {
      title: "Add New Vehicle",
      nav,
      classificationList: await utilities.buildClassificationList(),
      errors: errors.array().map(err => err.msg),
      inv_make: req.body.inv_make,
      inv_model: req.body.inv_model,
      inv_year: req.body.inv_year,
      inv_description: req.body.inv_description,
      inv_price: req.body.inv_price,
      inv_miles: req.body.inv_miles,
      inv_color: req.body.inv_color
    });
  }
  next();
};

module.exports = invValidate;

const utilities = require("./index");
const { body, validationResult } = require("express-validator");
const accountModel = require("../models/account-model");
const validate = {}; // Initialize validate object

/*  **********************************
  *  Registration Data Validation Rules
  * ********************************* */
validate.registrationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 1 })
      .withMessage("Please provide a first name."),

    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name."), 

    body("account_email")
      .trim()
      .escape()
      .notEmpty()
      .isEmail()
      .normalizeEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {  // Moved duplicate check here
          const emailExists = await accountModel.checkExistingEmail(account_email);
          if (emailExists > 0) {
              throw new Error("Email already exists. Please log in or use a different email.");
          }
      }),

    body("account_password")
      .trim()
      .notEmpty()
      .isStrongPassword({
        minLength: 12,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })
      .withMessage("Password does not meet requirements."),
  ];
};

/* ******************************
 * Check data and return errors or continue to registration
 * ***************************** */
validate.checkRegData = async (req, res, next) => {
    const { account_firstname, account_lastname, account_email } = req.body;
    let errors = validationResult(req);

    if (!errors.isEmpty()) {
        let nav = await utilities.getNav();
        
        // Use req.flash() to add error messages
        req.flash("error", errors.array().map(error => error.msg).join(", "));
        
        return res.render("account/register", {
            title: "Registration",
            nav,
            account_firstname,
            account_lastname,
            account_email,
            message: req.flash("error"), // Display error messages
        });
    }
    next();
};

module.exports = validate;
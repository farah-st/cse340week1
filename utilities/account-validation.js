const utilities = require("./index");
const { body, validationResult } = require("express-validator");
const accountModel = require("../models/account-model");
const validate = {}; // Initialize validate object

/* **********************************
 * Registration Data Validation Rules
 ***********************************/
validate.registrationRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Please provide a first name."),

    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .isLength({ min: 2 })
      .withMessage("Please provide a last name (at least 2 characters)."),

    body("account_email")
      .trim()
      .normalizeEmail()
      .notEmpty()
      .isEmail()
      .withMessage("A valid email is required.")
      .custom(async (account_email) => {
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
      .withMessage(
        "Password must be at least 12 characters long, including one uppercase, one lowercase, one number, and one symbol."
      ),
  ];
};

/* ******************************
 * Check Registration Data
 ******************************/
validate.checkRegData = async (req, res, next) => {
  const { account_firstname, account_lastname, account_email } = req.body;
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    req.flash("error", errors.array().map((error) => error.msg).join(", "));

    return res.render("account/register", {
      title: "Registration",
      nav,
      account_firstname,
      account_lastname,
      account_email,
      message: req.flash("error"),
    });
  }
  next();
};

/* **********************************
 * Login Data Validation Rules
 ***********************************/
validate.loginRules = () => {
  return [
    body("account_email")
      .trim()
      .normalizeEmail()
      .notEmpty()
      .isEmail()
      .withMessage("Please provide a valid email address."),

    body("account_password")
      .trim()
      .notEmpty()
      .withMessage("Password is required."),
  ];
};

/* ******************************
 * Check Login Data
 ******************************/
validate.checkLoginData = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    req.flash("error", errors.array().map((error) => error.msg).join(", "));

    return res.render("account/login", {
      title: "Login",
      nav,
      account_email: req.body.account_email,
      message: req.flash("error"),
    });
  }
  next();
};

/* ******************************
 * Account Validation Rules
 ********************************/
validate.accountUpdateRules = () => {
  return [
    body("account_firstname")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("First name is required."),

    body("account_lastname")
      .trim()
      .escape()
      .notEmpty()
      .withMessage("Last name is required."),

    body("account_email")
      .trim()
      .normalizeEmail()
      .notEmpty()
      .isEmail()
      .withMessage("Valid email is required.")
      .custom(async (account_email, { req }) => {
        const accountId = req.body.account_id;
        const existingAccount = await accountModel.getAccountById(accountId);

        if (
          existingAccount &&
          existingAccount.account_email !== account_email
        ) {
          const emailExists = await accountModel.checkExistingEmail(account_email);
          if (emailExists) {
            throw new Error("Email already in use.");
          }
        }
      }),
  ];
};

/* ******************************
 * Check Account Update Data
 ********************************/
validate.checkAccountUpdateData = async (req, res, next) => {
  const errors = validationResult(req);
  const { account_firstname, account_lastname, account_email, account_id } = req.body;

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    return res.render("account/update", {
      title: "Edit Account",
      nav,
      account: {
        account_id,
        account_firstname,
        account_lastname,
        account_email,
      },
      errors: errors.array(),
      messages: {
        error: errors.array().map((e) => e.msg).join(", ")
      }
    });    
    }
  next();
};

/* ******************************
 *  Rules for Updating Password
 ********************************/
validate.passwordUpdateRules = () => {
  return [
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
      .withMessage(
        "Password must be at least 12 characters long, and include one uppercase letter, one lowercase letter, one number, and one special character."
      ),
  ];
};

/* ******************************
 *  Check Password Update Data
 ********************************/
validate.checkPasswordUpdateData = async (req, res, next) => {
  const errors = validationResult(req);
  const { account_id } = req.body;

  if (!errors.isEmpty()) {
    const nav = await utilities.getNav();
    const accountData = await accountModel.getAccountById(account_id);
    
    return res.render("account/update", {
      title: "Edit Account",
      nav,
      errors: errors.array(),
      account_id,
      account_firstname: accountData.account_firstname,
      account_lastname: accountData.account_lastname,
      account_email: accountData.account_email,
    });
  }
  next();
};

module.exports = validate;
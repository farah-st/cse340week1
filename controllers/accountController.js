const jwt = require("jsonwebtoken");
require("dotenv").config();
const bcrypt = require("bcryptjs");
const utilities = require("../utilities");
const accountModel = require("../models/account-model");

// Helper function to prepare navigation and flash messages for rendering
async function getRenderOptions(req) {
  const nav = await utilities.getNav();
  const messages = {
    error: req.flash("error"),
    success: req.flash("success"),
    notice: req.flash("notice")
  };
  return { nav, messages };
}

// Simple email format validation using regex
function isValidEmail(email) {
  const re = /\S+@\S+\.\S+/;
  return re.test(email);
}

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
  try {
    const { nav, messages } = await getRenderOptions(req);
    console.debug("Flash messages at login render:", messages); // Debugging; remove in production
    res.render("account/login", {
      title: "Login",
      nav,
      messages
    });
  } catch (error) {
    console.error("Error rendering login page:", error);
    next(error);
  }
}

/* ****************************************
 *  Deliver registration view
 * *************************************** */
async function buildRegister(req, res, next) {
  try {
    const { nav, messages } = await getRenderOptions(req);
    res.render("account/register", {
      title: "Register",
      nav,
      first_name: "",
      last_name: "",
      email: "",
      errors: [],
      messages
    });
  } catch (error) {
    console.error("Error rendering registration page:", error);
    next(error);
  }
}

/* ****************************************
 *  Process Registration
 * *****************************************/
async function registerAccount(req, res) {
  const { nav } = await getRenderOptions(req);
  let { account_firstname, account_lastname, account_email, account_password } = req.body;

  // Sanitize inputs by trimming whitespace
  account_firstname = account_firstname.trim();
  account_lastname = account_lastname.trim();
  account_email = account_email.trim();
  account_password = account_password.trim();

  try {
    const errors = [];

    // Basic validations with enhanced checks
    if (!account_firstname) errors.push("First name is required.");
    if (!account_lastname) errors.push("Last name is required.");
    if (!account_email) {
      errors.push("Email is required.");
    } else if (!isValidEmail(account_email)) {
      errors.push("Please enter a valid email address.");
    }
    if (!account_password) {
      errors.push("Password is required.");
    } else if (account_password.length < 8) { // Enforcing minimum password length
      errors.push("Password must be at least 8 characters long.");
    }

    if (errors.length > 0) {
      console.log("Rendering register page with errors:", errors);
      return res.status(400).render("account/register", {
        title: "Register",
        nav,
        first_name: account_firstname,
        last_name: account_lastname,
        email: account_email,
        errors
      });
    }

    // Check if email already exists
    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists && emailExists.rows.length > 0) {
      req.flash("notice", "Email already exists. Please use a different email.");
      return res.status(400).render("account/register", {
        title: "Register",
        nav,
        first_name: account_firstname,
        last_name: account_lastname,
        email: account_email,
        errors: req.flash("notice") || []
      });
    }

    // Hash password using bcrypt
    const saltRounds = process.env.SALT_ROUNDS || 10;
    const hashedPassword = await bcrypt.hash(account_password, Number(saltRounds));

    // Register account in the database
    const regResult = await accountModel.registerAccount(
      account_firstname,
      account_lastname,
      account_email,
      hashedPassword
    );

    if (regResult) {
      req.flash("success", `Congratulations, ${account_firstname}! Please log in.`);
      return res.redirect("/account/login");
    } else {
      req.flash("notice", "Sorry, registration failed.");
      return res.status(500).render("account/register", {
        title: "Register",
        nav,
        first_name: account_firstname,
        last_name: account_lastname,
        email: account_email,
        errors: req.flash("notice") || []
      });
    }
  } catch (error) {
    console.error("Registration error:", error);
    req.flash("notice", "An error occurred during registration. Please try again.");
    return res.status(500).render("account/register", {
      title: "Register",
      nav,
      first_name: account_firstname,
      last_name: account_lastname,
      email: account_email,
      errors: req.flash("notice") || []
    });
  }
}

/* ****************************************
 *  Process login request
 * ************************************ */
async function accountLogin(req, res) {
  let nav = await utilities.getNav()
  const { account_email, account_password } = req.body
  const accountData = await accountModel.getAccountByEmail(account_email)
  if (!accountData) {
    req.flash("notice", "Please check your credentials and try again.")
    res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    })
    return
  }
  try {
    if (await bcrypt.compare(account_password, accountData.account_password)) {
      delete accountData.account_password
      const accessToken = jwt.sign(accountData, process.env.ACCESS_TOKEN_SECRET, { expiresIn: 3600 * 1000 })
      if(process.env.NODE_ENV === 'development') {
        res.cookie("jwt", accessToken, { httpOnly: true, maxAge: 3600 * 1000 })
      } else {
        res.cookie("jwt", accessToken, { httpOnly: true, secure: true, maxAge: 3600 * 1000 })
      }
      return res.redirect("/account/")
    }
    else {
      req.flash("message notice", "Please check your credentials and try again.")
      res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      })
    }
  } catch (error) {
    throw new Error('Access Forbidden')
  }
}

/* ****************************************
 *  Deliver Account Management View
 * *************************************** */
async function buildManagement(req, res, next) {
  try {
    const { nav, messages } = await getRenderOptions(req);
    res.render("account/management", {
      title: "Account Management",
      nav,
      messages
    });
  } catch (error) {
    console.error("Error rendering Account Management page:", error);
    next(error);
  }
}
  
module.exports = { buildLogin, 
  buildRegister, 
  registerAccount, 
  accountLogin,
  buildManagement };
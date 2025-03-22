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
    notice: req.flash("notice"),
  };
  return { nav, messages };
}

// Stronger email validation
function isValidEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
  try {
    const { nav, messages } = await getRenderOptions(req);
    console.debug("Flash messages at login render:", messages);
    res.render("account/login", {
      title: "Login",
      nav,
      messages,
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
      messages,
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

  account_firstname = account_firstname.trim();
  account_lastname = account_lastname.trim();
  account_email = account_email.trim();
  account_password = account_password.trim();

  try {
    const errors = [];

    if (!account_firstname) errors.push("First name is required.");
    if (!account_lastname) errors.push("Last name is required.");
    if (!account_email) {
      errors.push("Email is required.");
    } else if (!isValidEmail(account_email)) {
      errors.push("Please enter a valid email address.");
    }
    if (!account_password) {
      errors.push("Password is required.");
    } else if (account_password.length < 8) {
      errors.push("Password must be at least 8 characters long.");
    }

    if (errors.length > 0) {
      return res.status(400).render("account/register", {
        title: "Register",
        nav,
        first_name: account_firstname,
        last_name: account_lastname,
        email: account_email,
        errors,
      });
    }

    const emailExists = await accountModel.checkExistingEmail(account_email);
    if (emailExists && emailExists.rows.length > 0) {
      req.flash("notice", "Email already exists. Please use a different email.");
      return res.status(400).render("account/register", {
        title: "Register",
        nav,
        first_name: account_firstname,
        last_name: account_lastname,
        email: account_email,
        errors: req.flash("notice") || [],
      });
    }

    const saltRounds = parseInt(process.env.SALT_ROUNDS, 10) || 10;
    const hashedPassword = await bcrypt.hash(account_password, saltRounds);

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
        errors: req.flash("notice") || [],
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
      errors: req.flash("notice") || [],
    });
  }
}

/* ****************************************
 *  Process login request
 * **************************************/
async function accountLogin(req, res) {
  let nav = await utilities.getNav();
  const { account_email, account_password } = req.body;
  const accountData = await accountModel.getAccountByEmail(account_email);

  if (!accountData) {
    req.flash("notice", "Invalid email or password.");
    return res.status(400).render("account/login", {
      title: "Login",
      nav,
      errors: null,
      account_email,
    });
  }

  try {
    if (await bcrypt.compare(account_password, accountData.account_password)) {
      delete accountData.account_password;

      // Store user data in session with correct property names
      req.session.account = {
        id: accountData.account_id,
        first_name: accountData.account_firstname, 
        email: accountData.account_email,
        account_type: accountData.account_type,
      };    

      console.log("Session after login:", req.session); // Debugging output

      // Generate JWT Token
      const token = jwt.sign(
        {
          id: accountData.account_id, // ✅ Uses id to match session object
          email: accountData.account_email,
          account_type: accountData.account_type,
        },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      console.log("Generated JWT Token:", token); // Debugging output

      // Store JWT in cookie
      res.cookie("jwt", token, {
        httpOnly: true,
        secure: false, // Change to `true` in production with HTTPS
        sameSite: "Strict",
        maxAge: 60 * 60 * 1000,
      });

      // Show welcome message for all users
      req.flash("success", `Welcome back, ${accountData.account_firstname}!`);

      // ✅ Corrected redirect for non-admin users
      if (accountData.account_type === "Admin") {
        return res.redirect("/inventory/management");
      } else {
        return res.redirect("/account/"); // ✅ Redirect to account management
      }
    } else {
      req.flash("notice", "Invalid email or password.");
      return res.status(400).render("account/login", {
        title: "Login",
        nav,
        errors: null,
        account_email,
      });
    }
  } catch (error) {
    console.error("Login Error:", error);
    req.flash("error", "An unexpected error occurred. Please try again.");
    return res.redirect("/account/login");
  }
}

/* ****************************************
 *  Deliver Account Management View
 * *************************************** */
async function buildManagement(req, res, next) {
  try {
    const { nav, messages } = await getRenderOptions(req);
    const account = req.session.account;

    console.log("Session Data in Management Page:", account); // Debugging

    if (!account) {
      return res.redirect("/account/login"); // Redirect if not logged in
    }

    res.render("account/management", {
      title: "Account Management",
      nav,
      messages,
      account, // Ensure account data is passed to the view
    });
  } catch (error) {
    console.error("Error rendering Account Management page:", error);
    next(error);
  }
}

/* ****************************************
 *  Build Update
 * ****************************************/
async function buildUpdate(req, res, next) {
  try {
    const account_id = req.params.id;
    const account = await accountModel.getAccountById(account_id); // Fetch account details

    if (!account) {
      return res.status(404).send("Account not found.");
    }

    const { nav, messages } = await getRenderOptions(req);
    res.render("account/update", {
      title: "Update Account Information",
      nav,
      messages,
      account
    });
  } catch (error) {
    console.error("Error at /account/update/:id:", error);
    next(error);
  }
}

/* ****************************************
 *  Logout
 * ****************************************/
async function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout Error:", err);
      return res.status(500).send("Error logging out.");
    }
    res.clearCookie("jwt");
    res.redirect("/");
  });
}

/* ****************************************
 *  Update Account Information
 * ***************************************/
async function updateAccount(req, res) {
  const { account_id, account_firstname, account_lastname, account_email } = req.body;
  const { nav } = await getRenderOptions(req);

  try {
    const updateResult = await accountModel.updateAccount(
      account_id,
      account_firstname,
      account_lastname,
      account_email
    );

    if (updateResult) {
      // Refresh session info if email or name was updated
      req.session.account.first_name = account_firstname;
      req.session.account.email = account_email;

      req.flash("success", "Account information updated successfully.");
    } else {
      req.flash("error", "Update failed. Please try again.");
    }

    const updatedAccount = await accountModel.getAccountById(account_id);

    return res.render("account/management", {
      title: "Account Management",
      nav,
      account: updatedAccount,
      messages: {
        success: req.flash("success"),
        error: req.flash("error"),
      },
    });
  } catch (error) {
    console.error("Account update error:", error);
    req.flash("error", "Something went wrong while updating your account.");
    return res.redirect("/account");
  }
}

/* ****************************************
 *  Update Password
 * ***************************************/
async function updatePassword(req, res) {
  const { account_id, account_password } = req.body;
  const { nav } = await getRenderOptions(req);

  try {
    const hashedPassword = await bcrypt.hash(account_password, 10);
    const updateSuccess = await accountModel.updatePassword(account_id, hashedPassword);

    if (updateSuccess) {
      req.flash("success", "Password updated successfully.");
    } else {
      req.flash("error", "Failed to update password.");
    }

    const updatedAccount = await accountModel.getAccountById(account_id);

    return res.render("account/management", {
      title: "Account Management",
      nav,
      account: updatedAccount,
      messages: {
        success: req.flash("success"),
        error: req.flash("error"),
      },
    });
  } catch (error) {
    console.error("Password update error:", error);
    req.flash("error", "Error updating password.");
    const account = await accountModel.getAccountById(account_id);
    return res.render("account/update", {
      title: "Update Account",
      nav,
      account,
      messages: { error: req.flash("error") },
    });
  }
}

module.exports = {
  buildLogin,
  buildRegister,
  registerAccount,
  accountLogin,
  buildManagement,
  logout,
  buildUpdate,
  updateAccount,
  updatePassword,
};
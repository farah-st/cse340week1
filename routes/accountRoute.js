// Needed Resources
const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities");

// Login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Process registration
router.post("/register", async (req, res) => {
  const errors = []; // Initialize an array to hold errors

  // Perform validation checks
  if (!req.body.account_firstname) {
    errors.push("First name is required.");
  }
  if (!req.body.account_lastname) {
    errors.push("Last name is required.");
  }
  if (!req.body.account_email) {
    errors.push("Email is required.");
  }
  if (!req.body.account_password) {
    errors.push("Password is required.");
  }

  const nav = await utilities.getNav(); // Ensure nav is available

  // If there are errors, render the register view with errors
  if (errors.length > 0) {
    return res.render("account/register", {
      title: "Register",
      nav,
      errors, // ✅ Always pass errors as an array
    });
  }

  // Proceed with registration logic
  await accountController.registerAccount(req, res);
});

// Process login attempt
router.post("/login", utilities.handleErrors(accountController.loginAccount));

// Dashboard route
router.get("/dashboard", utilities.isLoggedIn, async (req, res) => {
  const nav = await utilities.getNav(); // Ensure nav is available
  res.render("account/dashboard", { title: "Dashboard", nav });
});

// Logout route
router.get("/logout", utilities.handleErrors(async (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).send("Error during logout");
    }
    res.redirect("/"); // Redirect to homepage after logging out
  });
}));

module.exports = router;
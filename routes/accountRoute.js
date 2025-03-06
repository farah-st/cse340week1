// Needed Resources
const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities");
const { body, validationResult } = require('express-validator');

// Login view
router.get("/login", utilities.handleErrors(async (req, res) => {
  console.log('Flash messages before rendering:', req.flash()); // Debugging line
  const nav = await utilities.getNav(); // Ensure nav is available
  res.render("account/login", { title: "Login", nav }); // Pass nav to the view
}));

// Registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Process registration with validation
router.post("/register", [
  body('account_firstname').notEmpty().withMessage('First name is required.'),
  body('account_lastname').notEmpty().withMessage('Last name is required.'),
  body('account_email').isEmail().withMessage('Valid email is required.'),
  body('account_password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long.')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    req.flash('error', errors.array().map(err => err.msg).join(' '));
    return res.redirect("/account/register");
  }

  // Proceed with registration logic
  await accountController.registerAccount(req, res);
});

// Process login attempt
router.post("/login", async (req, res) => {
  try {
    await accountController.loginAccount(req, res);
  } catch (error) {
    req.flash('error', 'Login failed. Please check your credentials.'); // Set flash message on error
    return res.redirect("/account/login"); // Redirect back to login page
  }
});

// Dashboard route
router.get("/dashboard", utilities.isLoggedIn, async (req, res) => {
  const nav = await utilities.getNav(); // Ensure nav is available
  res.render("account/dashboard", { title: "Dashboard", nav });
});

// Logout route
router.get("/logout", utilities.handleErrors(async (req, res) => {
  req.logout((err) => {
    if (err) {
      req.flash('error', 'Error during logout.'); // Set flash message on error
      return res.redirect("/account/dashboard"); // Redirect to dashboard on error
    }
    req.flash('success', 'Successfully logged out.'); // Set success message
    res.redirect("/"); // Redirect to homepage after logging out
  });
}));

module.exports = router;
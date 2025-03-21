// Needed Resources
const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities");
const regValidate = require("../utilities/account-validation"); // Ensure this path is correct
const { body, validationResult } = require("express-validator");

// Login view 
router.get(
  "/login",
  utilities.handleErrors(async (req, res) => {
    const nav = await utilities.getNav();
    res.render("account/login", { title: "Login", nav });
  })
);

// Registration view 
router.get("/register", 
  utilities.handleErrors(accountController.buildRegister)
);

// Registration route 
router.post(
  "/register",
  [
    body("account_firstname").notEmpty().withMessage("First name is required."),
    body("account_lastname").notEmpty().withMessage("Last name is required."),
    body("account_email").isEmail().withMessage("Valid email is required."),
    body("account_password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters long."),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      req.flash("error", errors.array().map((err) => err.msg).join(" "));
      return res.redirect("/account/register");
    }
    await accountController.registerAccount(req, res);
  }
);

// Login processing route
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

// Dashboard route 
router.get(
  "/dashboard",
  utilities.isLoggedIn,
  utilities.handleErrors(async (req, res) => {
    const nav = await utilities.getNav();
    res.render("account/dashboard", { title: "Dashboard", nav });
  })
);

// Logout route 
router.get("/logout", async (req, res) => {
  req.flash("success", "Successfully logged out."); 
  req.session.destroy((err) => {
    if (err) {
      console.error("Logout error:", err);
      return res.redirect("/account/");
    }
    res.clearCookie("sessionId");
    res.redirect("/");
  });
});

// Account Management view route 
router.get(
  "/", 
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildManagement) 
);

router.get("/update/:id", utilities.checkLogin, utilities.handleErrors(accountController.buildUpdate));

module.exports = router;
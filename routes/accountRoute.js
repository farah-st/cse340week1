/* ***************************
 *  Required Resources
 * ***************************/
const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities");
const regValidate = require("../utilities/account-validation");
const { body, validationResult } = require("express-validator");

/* ***************************
 *  Login View
 * ***************************/
router.get(
  "/login",
  utilities.handleErrors(async (req, res) => {
    const nav = await utilities.getNav();
    res.render("account/login", { title: "Login", nav });
  })
);

/* ***************************
 *  Registration View
 * ***************************/
router.get(
  "/register",
  utilities.handleErrors(accountController.buildRegister)
);

/* ***************************
 *  Handle New Account Registration
 * ***************************/
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

/* ***************************
 *  Handle Login Processing
 * ***************************/
router.post(
  "/login",
  regValidate.loginRules(),
  regValidate.checkLoginData,
  utilities.handleErrors(accountController.accountLogin)
);

/* ***************************
 *  Dashboard View
 * ***************************/
router.get(
  "/dashboard",
  utilities.isLoggedIn,
  utilities.handleErrors(async (req, res) => {
    const nav = await utilities.getNav();
    res.render("account/dashboard", { title: "Dashboard", nav });
  })
);

/* ***************************
 *  Handle Logout
 * ***************************/
router.get(
  "/logout",
  utilities.handleErrors(accountController.logout)
);

/* ***************************
 *  Account Management View
 * ***************************/
router.get(
  "/",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildManagement)
);

/* ***************************
 *  Account Update View (by ID)
 * ***************************/
router.get(
  "/update/:id",
  utilities.checkLogin,
  utilities.handleErrors(accountController.buildUpdate)
);

/* ***************************
 *  Handle Account Information Update
 * ***************************/
router.post(
  "/update",
  regValidate.accountUpdateRules(),
  regValidate.checkAccountUpdateData,
  utilities.checkLogin,
  utilities.handleErrors(accountController.updateAccount)
);

/* ***************************
 *  Handle Password Update
 * ***************************/
router.post(
  "/update-password",
  regValidate.passwordUpdateRules(),
  regValidate.checkPasswordUpdateData,
  utilities.checkLogin,
  utilities.handleErrors(accountController.updatePassword)
);

/* ***************************
 *  Admin Dashboard View
 * ***************************/
router.get(
  "/admin",
  utilities.checkLogin,
  utilities.checkAdmin,
  accountController.adminDashboard
);

/* ***************************
 *  User Role Update View (Admin Only)
 * ***************************/
router.get(
  "/roles",
  utilities.verifyAdmin,
  utilities.handleErrors(accountController.updateUserRoleView)
);


/* ***************************
 *  Handle Role Update Submission (Admin Only)
 * ***************************/
router.post(
  "/roles/update",
  utilities.verifyAdmin,
  utilities.handleErrors(accountController.updateUserRoleHandler)
);

module.exports = router;
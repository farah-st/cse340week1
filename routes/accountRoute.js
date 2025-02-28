// Needed Resources
const express = require("express");
const router = express.Router();
const accountController = require("../controllers/accountController");
const utilities = require("../utilities");
const regValidate = require("../utilities/account-validation");

// Login view
router.get("/login", utilities.handleErrors(accountController.buildLogin));

// Registration view
router.get("/register", utilities.handleErrors(accountController.buildRegister));

// Process registration
router.post(
    "/register",
    regValidate.registationRules(),
    regValidate.checkRegData,
    utilities.handleErrors(accountController.registerAccount)
);

// Process login attempt
router.post("/login", utilities.handleErrors(accountController.loginAccount));

router.get("/dashboard", utilities.isLoggedIn, (req, res) => {
  res.render("account/dashboard", { title: "Dashboard", nav });
});

module.exports = router;





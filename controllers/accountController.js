// Needed Resources
const bcrypt = require("bcryptjs")
const utilities = require("../utilities");
const accountModel = require("../models/account-model");

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
    try {
        let nav = await utilities.getNav();
        let message = req.flash("error") || req.flash("success"); 

        res.render("account/login", {
            title: "Login",
            nav,
            message,  
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
    let nav = await utilities.getNav()
    res.render("account/register", {
        title: "Register",
        nav,
        first_name: "", 
        last_name: "",
        email: "",
        errors: null,
    })
}

/* ****************************************
*  Process Registration
* *****************************************/
async function registerAccount(req, res) {
    let nav = await utilities.getNav(); // Generate navigation links

    console.log("Received form data:", req.body); // Debugging: Log form data

    const { account_firstname, account_lastname, account_email, account_password } = req.body;
    let hashedPassword;
    try {
    // Regular password and cost (salt is generated automatically)
    hashedPassword = await bcrypt.hashSync(account_password, 10);
    } catch (error) {
    req.flash("notice", "Sorry, there was an error processing the registration.");
    return res.status(500).render("account/register", {
        title: "Registration",
        nav,
        errors: null,
    });
    }
    // Check if any field is missing
    if (!account_firstname || !account_lastname || !account_email || !account_password) {
        console.error("Missing required fields:", { account_firstname, account_lastname, account_email, account_password });
        req.flash("notice", "All fields are required.");
        return res.status(400).render("account/register", { title: "Registration", nav });
    }

  try {
        const regResult = await accountModel.registerAccount(
            account_firstname,
            account_lastname,
            account_email,
            account_password,
            hashedPassword 
        );

      if (regResult.rowCount) {
          req.flash(
              "notice",
              `Congratulations, you're registered ${account_firstname}. Please log in.`
          );
          res.status(201).render("account/login", {
              title: "Login",
              nav,
          });
      } else {
          req.flash("notice", "Sorry, the registration failed.");
          res.status(501).render("account/register", {
              title: "Registration",
              nav,
          });
      }
  } catch (error) {
        console.error("Registration error:", error);
        req.flash("notice", "An error occurred during registration. Please try again.");
        res.status(500).render("account/register", {
        title: "Registration",
        nav,
    });
  }
}


  
module.exports = { buildLogin, buildRegister, registerAccount }


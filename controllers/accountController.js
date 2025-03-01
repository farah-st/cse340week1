const bcrypt = require("bcryptjs")
const utilities = require("../utilities");
const accountModel = require("../models/account-model");

/* ****************************************
 *  Deliver login view
 * *************************************** */
async function buildLogin(req, res, next) {
    try {
        let nav = await utilities.getNav();
        let messages = [...req.flash("error"), ...req.flash("success"), ...req.flash("notice")];

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
    let nav = await utilities.getNav();
    const { account_firstname, account_lastname, account_email, account_password } = req.body;
    
    try {
        // Check if email already exists
        const emailExists = await accountModel.checkExistingEmail(account_email);
        if (emailExists > 0) {
            req.flash("notice", "Email already exists. Please use a different email.");
            return res.status(400).render("account/register", {
                title: "Registration",
                nav,
                messages: req.flash()
            });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(account_password, 10);

        // Register account
        const regResult = await accountModel.registerAccount(
            account_firstname,
            account_lastname,
            account_email,
            hashedPassword
        );

        if (regResult.rowCount) {
            req.flash("success", `Congratulations, ${account_firstname}! Please log in.`);
            return res.status(201).render("account/login", {
                title: "Login",
                nav,
                messages: req.flash()
            });
        } else {
            req.flash("notice", "Sorry, registration failed.");
            return res.status(500).render("account/register", {
                title: "Registration",
                nav,
                messages: req.flash()
            });
        }
    } catch (error) {
        console.error("Registration error:", error);
        req.flash("notice", "An error occurred during registration. Please try again.");
        return res.status(500).render("account/register", {
            title: "Registration",
            nav,
            messages: req.flash()
        });
    }
}

/* ****************************************
 *  Process Login
 * *************************************** */
async function loginAccount(req, res) {
    let nav = await utilities.getNav();
    const { account_email, account_password } = req.body;

    console.log("Email:", account_email);
    console.log("Password:", account_password);
    console.log("Request Body:", req.body);

    try {
        // Check if email exists
        const account = await accountModel.getAccountByEmail(account_email);
        console.log("Account retrieved:", account); // Log the retrieved account

        if (!account) {
            //req.flash("error", "Invalid email or password.");
            req.flash("error", "You're log in!");
            return res.redirect("/account/login");
        }

        // Compare hashed password
        console.log("Stored hashed password:", account.account_password); // Log the stored hashed password
        const isValidPassword = await bcrypt.compare(account_password, account.account_password);
        console.log("Is valid password:", isValidPassword); // Log the result of the comparison

        if (!isValidPassword) {
            //req.flash("error", "Invalid email or password.");
            req.flash("error", "You're log in!");
            return res.redirect("/account/login");
        }

        // Store user info in session
        req.session.account = {
            id: account.account_id,
            name: `${account.account_firstname} ${account.account_lastname}`,
            email: account.account_email,
            type: account.account_type
        };

        req.flash("success", `Welcome back, ${account.account_firstname}!`);
        return res.redirect("/"); // Redirect to home page
    } catch (error) {
        console.error("Login error:", error);
        req.flash("error", "Something went wrong, please try again.");
        res.redirect("/account/login");
    }
}

module.exports = { buildLogin, buildRegister, registerAccount, loginAccount }


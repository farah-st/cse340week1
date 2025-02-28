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
    let nav = await utilities.getNav(); // Generate navigation links

    console.log("Received form data:", req.body); // Debugging: Log form data

    const { account_firstname, account_lastname, account_email, account_password } = req.body;
    let hashedPassword;
    try {
        // Regular password and cost (salt is generated automatically)
        hashedPassword = await bcrypt.hash(account_password, 10);
    } catch (error) {
        req.flash("notice", "Sorry, there was an error processing the registration.");
        return res.status(500).render("account/register", {
            title: "Registration",
            nav,
            errors: null,
            messages: req.flash() // Ensure messages are passed
        });
    }

    // Check if any field is missing
    if (!account_firstname || !account_lastname || !account_email || !account_password) {
        console.error("Missing required fields:", { account_firstname, account_lastname, account_email, account_password });
        req.flash("notice", "All fields are required.");
        return res.status(400).render("account/register", { 
            title: "Registration", 
            nav,
            messages: req.flash() // Ensure messages are passed
        });
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
                `Congratulations, you're registered ${account_firstname}. Please log in.`);
                
            return res.status(201).render("account/login", {
                title: "Login",
                nav,
                messages: req.flash() // Ensure messages are passed
            });
        } else {
            req.flash("notice", "Sorry, the registration failed.");
            return res.status(501).render("account/register", {
                title: "Registration",
                nav,
                messages: req.flash() // Ensure messages are passed
            });
        }
    } catch (error) {
        console.error("Registration error:", error);
        req.flash("notice", "An error occurred during registration. Please try again.");
        return res.status(500).render("account/register", {
            title: "Registration",
            nav,
            messages: req.flash() // Ensure messages are passed
        });
    }
}


/* ****************************************
 *  Process Login
 * *************************************** */
async function loginAccount(req, res) {
    let nav = await utilities.getNav();
    const { account_email, account_password } = req.body;

    try {
        // Check if email exists
        const account = await accountModel.getAccountByEmail(account_email);
        if (!account) {
            req.flash("error", "Invalid email or password.");
            return res.redirect("/account/login");
        }

        // Compare hashed password
        const isValidPassword = await bcrypt.compare(account_password, account.account_password);
        if (!isValidPassword) {
            req.flash("error", "Invalid email or password.");
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


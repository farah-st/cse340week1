const bcrypt = require("bcryptjs");
const utilities = require("../utilities");
const accountModel = require("../models/account-model");

/* ****************************************
 *  Deliver login view
 * *************************************** */
// async function buildLogin(req, res, next) {
//     try {
//         let nav = await utilities.getNav();
//         let messages = [...req.flash("error"), ...req.flash("success"), ...req.flash("notice")];

//         res.render("account/login", {
//             title: "Login",
//             nav,
//             messages,
//         });
//     } catch (error) {
//         console.error("Error rendering login page:", error);
//         next(error);
//     }
// }

async function buildLogin(req, res, next) {
    try {
        let nav = await utilities.getNav();
        let messages = [...req.flash("error"), ...req.flash("success"), ...req.flash("notice")];

        console.log("Flash messages at login render:", messages); // Debugging line

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
        let nav = await utilities.getNav();
        let messages = [...req.flash("error"), ...req.flash("success"), ...req.flash("notice")];

        res.render("account/register", {
            title: "Register",
            nav,
            first_name: "",
            last_name: "",
            email: "",
            errors: null,
            messages, // Pass messages to the view
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
    let nav = await utilities.getNav();
    const { account_firstname, account_lastname, account_email, account_password } = req.body;

    try {
        const errors = [];

        if (!account_firstname) errors.push("First name is required.");
        if (!account_lastname) errors.push("Last name is required.");
        if (!account_email) errors.push("Email is required.");
        if (!account_password) errors.push("Password is required.");

        // Ensure errors is always an array
        const flashErrors = req.flash("notice");
        if (flashErrors.length > 0) {
            errors.push(...flashErrors);
        }

        if (errors.length > 0) {
            console.log("Rendering register page with errors:", errors);
            return res.status(400).render("account/register", {
                title: "Register",
                nav,
                first_name: account_firstname,
                last_name: account_lastname,
                email: account_email,
                errors,  // ✅ Now always an array
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
                errors: req.flash("notice") || [], // ✅ Ensure this is always an array
            });
        }

        // Hash password
        const saltRounds = process.env.SALT_ROUNDS || 10;
        const hashedPassword = await bcrypt.hash(account_password, Number(saltRounds));

        // Register account
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
 *  Process Login
 * *************************************** */
async function loginAccount(req, res) {
    let nav = await utilities.getNav();
    const { account_email, account_password } = req.body;

    try {
        // Check if email exists
        const account = await accountModel.getAccountByEmail(account_email);
        if (!account || !account.account_password) {
            req.flash("error", "Invalid email or password.");
            return res.redirect("/account/login");
        }

        // Compare hashed password
        const isValidPassword = await bcrypt.compare(account_password, account.account_password);
        if (!isValidPassword) {
            req.flash("error", "Invalid email or password.");
            console.log("Current Flash Messages:", req.flash());
            return res.redirect("/account/login");
        }

        // Store user info in session
        req.session.account = {
            id: account.account_id,
            name: `${account.account_firstname} ${account.account_lastname}`,
            email: account.account_email,
            type: account.account_type,
        };

        req.flash("success", `Welcome back, ${account.account_firstname}!`);
        console.log("Current Flash Messages:", req.flash());
        return res.redirect("/"); // Redirect to home page
    } catch (error) {
        console.error("Login error:", error);
        req.flash("error", "Something went wrong, please try again.");
        return res.redirect("/account/login");
    }
}

module.exports = { buildLogin, buildRegister, registerAccount, loginAccount };
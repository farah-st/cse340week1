const invModel = require("../models/inventory-model");
const { body, validationResult } = require("express-validator");
const { JSDOM } = require("jsdom");
const createDOMPurify = require("dompurify");
const jwt = require("jsonwebtoken")
require("dotenv").config()
const { pool } = require("../database");

// Create a virtual window for DOMPurify
const window = new JSDOM("").window;
const DOMPurify = createDOMPurify(window);

const Util = {};

/* ************************
 * Constructs the navigation HTML unordered list
 ************************ */
Util.getNav = async function () {
  try {
    const data = await invModel.getClassifications();
    let list = "<ul>";
    list += '<li><a href="/" title="Home page">Home</a></li>';

    data.forEach((row) => {
      const safeName = DOMPurify.sanitize(row.classification_name);
      list += `<li>
                <a href="/inventory/type/${row.classification_id}" title="See our inventory of ${safeName} vehicles">
                  ${safeName}
                </a>
              </li>`;
    });

    list += "</ul>";
    return list;
  } catch (error) {
    console.error("Error building navigation:", error);
    throw new Error("Navigation construction failed");
  }
};

/* ****************************************
 * Middleware for handling errors
 * Wraps asynchronous functions to catch errors
 **************************************** */
// Util.handleErrors = (fn) => (req, res, next) =>
//   Promise.resolve(fn(req, res, next)).catch(next);
Util.handleErrors = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/* **************************************
 * Build the classification grid HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
  try {
    let grid = "";

    if (data.length > 0) {
      grid = '<ul id="inv-display">';
      data.forEach((vehicle) => {
        const tnImage = `/images/vehicles/${vehicle.inv_thumbnail}`;
        const fullImage = tnImage.replace("-tn", "");
        const safeMake = DOMPurify.sanitize(vehicle.inv_make);
        const safeModel = DOMPurify.sanitize(vehicle.inv_model);

        grid += `<li>
          <a href="../../inventory/detail/${vehicle.inv_id}" title="View ${safeMake} ${safeModel} details">
            <img src="${tnImage}" 
                 srcset="${tnImage} 768w, ${fullImage} 1200w"
                 sizes="(max-width: 768px) 100vw, (min-width: 769px) 50vw"
                 alt="Image of ${safeMake} ${safeModel} on CSE Motors" />
          </a>
          <div class="namePrice">
            <hr />
            <h2>
              <a href="../../inventory/detail/${vehicle.inv_id}" title="View ${safeMake} ${safeModel} details">
                ${safeMake} ${safeModel}
              </a>
            </h2>
            <span>$${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</span>
          </div>
        </li>`;
      });
      grid += "</ul>";
    } else {
      grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>';
    }
    return grid;
  } catch (error) {
    console.error("Error building classification grid:", error);
    return '<p class="notice">An error occurred while loading vehicles.</p>';
  }
};

/* ************************
 * Build Vehicle Detail HTML
 ************************ */
Util.buildVehicleDetailHTML = function (vehicle) {
  const tnImage = vehicle.inv_thumbnail;
  const fullImage = tnImage.replace("-tn", "");

  return `
    <section class="vehicle-detail">
        <img src="${tnImage}" 
             srcset="${tnImage} 768w, ${fullImage} 1200w"
             sizes="(max-width: 768px) 100vw, (min-width: 769px) 70vw"
             alt="${vehicle.inv_make} ${vehicle.inv_model}">
        <div class="vehicle-info">
            <h1>${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}</h1>
            <p><strong>Price:</strong> $${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</p>
            <p><strong>Mileage:</strong> ${vehicle.inv_miles.toLocaleString("en-US")} miles</p>
            <p><strong>Description:</strong> ${vehicle.inv_description}</p>
            <p><strong>Color:</strong> ${vehicle.inv_color}</p>
        </div>
    </section>
  `;
};

/* ***************************
 *  Server-side Validation Middleware for Classification
 * *************************** */
Util.classificationValidation = [
  body("classification_name")
    .trim()
    .notEmpty().withMessage("Classification name is required.")
    .isAlphanumeric().withMessage("No spaces or special characters allowed."),
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const nav = await Util.getNav();
      return res.render("inventory/add-classification", {
        title: "Add Classification",
        nav,
        message: "Please correct the errors below.",
        errors: errors.array().map((err) => err.msg),
      });
    }
    next();
  }
];

/* ***************************
 * Build classification dropdown list HTML
 * *************************** */
Util.buildClassificationList = async function (classification_id = null) {
  try {
    const data = await invModel.getClassifications(); 
    if (!data || data.length === 0) {
      return []; 
    }

    // Map the data to return an array of objects with id and name
    const classificationList = data.map(row => ({
      id: row.classification_id,
      name: row.classification_name
    }));

    return classificationList; // Return the array of objects
  } catch (error) {
    console.error("Error fetching classifications:", error);
    return []; 
  }
};


/* ***************************
 * Middleware to Check if User is Logged In
 * *************************** */
Util.isLoggedIn = (req, res, next) => {
  if (!req.session.account) {
    req.flash("error", "Please log in first.");
    return res.redirect("/account/login");
  }
  next();
};

/* ****************************************
* Middleware to check token validity
**************************************** */
// local
// Util.checkJWTToken = (req, res, next) => {
//   if (req.cookies.jwt) {
//    jwt.verify(
//     req.cookies.jwt,
//     process.env.ACCESS_TOKEN_SECRET,
//     function (err, accountData) {
//      if (err) {
//       req.flash("Please log in")
//       res.clearCookie("jwt")
//       return res.redirect("/account/login")
//      }
//      res.locals.accountData = accountData
//      res.locals.loggedin = 1
//      next()
//     })
//   } else {
//    next()
//   }
//  }

//prod
Util.checkJWTToken = (req, res, next) => {
  const token = req.cookies.jwt;

  if (token) {
    jwt.verify(
      token,
      process.env.ACCESS_TOKEN_SECRET,
      function (err, accountData) {
        if (err) {
          req.flash("Please log in");
          res.clearCookie("jwt");
          return res.redirect("/account/login");
        }

        //Attach account info to res.locals (for views)
        res.locals.accountData = accountData;
        res.locals.loggedin = 1;

        //Restore session so route handlers can use it
        req.session.account = accountData;

        next();
      }
    );
  } else {
    next();
  }
};

/* ****************************************
 *  Check Login
 * ************************************ */
Util.checkLogin = (req, res, next) => {
  console.log("🔐 checkLogin | req.session.account:", req.session.account);
  console.log("🔐 checkLogin | res.locals.loggedin:", res.locals.loggedin);
  // Accept if either session or JWT restored login state
  if (res.locals.loggedin || req.session.account) {
    return next();
  } else {
    req.flash("notice", "Please log in.");
    return res.redirect("/account/login");
  }
};

/* ****************************************
 *  classification?
 * ***************************************/
async function getClassifications() {
  try {
      const result = await pool.query("SELECT classification_id, classification_name FROM classification ORDER BY classification_name");
      return result.rows;
  } catch (error) {
      console.error("Database error fetching classifications:", error);
      return [];
  }
}

/* ****************************************
 *  Check Admin Role
 * ************************************ */
Util.checkAdmin = (req, res, next) => {
  const account = req.session.account || res.locals.accountData;
  if (account?.account_type === "Admin") {
    return next();
  } else {
    req.flash("notice", "Access restricted to admins only.");
    return res.redirect("/account/login");
  }
};

/* ****************************************
 *  Middleware to verify Admin
 **************************************** */
Util.verifyAdmin = (req, res, next) => {
  const account = req.session.account || res.locals.accountData;
  if (account?.account_type === "Admin") {
    return next();
  } else {
    req.flash("notice", "Access restricted to administrators.");
    return res.redirect("/account/login");
  }
};

//module.exports = Util;

module.exports = {
  getClassifications, 
  ...Util 
};

/* ****************************************
 *  Testing DB
 * ***************************************/
async function testDatabaseConnection() {
  try {
      const result = await pool.query("SELECT NOW()");
      console.log("✅ Database connection successful:", result.rows);
  } catch (error) {
      console.error("❌ Database connection failed:", error);
  }
}
testDatabaseConnection();

/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
require("dotenv").config(); 
const cookieParser = require("cookie-parser")
const app = express(); // <-- app initialized here

// Middleware after app initialization
app.use(cookieParser());

const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");
const utilities = require("./utilities");
const pool = require('./database/');
const session = require("express-session");
const flash = require("connect-flash");
const path = require('path');

/* ********************************
 * Validate Environment Variables
 **********************************/
if (!process.env.SESSION_SECRET || !process.env.DATABASE_URL) {
  console.error("Missing required environment variables: SESSION_SECRET or DATABASE_URL.");
  process.exit(1); 
}

/* ***********************
 * Middleware
 *************************/
// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware (Handles Cookies)
app.use(session({
  store: new (require('connect-pg-simple')(session))({
    createTableIfMissing: true,
    pool,
  }),
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  name: 'sessionId',
  cookie: { 
    secure: process.env.NODE_ENV === 'production', // secure in prod
    httpOnly: true, 
    maxAge: 1000 * 60 * 60 * 24 // 1 day
  }
}));

// Flash Middleware
app.use(flash());

// Consolidated Flash Messages Middleware
app.use((req, res, next) => {
  res.locals.flash = {
    error: req.flash('error'),
    success: req.flash('success'),
    info: req.flash('info'),
  };
  next();
});

app.use(utilities.checkJWTToken)

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.set("layout", "layouts/layout"); // Path to layout

/* ***********************
 * Routes
 *************************/
// Home Page Route
app.get("/", utilities.handleErrors(async (req, res) => {
  if (!req.session.account) {
    return res.redirect("/account/login");
  }
  res.render("index", {
    title: "Home",
    user: req.session.account,
    messages: req.flash()
  });  
}));


app.get("/favicon.ico", (req, res) => res.status(204));

// Inventory Routes
app.use("/inv", inventoryRoute);

// Account Routes
app.use("/account", accountRoute);

// Example route for inventory management
app.get("/inv", (req, res) => {
  req.flash("info", "Welcome to the inventory management page!");
  const message = req.flash("info");
  res.render("inventory/management", { message });
});

// File Not Found Route - must be last route in list
app.use((req, res, next) => {
  next({ status: 404, message: 'Sorry, we appear to have lost that page.' });
});

/* ***********************
 * Express Error Handler
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
  const nav = await utilities.getNav();
  console.error(`Error at "${req.originalUrl}": ${err.message}`);

  let title = err.status === 404 ? "Page Not Found" : "Server Error";
  let message = err.status === 404
      ? err.message
      : "Oh no! There was a crash. Maybe try a different route?";

  // Use flash messages from locals
  res.status(err.status || 500).render("errors/error", {
    title,
    message,
    nav,
    flash: res.locals.messages,
  });
});

// 404 Final Fallback (if needed)
app.use(async (req, res) => {
  res.status(404).render("errors/error", {
    title: "Page Not Found",
    message: "The page you are looking for does not exist.",
    nav: await utilities.getNav(),
    flash: res.locals.messages,
  });
});

/* ***********************
 * Local Server Information
 *************************/
const port = process.env.PORT || 5501;
const host = process.env.HOST || "localhost";

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`App listening on http://${host}:${port}`);
});

console.log(`Connecting to database: ${process.env.DATABASE_URL ? '[DATABASE_URL_PRESENT]' : '[DATABASE_URL_MISSING]'}`);
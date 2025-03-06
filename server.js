/* ******************************************
 * This server.js file is the primary file of  
 * the application. It is used to control the project.
 *******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
require("dotenv").config(); 
const app = express();
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");
const utilities = require("./utilities");
const pool = require('./database/'); 
const session = require("express-session");
const flash = require("connect-flash");
const bodyParser = require("body-parser");
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
app.use(express.static("public"));
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
    secure: process.env.NODE_ENV === 'production', 
    httpOnly: true, 
    maxAge: 1000 * 60 * 60 * 24 
  }
}));

// Flash Middleware
app.use(flash());

// Set flash messages to res.locals
app.use((req, res, next) => {
  res.locals.messages = req.flash(); // This will allow you to access all flash messages
  res.locals.flash = {
    error: req.flash('error'),
    success: req.flash('success'),
    info: req.flash('info'),
  };
  next();
});

/* ***********************
 * Routes
 *************************/
app.get("/", utilities.handleErrors(baseController.buildHome));
app.get("/favicon.ico", (req, res) => res.status(204));

// Inventory routes
app.use("/inv", inventoryRoute);

// Account routes
app.use("/account", accountRoute);

// Example route for inventory management
app.get('/inv', (req, res) => {
  req.flash('info', 'Welcome to the inventory management page!');
  const message = req.flash('info');
  res.render('inventory/management', { message });
});

// Home page route (after login)
app.get("/", (req, res) => {
  if (!req.session.account) {
    return res.redirect("/account/login");  // Redirect to login if not logged in
  }

  // Render the home page if logged in
  res.render("home", {
    title: "Home",
    user: req.session.account,
    messages: req.flash() // Pass flash messages
  });
});

// Serve static files like images with optimized caching
app.use(express.static(path.join(__dirname, 'public'), {
  maxAge: '30d',  // Set cache expiration for static files
  etag: true,
}));

// File Not Found Route - must be last route in list
app.use((req, res, next) => {
  next({ status: 404, message: 'Sorry, we appear to have lost that page.' });
});

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.set("layout", "layouts/layout"); // Path to layout

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 5501;
const host = process.env.HOST || "localhost";

/* ***********************
 * Express Error Handler
 *************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav();
  console.error(`Error at "${req.originalUrl}": ${err.message}`);

  let title = err.status === 404 ? "Page Not Found" : "Server Error";
  let message =
    err.status === 404
      ? err.message
      : "Oh no! There was a crash. Maybe try a different route?";

  let flashMessages = {
    error: req.flash('error'),
    success: req.flash('success'),
    info: req.flash('info'),
  };

  res.status(err.status || 500).render("errors/error", {
    title,
    message,
    nav,
    flash: flashMessages, 
  });
});

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`App listening on http://${host}:${port}`);
});

console.log(`Connecting to database: ${process.env.DATABASE_URL ? '[DATABASE_URL_PRESENT]' : '[DATABASE_URL_MISSING]'}`);

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
const app = express();
const baseController = require("./controllers/baseController");
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");
const utilities = require("./utilities");
const session = require("express-session");
const pool = require('./database/');
const bodyParser = require("body-parser")

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

// Express Messages Middleware
app.use(require('connect-flash')());

app.use((req, res, next) => {
  res.locals.messages = require('express-messages')(req, res);
  next();
});

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

/* ***********************
 * Routes
 *************************/
app.get("/", utilities.handleErrors(baseController.buildHome));
app.get("/favicon.ico", (req, res) => res.status(204));

// Inventory routes
app.use("/inv", inventoryRoute);

// Account routes
app.use("/account", require("./routes/accountRoute"));

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
 * Place after all other middleware
 *************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav();
  console.error(`Error at "${req.originalUrl}": ${err.message}`);
  
  let message = err.status === 404 
    ? err.message 
    : 'Oh no! There was a crash. Maybe try a different route?';

  res.status(err.status || 500).render("errors/error", {
    title: err.status || 'Server Error',
    message,
    nav
  });
});

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`App listening on http://${host}:${port}`);
});

console.log(`Connecting to database: ${process.env.DATABASE_URL ? '[DATABASE_URL_PRESENT]' : '[DATABASE_URL_MISSING]'}`);

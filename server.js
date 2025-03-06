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
    /*When deploy in prod change to this*/
    /*secure: process.env.NODE_ENV === 'production',*/
    /*To run locally */
    secure: false,
    httpOnly: true, 
    maxAge: 1000 * 60 * 60 * 24 
  }
}));

// Express Messages Middleware
app.use(flash());

// Middleware to set flash messages to res.locals
 app.use((req, res, next) => {
  res.locals.messages = req.flash(); // This will allow you to access all flash messages
   next();
 });

// app.use((req, res, next) => {
//   res.locals.messages = { 
//     success: req.flash("success"), 
//     error: req.flash("error"), 
//     notice: req.flash("notice") 
//   };
//   next();
// });
/*comment */
/*app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));*/
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


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
  req.flash('info', 'Welcome to the inventory management page!'); // Set a flash message
  const message = req.flash('info'); // Retrieve flash messages
  res.render('inventory/management', { message }); // Render the management page
});

// Serve static files like images
app.use(express.static(path.join(__dirname, 'public')));

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

  let title = err.status === 404 ? "Page Not Found" : "Server Error";
  let message =
    err.status === 404
      ? err.message
      : "Oh no! There was a crash. Maybe try a different route?";

  // Include flash messages in the error response
  let messages = req.flash();

  res.status(err.status || 500).render("errors/error", {
    title,
    message,
    nav,
    messages, // Pass messages to the error view
  });
});

// Ensure this is **AFTER** all routes
app.use((req, res) => {
  res.status(404).render("errors/error", {
    title: "Page Not Found",
    message: "The page you are looking for does not exist.",
    nav: utilities.getNav(),
  });
});

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`App listening on http://${host}:${port}`);
});

/* ***********************
 * year
 *************************/
app.use(async (err, req, res, next) => {
  let nav = await utilities.getNav();
  console.error(`Error at "${req.originalUrl}": ${err.message}`);
  
  let message = err.status === 404 
    ? err.message 
    : 'Oh no! There was a crash. Maybe try a different route?';

  let year = new Date().getFullYear(); // Get current year

  res.status(err.status || 500).render("errors/error", {
    title: err.status || 'Server Error',
    message,
    nav,
    year // Pass year to the view
  });
});

console.log(`Connecting to database: ${process.env.DATABASE_URL ? '[DATABASE_URL_PRESENT]' : '[DATABASE_URL_MISSING]'}`);
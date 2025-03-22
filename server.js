/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
require("dotenv").config(); 
const cookieParser = require("cookie-parser");
const session = require("express-session");
const flash = require("connect-flash");
const pgSession = require("connect-pg-simple")(session); 
const path = require("path");
const utilities = require("./utilities");
const pool = require("./database/");
const app = express(); 

// Import Routes BEFORE using them
const inventoryRoute = require("./routes/inventoryRoute");
const accountRoute = require("./routes/accountRoute");

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
app.use(cookieParser());

// Serve static files
app.use(express.static(path.join(__dirname, "public")));
app.use(expressLayouts);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session Middleware
app.use(
  session({
    store: new pgSession({
      pool: pool,
      tableName: "session",
      createTableIfMissing: true,
    }),
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    name: "sessionId",
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24 * 7, 
    },
  })
);

// Flash Middleware (After session)
app.use(flash());

// Ensure user and flash messages are available in all views (AFTER session & flash)
app.use((req, res, next) => {
  res.locals.flash = req.flash();
  res.locals.user = req.session.account || null;
  next();
});

app.use(utilities.checkJWTToken);

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.set("layout", "layouts/layout"); 

/* ***********************
 * Routes (Now inventoryRoute is defined)
 *************************/
// Use Routes AFTER defining them
app.use("/inventory", inventoryRoute);
app.use("/account", accountRoute);

// Home Page Route
app.get("/", utilities.handleErrors(async (req, res) => {
  const nav = await utilities.getNav();
  res.render("index", {
    title: "Home",
    nav,
    user: req.session.account || null,
    messages: req.flash()
  });
}));

app.get("/favicon.ico", (req, res) => res.status(204));

// Example route for inventory management
app.get("/inv", (req, res) => {
  req.flash("info", "Welcome to the inventory management page!");
  const message = req.flash("info");
  res.render("inventory/management", { message });
});

// 404 Error Handler
app.use((req, res, next) => {
  next({ status: 404, message: 'Sorry, we appear to have lost that page.' });
});

/* ***********************
 * Express Error Handler
 *************************/
app.use(async (err, req, res, next) => {
  const nav = await utilities.getNav();
  console.error(`Error at "${req.originalUrl}": ${err.message}`);

  let title = err.status === 404 ? "Page Not Found" : "Server Error";
  let message = err.status === 404
      ? err.message
      : "Oh no! There was a crash. Maybe try a different route?";

  res.status(err.status || 500).render("errors/error", {
    title,
    message,
    nav,
    flash: res.locals.messages,
  });
});

// Final 404 Fallback
app.use(async (req, res) => {
  res.status(404).render("errors/error", {
    title: "Page Not Found",
    message: "The page you are looking for does not exist.",
    nav: await utilities.getNav(),
    flash: res.locals.messages,
  });
});

/* ***********************
 * Server Setup
 *************************/
const port = process.env.PORT || 5501;
const host = process.env.HOST || "localhost";

app.listen(port, () => {
  console.log(`App listening on http://${host}:${port}`);
});

console.log(`Connecting to database: ${process.env.DATABASE_URL ? '[DATABASE_URL_PRESENT]' : '[DATABASE_URL_MISSING]'}`);
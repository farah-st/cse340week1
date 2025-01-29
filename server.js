/* ******************************************
 * This server.js file is the primary file of the 
 * application. It is used to control the project.
 *******************************************/

/* ***********************
 * Require Statements
 *************************/
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const env = require("dotenv").config();
const app = express();
const baseController = require("./controllers/baseController")
const inventoryRoute = require("./routes/inventoryRoute");

/* ***********************
 * Middleware
 *************************/
app.use(express.static("public")); 
app.use(expressLayouts);

/* ***********************
 * Routes
 *************************/
app.get("/", baseController.buildHome);

// Inventory routes
app.use("/inv", inventoryRoute);

/* ***********************
 * View Engine and Templates
 *************************/
app.set("view engine", "ejs");
app.set("layout", "layouts/layout"); // Path to layout

/* ***********************
 * Local Server Information
 * Values from .env (environment) file
 *************************/
const port = process.env.PORT || 1000;
const host = process.env.HOST || "localhost";

/* ***********************
 * Log statement to confirm server operation
 *************************/
app.listen(port, () => {
  console.log(`App listening on http://${host}:${port}`);
});

console.log('Connecting to database at:', process.env.DATABASE_URL);
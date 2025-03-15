const express = require('express');
const router = express.Router();
const baseController = require("../controllers/baseController"); 


// Serve the homepage (index.ejs)
router.get("/", baseController.buildHome);
// Optional: Set cache control for static files (e.g., 1 day)
const oneDay = 86400000;

// Static Routes
// Serve the "public" folder and its subdirectories for static files
router.use(express.static("public", { maxAge: oneDay }));
router.use("/css", express.static(__dirname + "/../public/css", { maxAge: oneDay }));
router.use("/js", express.static(__dirname + "/../public/js", { maxAge: oneDay }));
router.use("/images", express.static(__dirname + "/../public/images", { maxAge: oneDay }));

module.exports = router;





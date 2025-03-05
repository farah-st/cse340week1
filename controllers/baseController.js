const utilities = require("../utilities/");

const baseController = {};

// Assuming handleErrors is a middleware that correctly handles errors
baseController.buildHome = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();
    req.flash("notice", "This is a flash message.");
    
    res.render("index", {
      title: "Home", 
      nav 
    });
  } catch (error) {
    next(error); // Forward to the global error handler
  }
};

module.exports = baseController;


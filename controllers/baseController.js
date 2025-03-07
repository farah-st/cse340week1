const utilities = require("../utilities/");

const baseController = {};

/**
 * Render the Home page.
 * Retrieves navigation data and optionally sets a flash notice message.
 */
baseController.buildHome = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();

    // Set a flash message for demonstration; remove or conditionally set in production
    if (process.env.NODE_ENV !== "production") {
      req.flash("notice", "This is a flash message.");
    }
    
    res.render("index", {
      title: "Home",
      nav
    });
  } catch (error) {
    next(error); // Forward errors to the global error handler
  }
};

module.exports = baseController;



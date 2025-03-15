const utilities = require("../utilities/");

const baseController = {};

/**
 * Render the Home page.
 * Retrieves navigation data and optionally sets a flash notice message.
 */
baseController.buildHome = async function (req, res, next) {
  try {
    const nav = await utilities.getNav();

    // Retrieve flash messages (if any)
    const messages = req.flash(); 

    // Check if user is logged in (assuming session contains user data)
    const loggedInUser = req.session ? req.session.loggedInUser : null;
    console.log("Session Data:", req.session);

    res.render("index", {
      title: "Home",
      nav,
      messages, 
      loggedInUser, 
    });
  } catch (error) {
    next(error); 
  }
};

module.exports = baseController;
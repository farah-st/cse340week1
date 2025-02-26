const invModel = require("../models/inventory-model");
const { body, validationResult } = require("express-validator");

const Util = {};

/* ************************
 * Constructs the nav HTML unordered list
 ************************** */
Util.getNav = async function () {
  try {
    let data = await invModel.getClassifications();
    let list = "<ul>";
    list += '<li><a href="/" title="Home page">Home</a></li>';
    
    data.forEach((row) => {
      list += "<li>";
      list += `<a href="/inv/type/${row.classification_id}" title="See our inventory of ${row.classification_name} vehicles">${row.classification_name}</a>`;
      list += "</li>";
    });

    list += "</ul>";
    return list;
  } catch (error) {
    console.error("Error building navigation:", error);
    throw error;
  }
};

/* ****************************************
 * Middleware For Handling Errors
 * Wrap other functions in this for 
 * General Error Handling
 **************************************** */
Util.handleErrors = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/* **************************************
 * Build the classification view HTML
 * ************************************ */
Util.buildClassificationGrid = async function (data) {
  let grid = ""; 

  if (data.length > 0) {
    grid = '<ul id="inv-display">';
    data.forEach((vehicle) => {
      const tnImage = vehicle.inv_thumbnail; 
      const fullImage = tnImage.replace("-tn", ""); 

      grid += `<li>
        <a href="../../inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">
          <img src="${tnImage}" 
               srcset="${tnImage} 768w, ${fullImage} 1200w"
               sizes="(max-width: 768px) 100vw, (min-width: 769px) 50vw"
               alt="Image of ${vehicle.inv_make} ${vehicle.inv_model} on CSE Motors" />
        </a>
        <div class="namePrice">
          <hr />
          <h2>
            <a href="../../inv/detail/${vehicle.inv_id}" title="View ${vehicle.inv_make} ${vehicle.inv_model} details">
              ${vehicle.inv_make} ${vehicle.inv_model}
            </a>
          </h2>
          <span>$${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</span>
        </div>
      </li>`;
    });
    grid += "</ul>";
  } else {
    grid = '<p class="notice">Sorry, no matching vehicles could be found.</p>';
  }
  return grid;
};

/* ************************
 * Build Vehicle Detail HTML
 ************************** */
Util.buildVehicleDetailHTML = function (vehicle) {
  const tnImage = vehicle.inv_thumbnail;
  const fullImage = tnImage.replace("-tn", "");

  return `
    <section class="vehicle-detail">
        <img src="${tnImage}" 
             srcset="${tnImage} 768w, ${fullImage} 1200w"
             sizes="(max-width: 768px) 100vw, (min-width: 769px) 70vw"
             alt="${vehicle.inv_make} ${vehicle.inv_model}">
        <div class="vehicle-info">
            <h1>${vehicle.inv_year} ${vehicle.inv_make} ${vehicle.inv_model}</h1>
            <p><strong>Price:</strong> $${new Intl.NumberFormat("en-US").format(vehicle.inv_price)}</p>
            <p><strong>Mileage:</strong> ${vehicle.inv_miles.toLocaleString("en-US")} miles</p>
            <p><strong>Description:</strong> ${vehicle.inv_description}</p>
            <p><strong>Color:</strong> ${vehicle.inv_color}</p>
        </div>
    </section>
  `;
};

/* ***************************
 *  Server-side Validation Middleware
 * ************************** */
Util.classificationValidation = [
  body("classification_name")
      .trim()
      .notEmpty().withMessage("Classification name is required.")
      .isAlphanumeric().withMessage("No spaces or special characters allowed."),
  async (req, res, next) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
          const nav = await Util.getNav(); // Ensure navigation is fetched
          return res.render("inventory/add-classification", {
              title: "Add Classification",
              nav, 
              message: "Please correct the errors below.",
              errors: errors.array().map(err => err.msg),
          });
      }
      next();
  }
];

/* ***************************
 * Build classification dropdown list
 * ************************** */
Util.buildClassificationList = async function (classification_id = null) {
  try {
    let data = await invModel.getClassifications();
    if (!data || data.length === 0) {
      return "<select><option value=''>Error loading classifications</option></select>";
    }

    let classificationList = '<select name="classification_id" id="classificationList" required>';
    
    // Make "Choose a Classification" the default non-selectable placeholder
    classificationList += "<option value='' disabled selected>Choose a Classification</option>";

    data.forEach((row) => {
      classificationList += `<option value="${row.classification_id}"`;
      if (classification_id != null && row.classification_id == classification_id) {
        classificationList += " selected";
      }
      classificationList += `>${row.classification_name}</option>`;
    });

    classificationList += "</select>";
    return classificationList;
  } catch (error) {
    console.error("Error fetching classifications:", error);
    return "<select><option value=''>Error loading classifications</option></select>";
  }
};


// Ensure all functions are properly exported
module.exports = Util;


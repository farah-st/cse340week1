const invModel = require("../models/inventory-model");

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


// Export functions correctly
module.exports = Util;

const invModel = require("../models/inventory-model");
const utilities = require("../utilities/index");

const invCont = {};

/* ***************************
 *  Build inventory by classification view
 * ************************** */
invCont.buildByClassificationId = utilities.handleErrors(async function (req, res) {
  const classification_id = req.params.classificationId;
  const data = await invModel.getInventoryByClassificationId(classification_id);

  if (!data || data.length === 0) {
    return res.status(404).render("errors/error", { message: "No vehicles found for this classification." });
  }

  const grid = await utilities.buildClassificationGrid(data);
  let nav = await utilities.getNav();
  const className = data[0].classification_name;

  res.render("./inventory/classification", {
    title: className + " vehicles",
    nav,
    grid,
  });
});

/* ***************************
 *  Build vehicle detail view
 * ************************** */
invCont.buildDetailView = utilities.handleErrors(async function (req, res) {
  const invId = req.params.inv_id;
  console.log(`Looking for vehicle with ID: ${invId}`);

  const vehicle = await invModel.getVehicleById(invId);
  if (!vehicle) {
    return res.status(404).render("errors/error", { title: "Vehicle Not Found", message: "Vehicle not found" });
  }

  console.log("Vehicle found:", vehicle);

  const nav = await utilities.getNav();
  const vehicleHTML = utilities.buildVehicleDetailHTML(vehicle);

  res.render("./inventory/detail", {
    title: `${vehicle.inv_make} ${vehicle.inv_model}`,
    vehicleHTML,
    nav,
  });
});



module.exports = invCont;

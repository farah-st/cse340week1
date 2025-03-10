'use strict';

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded.");

    // Get the classification dropdown (Fix ID Name to Match HTML)
    let classificationList = document.getElementById("classificationSelect"); // ✅ Updated to match HTML

    if (!classificationList) {
        console.error("Error: classificationSelect not found in the DOM.");
        return; // Stop execution if the dropdown is missing
    }

    console.log("Classification dropdown found:", classificationList);
    
    classificationList.addEventListener("change", function () {
        let classificationId = classificationList.value;
        console.log(`classification_id selected: ${classificationId}`);

        // Fetch inventory data based on the selected classification
        fetch(`/inv/getInventory/${classificationId}`)
            .then(response => response.json())
            .then(data => {
                const inventoryArray = Array.isArray(data) ? data : data.inventory || data.data || []; 

                // Get the display element from the DOM
                const inventoryDisplay = document.getElementById("inventoryDisplay");
                if (!inventoryDisplay) {
                    console.error("Error: inventoryDisplay element not found in the DOM.");
                    return;
                }

                // Clear any existing content
                inventoryDisplay.innerHTML = "";

                // Check if there's data to display
                if (inventoryArray.length === 0) {
                    inventoryDisplay.innerHTML = "<tr><td colspan='3'>No inventory items found.</td></tr>";
                    return;
                }

                // Set up the table headers
                let dataTable = `<thead>
                    <tr>
                        <th>Vehicle Name</th>
                        <th>Modify</th>
                        <th>Delete</th>
                    </tr>
                </thead>`;

                // Set up the table body
                dataTable += "<tbody>";

                // Populate the table with each inventory item
                inventoryArray.forEach(element => {
                    dataTable += `
                        <tr>
                            <td>${element.inv_make} ${element.inv_model}</td>
                            <td><a href='/inv/edit/${element.inv_id}' title='Click to update'>Modify</a></td>
                            <td><a href='/inv/delete/${element.inv_id}' title='Click to delete'>Delete</a></td>
                        </tr>`;
                });

                dataTable += "</tbody>";

                // Inject the built table into the HTML
                inventoryDisplay.innerHTML = dataTable;
            })
            .catch(err => {
                console.error("Error loading inventory data:", err);
            });
    });
});
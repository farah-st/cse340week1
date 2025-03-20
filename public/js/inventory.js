'use strict';

document.addEventListener("DOMContentLoaded", function () {
    console.log("DOM fully loaded.");

    // Retry finding classification_id until it appears
    let checkExist = setInterval(() => {
        let classificationList = document.getElementById("classification_id");

        if (classificationList) {
            clearInterval(checkExist);
            console.log("Classification dropdown found:", classificationList);

            classificationList.addEventListener("change", function () {
                let classificationId = classificationList.value;
                console.log(`classification_id selected: ${classificationId}`);

                fetch(`/inventory/getInventory/${classificationId}`)
                    .then(response => response.json())
                    .then(data => {
                        const inventoryArray = Array.isArray(data) ? data : data.inventory || data.data || [];

                        const inventoryDisplay = document.getElementById("inventoryDisplay");
                        if (!inventoryDisplay) {
                            console.error("Error: inventoryDisplay element not found in the DOM.");
                            return;
                        }

                        inventoryDisplay.innerHTML = "";

                        if (inventoryArray.length === 0) {
                            inventoryDisplay.innerHTML = "<tr><td colspan='3'>No inventory items found.</td></tr>";
                            return;
                        }

                        let dataTable = `<thead>
                            <tr>
                                <th>Vehicle Name</th>
                                <th>Modify</th>
                                <th>Delete</th>
                            </tr>
                        </thead><tbody>`;

                        inventoryArray.forEach(element => {
                            dataTable += `
                                <tr>
                                    <td>${element.inv_make} ${element.inv_model}</td>
                                    <td><a href='/inventory/edit/${element.inv_id}' title='Click to update'>Modify</a></td>
                                    <td><a href='/inventory/delete/${element.inv_id}' title='Click to delete'>Delete</a></td>
                                </tr>`;
                        });

                        dataTable += "</tbody>";
                        inventoryDisplay.innerHTML = dataTable;
                    })
                    .catch(err => console.error("Error loading inventory data:", err));
            });
        }
    }, 100); // Check every 100ms until it exists
});
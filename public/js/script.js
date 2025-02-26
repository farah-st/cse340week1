document.addEventListener("DOMContentLoaded", function () {
    const form = document.getElementById("classificationForm");
    
    if (form) {
        form.addEventListener("submit", function (event) {
            let input = document.getElementById("classification_name").value;
            let pattern = /^[A-Za-z0-9]+$/;

            if (!pattern.test(input)) {
                event.preventDefault();
                alert("Classification name cannot contain spaces or special characters.");
            }
        });
    }
});

document.getElementById("addInventoryForm").addEventListener("submit", function (event) {
    let make = document.getElementById("inv_make").value.trim();
    let model = document.getElementById("inv_model").value.trim();
    let year = document.getElementById("inv_year").value;
    let price = document.getElementById("inv_price").value;
    let miles = document.getElementById("inv_miles").value;
    let color = document.getElementById("inv_color").value.trim();

    if (!make || !model || !year || !price || !miles || !color) {
        event.preventDefault();
        alert("All fields must be filled!");
    }
});


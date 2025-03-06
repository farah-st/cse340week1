document.addEventListener("DOMContentLoaded", function () {
    // For login form validation
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
        loginForm.addEventListener("submit", function (event) {
            event.preventDefault(); // Prevent default submission

            const email = document.getElementById("account_email").value.trim();
            const password = document.getElementById("account_password").value.trim();
            const errorMessageElement = document.getElementById("error-message");

            let errorMessage = "";

            if (!email) {
                errorMessage = "Email is required.";
            } else if (!/\S+@\S+\.\S+/.test(email)) {
                errorMessage = "Invalid email format.";
            }

            if (!password) {
                errorMessage += (errorMessage ? " " : "") + "Password is required.";
            }

            if (errorMessage) {
                errorMessageElement.textContent = errorMessage;
                errorMessageElement.style.color = "red";
            } else {
                loginForm.submit(); // If no errors, proceed with form submission
            }
        });
    }

    // For classification form
    const classificationForm = document.getElementById("classificationForm");
    if (classificationForm) {
        classificationForm.addEventListener("submit", function (event) {
            let input = document.getElementById("classification_name").value;
            let pattern = /^[A-Za-z0-9]+$/;

            if (!pattern.test(input)) {
                event.preventDefault();
                alert("Classification name cannot contain spaces or special characters.");
            }
        });
    }

    // For add inventory form
    const addInventoryForm = document.getElementById("addInventoryForm");
    if (addInventoryForm) {
        addInventoryForm.addEventListener("submit", function (event) {
            let make = document.getElementById("inv_make").value.trim();
            let model = document.getElementById("inv_model").value.trim();
            let year = document.getElementById("inv_year").value;
            let price = document.getElementById("inv_price").value;
            let miles = document.getElementById("inv_miles").value;
            let color = document.getElementById("inv_color").value.trim();

            // Basic validation for required fields
            if (!make || !model || !year || !price || !miles || !color) {
                event.preventDefault();
                alert("All fields must be filled!");
                return;
            }

            // Additional validation for price and year to ensure they are valid numbers
            if (isNaN(price) || isNaN(year)) {
                event.preventDefault();
                alert("Price and Year must be valid numbers.");
                return;
            }

            // Ensure year is within a reasonable range (e.g., 1900 - current year)
            const currentYear = new Date().getFullYear();
            if (year < 1900 || year > currentYear) {
                event.preventDefault();
                alert("Year must be between 1900 and " + currentYear);
                return;
            }

            // Miles should be a valid positive number
            if (isNaN(miles) || miles <= 0) {
                event.preventDefault();
                alert("Miles must be a positive number.");
                return;
            }
        });
    }
});



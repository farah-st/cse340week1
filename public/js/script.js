document.addEventListener("DOMContentLoaded", function () {
    // Login form validation
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
                loginForm.submit(); // Submit if validation passes
            }
        });
    }

    // Classification form validation
    const classificationForm = document.getElementById("classificationForm");
    if (classificationForm) {
        classificationForm.addEventListener("submit", function (event) {
            const input = document.getElementById("classification_name").value;
            // Adjust regex if you want to allow spaces (e.g., /^[A-Za-z0-9 ]+$/)
            const pattern = /^[A-Za-z0-9]+$/;

            if (!pattern.test(input)) {
                event.preventDefault();
                alert("Classification name cannot contain spaces or special characters.");
            }
        });
    }

    // Add inventory form validation
    const addInventoryForm = document.getElementById("addInventoryForm");
    if (addInventoryForm) {
        addInventoryForm.addEventListener("submit", function (event) {
            const make = document.getElementById("inv_make").value.trim();
            const model = document.getElementById("inv_model").value.trim();
            const year = document.getElementById("inv_year").value;
            const price = document.getElementById("inv_price").value;
            const miles = document.getElementById("inv_miles").value;
            const color = document.getElementById("inv_color").value.trim();

            // Check that all required fields are filled
            if (!make || !model || !year || !price || !miles || !color) {
                event.preventDefault();
                alert("All fields must be filled!");
                return;
            }

            // Validate that price and year are numbers
            if (isNaN(price) || isNaN(year)) {
                event.preventDefault();
                alert("Price and Year must be valid numbers.");
                return;
            }

            // Ensure year is within a reasonable range
            const currentYear = new Date().getFullYear();
            if (year < 1900 || year > currentYear) {
                event.preventDefault();
                alert("Year must be between 1900 and " + currentYear);
                return;
            }

            // Ensure miles is a positive number
            if (isNaN(miles) || miles <= 0) {
                event.preventDefault();
                alert("Miles must be a positive number.");
                return;
            }
        });
    }
});
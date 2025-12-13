document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    form.addEventListener("submit", (e) => {
        const username = form.username.value.trim();
        const password = form.password.value.trim();
        if (!username || !password) {
            e.preventDefault();
            alert("Please enter both username and password.");
        }
    });
});

// -------------------------
// PASSWORD TOGGLE FUNCTIONALITY
// (Problematic last-character reveal logic REMOVED)
// -------------------------
const passwordInput = document.getElementById("password");
const toggleEye = document.getElementById("toggleEye");

let isShowing = false;

// Toggle eye icon
toggleEye.addEventListener("click", () => {
    isShowing = !isShowing;

    if (isShowing) {
        passwordInput.type = "text";
        toggleEye.src = "../assets/eye_icon.png";
    } else {
        passwordInput.type = "password";
        toggleEye.src = "../assets/eye_crossed_out.png";
    }
});

// Fully hide on blur
passwordInput.addEventListener("blur", () => {
    if (!isShowing) {
        passwordInput.type = "password";
    }
});
// -------------------------
// OPTIONAL FORM VALIDATION FIX
// -------------------------
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
// PASSWORD TOGGLE & LAST CHARACTER REVEAL
// -------------------------
const passwordInput = document.getElementById("password");
const toggleEye = document.getElementById("toggleEye");

let hideTimer = null;
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

// Show last typed character briefly
passwordInput.addEventListener("input", () => {
    if (isShowing) return;

    const originalValue = passwordInput.value;

    // Switch to text to reveal last character
    passwordInput.type = "text";

    // Mask all but last character
    let masked = "•".repeat(originalValue.length - 1);
    let lastChar = originalValue.slice(-1);
    passwordInput.value = masked + lastChar;

    // Clear previous timer
    if (hideTimer) clearTimeout(hideTimer);

    // After 1 second → mask again
    hideTimer = setTimeout(() => {
        passwordInput.type = "password";
        passwordInput.value = originalValue;
    }, 1000);
});

// Fully hide on blur
passwordInput.addEventListener("blur", () => {
    if (!isShowing) {
        passwordInput.type = "password";
    }
});

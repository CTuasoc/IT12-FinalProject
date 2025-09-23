document.addEventListener("DOMContentLoaded", () => {
  const form = document.querySelector("form");
  form.addEventListener("submit", (e) => {
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    if (!email || !password) {
      e.preventDefault();
      alert("Please enter both email and password.");
    }
  });
});
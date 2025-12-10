// dark_light_mode.js - Minimal version
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("themeToggle");
  
  // 1. Load saved theme on page load
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'dark') {
    document.body.classList.add("dark-mode");
    updateImages('dark'); // Update images if needed
  }
  
  // 2. Toggle theme on click (your existing code + localStorage)
  toggle.addEventListener("click", () => {
    const isDarkMode = document.body.classList.toggle("dark-mode");
    
    // Save to localStorage
    localStorage.setItem('theme', isDarkMode ? 'dark' : 'light');
    
    // Update images if needed
    updateImages(isDarkMode ? 'dark' : 'light');
  });
  
  // 3. Optional: Simple image update function
  function updateImages(theme) {
    // Update logo
    const logo = document.querySelector('.logo');
    if (logo) {
      if (theme === 'dark') {
        logo.src = logo.src.replace('light', 'dark').replace('Light', 'Dark');
      } else {
        logo.src = logo.src.replace('dark', 'light').replace('Dark', 'Light');
      }
    }
    
    // Update theme toggle button image via CSS class
    // Remove the CSS background-image rules and handle with JS
    const toggleBtn = document.getElementById('themeToggle');
    if (toggleBtn) {
      toggleBtn.classList.toggle('is-dark', theme === 'dark');
    }
  }
});
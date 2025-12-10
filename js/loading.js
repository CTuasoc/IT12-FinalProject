// loading.js - Simple loading screen controller
document.addEventListener("DOMContentLoaded", () => {
  const loadingScreen = document.getElementById('loadingScreen');
  const mainContent = document.querySelector('main, .main-content') || document.body;
  
  // Function to hide loading screen
  function hideLoadingScreen() {
    if (loadingScreen) {
      loadingScreen.classList.add('loaded');
      
      // Show main content with animation
      mainContent.classList.add('loaded');
      
      // Remove loading screen from DOM after animation
      setTimeout(() => {
        if (loadingScreen && loadingScreen.parentNode) {
          loadingScreen.style.display = 'none';
        }
      }, 500); // Match the CSS transition duration
    }
  }
  
  // Check if page is already loaded
  if (document.readyState === 'complete') {
    hideLoadingScreen();
  } else {
    // Wait for everything to load
    window.addEventListener('load', hideLoadingScreen);
    
    // Also hide after 3 seconds max (in case something hangs)
    setTimeout(hideLoadingScreen, 3000);
  }
  
  // Optional: Show loading screen during page transitions
  if (window.performance.navigation.type === 1) {
    // Page was reloaded - show loading
    console.log('Page reloaded');
  }
});
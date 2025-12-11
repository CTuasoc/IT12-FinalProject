document.addEventListener("DOMContentLoaded", () => {
    const form = document.querySelector("form");
    const passwordInput = document.getElementById("password");
    const toggleEye = document.getElementById("toggleEye");
    const errorMessage = document.getElementById("error-message");
    
    // Mobile viewport height fix
    function setVH() {
        let vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', `${vh}px`);
    }
    
    setVH();
    window.addEventListener('resize', setVH);
    window.addEventListener('orientationchange', setVH);
    
    // Form validation
    form.addEventListener("submit", (e) => {
        const username = form.username.value.trim();
        const password = form.password.value.trim();
        
        if (!username || !password) {
            e.preventDefault();
            errorMessage.textContent = "Please enter both username and password.";
            errorMessage.style.display = "block";
            
            // Hide error after 3 seconds
            setTimeout(() => {
                errorMessage.style.display = "none";
            }, 3000);
            
            // Focus on empty field
            if (!username) form.username.focus();
            else if (!password) form.password.focus();
        }
    });
    
    // Clear error on input
    form.addEventListener("input", () => {
        errorMessage.style.display = "none";
    });
    
    // Password toggle functionality
    let isShowing = false;
    
    toggleEye.addEventListener("click", () => {
        isShowing = !isShowing;
        
        if (isShowing) {
            passwordInput.type = "text";
            toggleEye.src = "../assets/eye_icon.png";
            // Add class for styling if needed
            toggleEye.classList.add("visible");
        } else {
            passwordInput.type = "password";
            toggleEye.src = "../assets/eye_crossed_out.png";
            toggleEye.classList.remove("visible");
        }
    });
    
    // Handle touch events for mobile
    toggleEye.addEventListener("touchstart", (e) => {
        e.preventDefault(); // Prevent touch scroll
    }, { passive: false });
    
    // Mobile keyboard handling
    const inputs = [form.username, passwordInput];
    inputs.forEach(input => {
        input.addEventListener("focus", () => {
            // Add a small delay to handle iOS keyboard
            setTimeout(() => {
                input.scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center',
                    inline: 'nearest'
                });
            }, 300);
        });
    });
    
    // Prevent form zoom on iOS
    document.addEventListener("touchmove", (e) => {
        if (e.target.tagName === "INPUT" && document.activeElement === e.target) {
            e.preventDefault();
        }
    }, { passive: false });
    
    // Auto-hide password after 3 seconds on mobile
    let passwordTimeout;
    passwordInput.addEventListener("input", () => {
        if (isShowing) {
            clearTimeout(passwordTimeout);
            passwordTimeout = setTimeout(() => {
                if (isShowing && document.activeElement !== passwordInput) {
                    isShowing = false;
                    passwordInput.type = "password";
                    toggleEye.src = "../assets/eye_crossed_out.png";
                }
            }, 3000);
        }
    });
    
    // Hide password when input loses focus (mobile optimized)
    passwordInput.addEventListener("blur", () => {
        if (isShowing) {
            // Short delay to allow user to see what they typed
            setTimeout(() => {
                if (isShowing && document.activeElement !== passwordInput) {
                    isShowing = false;
                    passwordInput.type = "password";
                    toggleEye.src = "../assets/eye_crossed_out.png";
                }
            }, 500);
        }
    });
});
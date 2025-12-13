// logout.js
document.addEventListener("DOMContentLoaded", () => {
    const logoutBtn = document.getElementById("logoutBtn");
    const logoutModal = document.getElementById("logoutModal");
    const cancelLogoutBtn = document.getElementById("cancelLogout");
    const confirmLogoutBtn = document.getElementById("confirmLogout");

    // Show logout modal when logout button is clicked
    if (logoutBtn) {
        logoutBtn.addEventListener("click", (e) => {
            e.preventDefault();
            logoutModal.style.display = "flex";
        });
    }

    // Close modal when cancel is clicked
    if (cancelLogoutBtn) {
        cancelLogoutBtn.addEventListener("click", () => {
            logoutModal.style.display = "none";
        });
    }

    // Handle logout confirmation
    if (confirmLogoutBtn) {
        confirmLogoutBtn.addEventListener("click", async () => {
            try {
                // Show loading state
                confirmLogoutBtn.disabled = true;
                confirmLogoutBtn.textContent = "Logging out...";
                
                // Perform logout via PHP
                const response = await fetch('../php/logout.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    }
                });

                if (response.ok) {
                    // Redirect to login page
                    window.location.href = '../php/login.php';
                } else {
                    console.error('Logout failed');
                    confirmLogoutBtn.disabled = false;
                    confirmLogoutBtn.textContent = "Logout";
                    logoutModal.style.display = "none";
                    alert('Logout failed. Please try again.');
                }
            } catch (error) {
                console.error('Logout error:', error);
                confirmLogoutBtn.disabled = false;
                confirmLogoutBtn.textContent = "Logout";
                logoutModal.style.display = "none";
                alert('Network error. Please try again.');
            }
        });
    }

    // Close modal when clicking outside
    logoutModal.addEventListener("click", (e) => {
        if (e.target === logoutModal) {
            logoutModal.style.display = "none";
        }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && logoutModal.style.display === "flex") {
            logoutModal.style.display = "none";
        }
    });
});
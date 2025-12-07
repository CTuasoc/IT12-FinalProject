// Function to handle logout
const setupLogout = () => {
    const logoutBtn = document.getElementById("logoutBtn");
    if (logoutBtn) {
        logoutBtn.addEventListener("click", () => {
            const confirmLogout = confirm("Are you sure you want to log out?");
            if (confirmLogout) {
                window.location.href = "../php/logout.php";
            }
        });
    }
};

// Function to fetch and display notifications (UNREAD, for dashboard widget)
const fetchAndDisplayNotifications = async () => {
    const notifyContainer = document.querySelector(".notify");
    if (!notifyContainer) return;

    try {
        const response = await fetch("../php/get_notifications.php");
        
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return;
        }

        const data = await response.json();

        // Clear content after the header but keep the header
        const notifyHeader = notifyContainer.querySelector('.notify-header');
        if (notifyHeader) {
            let nextSibling = notifyHeader.nextElementSibling;
            while (nextSibling) {
                const current = nextSibling;
                nextSibling = nextSibling.nextElementSibling;
                current.remove();
            }
        } else {
             notifyContainer.innerHTML = '<div class="notify-header"><h3>Notifications</h3><button id="viewAllBtn" class="view-all-btn">View All</button></div>';
        }

        if (data.success) {
            const notifications = data.notifications;

            if (notifications.length > 0) {
                notifications.forEach(notif => {
                    const notifElement = document.createElement("div");
                    notifElement.className = "notify-box new-notification";
                    
                    const notificationID = notif.notif_id; 

                    notifElement.innerHTML = `
                        <p><strong>${notif.notif_msg}</strong></p>
                        <small>${new Date(notif.created_at).toLocaleString()}</small>
                        <button class="action-btn" data-id="${notificationID}" data-action="approve">Approve</button>
                        <button class="action-btn" data-id="${notificationID}" data-action="deny">Deny</button>
                    `;
                    notifyContainer.appendChild(notifElement);
                });
            } else {
                const defaultBox = document.createElement("div");
                defaultBox.className = "notify-box";
                defaultBox.textContent = "No new notifications";
                notifyContainer.appendChild(defaultBox);
            }
        } else {
            console.error("Server error fetching notifications:", data.message);
            const errorBox = document.createElement("div");
            errorBox.className = "notify-box error-box";
            errorBox.textContent = "Failed to load notifications.";
            notifyContainer.appendChild(errorBox);
        }
    } catch (error) {
        console.error("Network or parsing error fetching notifications:", error);
    }
};

// Function to handle the successful processing of a notification action
const handleNotificationActionSuccess = async (target, action, data) => {
    alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action successful: ${data.message}`);
    
    const notificationElement = target.closest('.notify-box');
    
    // Check if the action happened in the main dashboard or the modal
    if (notificationElement && notificationElement.closest('#allNotificationsList')) {
        // --- Modal Action Success: Update status and remove buttons ---
        const statusTag = notificationElement.querySelector('.read-status-tag');
        if(statusTag) {
            statusTag.textContent = '(Read)';
            statusTag.style.color = '#666';
        }
        const buttonsContainer = notificationElement.querySelector('.modal-actions');
        if(buttonsContainer) {
            buttonsContainer.remove();
        }
        
    } else if (notificationElement && notificationElement.closest('.notify')) {
        // --- Dashboard Action Success: Remove the element completely ---
        notificationElement.remove();
    }
    
    // Always refresh the main dashboard list after a successful action
    fetchAndDisplayNotifications(); 
};

// Generic function to process the Approve/Deny API call
const processNotificationAction = async (event) => {
    const target = event.target;
    if (target.classList.contains('action-btn')) {
        const notifId = target.getAttribute('data-id');
        const action = target.getAttribute('data-action');
        
        const notificationElement = target.closest('.notify-box');

        if (!notifId || !action || !notificationElement) return;

        const formData = new URLSearchParams();
        formData.append('id', notifId);
        formData.append('action', action);

        target.disabled = true;
        
        const parentContainer = notificationElement.querySelector('.modal-actions') || notificationElement;
        const siblingBtn = parentContainer.querySelector(`.action-btn:not([data-action="${action}"])`);
        if (siblingBtn) siblingBtn.disabled = true;

        try {
            const response = await fetch('../php/update_notification_status.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: formData
            });

            const data = await response.json();

            if (data.success) {
                await handleNotificationActionSuccess(target, action, data);
            } else {
                alert(`Failed to ${action}: ${data.message}`);
                target.disabled = false;
                if (siblingBtn) siblingBtn.disabled = false;
            }
        } catch (error) {
            alert(`Error processing ${action}: ${error.message}`);
            target.disabled = false;
            if (siblingBtn) siblingBtn.disabled = false;
        }
    }
};


// Function to handle notification actions (Approve/Deny) - Attached to containers
const setupNotificationActions = () => {
    const notifyContainer = document.querySelector(".notify");
    const modalBody = document.getElementById("allNotificationsList");

    if (notifyContainer) {
        notifyContainer.addEventListener('click', processNotificationAction);
    }
    
    if (modalBody) {
        // Use capture phase to ensure the listener is active on dynamic content
        modalBody.addEventListener('click', processNotificationAction, true); 
    }
};


// --- NEW FUNCTION: Setup Clear All Button ---
const setupClearAll = () => {
    const clearBtn = document.getElementById("clearAllNotifsBtn");
    const modal = document.getElementById('notificationModal');

    if (clearBtn) {
        clearBtn.addEventListener('click', async () => {
            const confirmClear = confirm("Are you sure you want to mark ALL notifications as read? This cannot be undone.");
            if (!confirmClear) return;

            clearBtn.disabled = true;

            try {
                const response = await fetch('../php/clear_all_notifications.php', {
                    method: 'POST'
                });

                const data = await response.json();

                if (data.success) {
                    alert(data.message);
                    
                    // 1. Close the modal
                    modal.style.display = "none";
                    
                    // 2. Refresh the main dashboard widget (it should now show "No new notifications")
                    fetchAndDisplayNotifications();
                    
                    // Note: The next time the modal opens, fetchAllNotificationsForModal will reload the data as 'Read'.
                } else {
                    alert(`Failed to clear notifications: ${data.message}`);
                }
            } catch (error) {
                alert(`Error communicating with server: ${error.message}`);
            } finally {
                clearBtn.disabled = false;
            }
        });
    }
};


// Function to fetch and display ALL notifications (for modal)
const fetchAllNotificationsForModal = async () => {
    const listContainer = document.getElementById("allNotificationsList");
    if (!listContainer) return;
    
    listContainer.innerHTML = '<div class="loading-message">Loading all notifications...</div>';

    try {
        const response = await fetch("../php/get_notifications.php?all=1");
        
        if (!response.ok) {
            listContainer.innerHTML = `<div class="error-message">Error fetching notifications: HTTP ${response.status}</div>`;
            return;
        }

        const data = await response.json();
        listContainer.innerHTML = ''; 

        if (data.success) {
            const notifications = data.notifications;

            if (notifications.length > 0) {
                const list = document.createElement('div');
                list.className = 'modal-list-container';

                notifications.forEach(notif => {
                    const notifElement = document.createElement("div");
                    notifElement.className = "notify-box modal-notification-item"; 
                    
                    const notificationID = notif.notif_id; 
                    const isRead = parseInt(notif.is_read) === 1;
                    const readStatus = isRead ? 'Read' : 'Unread';
                    
                    let actionButtons = '';
                    
                    if (!isRead) {
                        actionButtons = `
                            <div class="modal-actions">
                                <button class="action-btn" data-id="${notificationID}" data-action="approve">Approve</button>
                                <button class="action-btn" data-id="${notificationID}" data-action="deny">Deny</button>
                            </div>
                        `;
                    }

                    notifElement.innerHTML = `
                        <div>
                            <strong>${notif.notif_msg}</strong> 
                            <span class="read-status-tag" style="font-size: 0.8em; color: ${isRead ? '#666' : 'red'};">(${readStatus})</span>
                            <br>
                            <small style="color: #666;">${new Date(notif.created_at).toLocaleString()}</small>
                        </div>
                        ${actionButtons}
                    `;
                    list.appendChild(notifElement);
                });
                listContainer.appendChild(list);
            } else {
                listContainer.innerHTML = "No notifications found in the history.";
            }
        } else {
            listContainer.innerHTML = `<div class="error-message">Server error: ${data.message}</div>`;
        }
    } catch (error) {
        listContainer.innerHTML = `<div class="error-message">Network error: ${error.message}</div>`;
    }
};


// Function to setup modal open/close logic
const setupModal = () => {
    const modal = document.getElementById('notificationModal');
    const btn = document.getElementById("viewAllBtn");
    const span = document.getElementsByClassName("close-btn")[0];

    if (btn) {
        btn.onclick = function() {
            modal.style.display = "block";
            fetchAllNotificationsForModal(); // Load data when modal opens
        }
    }

    if (span) {
        span.onclick = function() {
            modal.style.display = "none";
        }
    }

    // Close modal when user clicks anywhere outside of the modal
    window.onclick = function(event) {
        if (event.target == modal) {
            modal.style.display = "none";
        }
    }
}


// Execute on page load
document.addEventListener("DOMContentLoaded", () => {
    setupLogout();
    setupNotificationActions(); 
    setupModal(); 
    setupClearAll(); // <--- Clear All Setup added here
    
    fetchAndDisplayNotifications(); 
    setInterval(fetchAndDisplayNotifications, 10000); 
});
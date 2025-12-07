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
    const notificationsContainer = document.querySelector(".notifications-container");
    if (!notifyContainer || !notificationsContainer) return;

    try {
        const response = await fetch("../php/get_notifications.php");
        
        if (!response.ok) {
            console.error(`HTTP error! status: ${response.status}`);
            return;
        }

        const data = await response.json();

        // Clear existing notifications
        notificationsContainer.innerHTML = '';

        if (data.success) {
            const notifications = data.notifications;

            if (notifications.length > 0) {
                notifications.forEach(notif => {
                    const notifElement = document.createElement("div");
                    notifElement.className = "notify-box new-notification";
                    
                    const notificationID = notif.notif_id; 

                    notifElement.innerHTML = `
                        <p><strong>New notification</strong></p>
                    `;
                    notificationsContainer.appendChild(notifElement);
                });
            } else {
                const defaultBox = document.createElement("div");
                defaultBox.className = "notify-box";
                defaultBox.textContent = "No new notifications";
                notificationsContainer.appendChild(defaultBox);
            }
        } else {
            console.error("Server error fetching notifications:", data.message);
            const errorBox = document.createElement("div");
            errorBox.className = "notify-box error-box";
            errorBox.textContent = "Failed to load notifications.";
            notificationsContainer.appendChild(errorBox);
        }
    } catch (error) {
        console.error("Network or parsing error fetching notifications:", error);
    }
};

// Function to delete a notification
const deleteNotification = async (notificationId, notificationElement) => {
    try {
        const response = await fetch('../php/delete_notification.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: `id=${notificationId}`
        });

        const data = await response.json();

        if (data.success) {
            // Remove the notification element from the DOM
            notificationElement.remove();
            
            // If this was the last notification, show a message
            const listContainer = document.getElementById('allNotificationsList');
            if (listContainer && listContainer.children.length === 0) {
                listContainer.innerHTML = 'No notifications found in the history.';
            }
            
            // Also update the dashboard widget
            fetchAndDisplayNotifications();
            
            return true;
        } else {
            throw new Error(data.message || 'Failed to delete notification');
        }
    } catch (error) {
        console.error('Error deleting notification:', error);
        alert(`Error: ${error.message}`);
        return false;
    }
};

// Function to handle the successful processing of a notification action
const handleNotificationActionSuccess = async (target, action, data) => {
    alert(`${action.charAt(0).toUpperCase() + action.slice(1)} action successful: ${data.message}`);
    
    const notificationElement = target.closest('.notify-box');
    
    if (notificationElement) {
        if (action === 'delete') {
            return; // Already handled in deleteNotification
        }
        
        if (notificationElement.closest('#allNotificationsList')) {
            // --- Modal Action Success: Update status and remove action buttons ---
            const statusTag = notificationElement.querySelector('.read-status-tag');
            if(statusTag) {
                statusTag.textContent = '(Read)';
                statusTag.style.color = '#666';
            }
            const buttonsContainer = notificationElement.querySelector('.modal-actions');
            if(buttonsContainer) {
                // Remove action buttons but keep the delete button
                const actionButtons = buttonsContainer.querySelectorAll('.action-btn:not(.delete-btn)');
                actionButtons.forEach(btn => btn.remove());
            }
        } else if (notificationElement.closest('.notify')) {
            // --- Dashboard Action Success: Remove the element completely ---
            notificationElement.remove();
        }
    }
    
    // Refresh the main dashboard list after a successful action
    fetchAndDisplayNotifications();
};

// Generic function to process the Approve/Deny/Delete API call
const processNotificationAction = async (event) => {
    const target = event.target;
    if (!target.classList.contains('action-btn')) return;

    const notifId = target.getAttribute('data-id');
    const action = target.getAttribute('data-action');
    const notificationElement = target.closest('.notify-box');

    if (!notifId || !action || !notificationElement) return;

    // Handle delete action
    if (action === 'delete') {
        const confirmDelete = confirm('Are you sure you want to delete this notification?');
        if (confirmDelete) {
            target.disabled = true;
            await deleteNotification(notifId, notificationElement);
        }
        return;
    }

    // Handle approve action - redirect to add page with customer data
    if (action === 'approve') {
        // Get meta data from the notification element
        const metaData = notificationElement._metaData;
        
        console.log('Approve clicked'); // Debug
        console.log('MetaData from element:', metaData); // Debug
        console.log('Type of metaData:', typeof metaData); // Debug
        
        if (metaData && typeof metaData === 'object' && metaData.application_id) {
            console.log('Application ID found:', metaData.application_id); // Debug
            // Redirect to add.php with application ID as query parameter
            window.location.href = `../php/add.php?application_id=${metaData.application_id}`;
            return;
        }
        
        // Fallback if no meta data
        console.log('Meta data check failed'); // Debug
        alert('Unable to process approval. Missing customer data.');
        return;
    }

    // Handle deny action
    const formData = new URLSearchParams();
    formData.append('id', notifId);
    formData.append('action', action);

    target.disabled = true;
    
    const parentContainer = notificationElement.querySelector('.modal-actions') || notificationElement;
    const siblingBtns = parentContainer.querySelectorAll(`.action-btn:not([data-action="${action}"])`);
    siblingBtns.forEach(btn => { btn.disabled = true; });

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
            throw new Error(data.message || `Failed to ${action}`);
        }
    } catch (error) {
        console.error(`Error processing ${action}:`, error);
        alert(`Error: ${error.message}`);
        target.disabled = false;
        siblingBtns.forEach(btn => { btn.disabled = false; });
    }
};

// Function to handle notification actions (Approve/Deny/Delete) - Attached to containers
const setupNotificationActions = () => {
    const notifyContainer = document.querySelector(".notify");
    const modalBody = document.getElementById("allNotificationsList");

    if (notifyContainer) {
        notifyContainer.addEventListener('click', processNotificationAction);
    }
    
    if (modalBody) {
        modalBody.addEventListener('click', processNotificationAction);
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
                notifications.forEach(notif => {
                    const notifElement = document.createElement("div");
                    notifElement.className = "notify-box modal-notification-item"; 
                    notifElement.setAttribute('data-notif-id', notif.notif_id);
                    
                    const notificationID = notif.notif_id;
                    const metaData = notif.meta;
                    const isRead = parseInt(notif.is_read) === 1;
                    const readStatus = isRead ? 'Read' : 'Unread';
                    
                    console.log('Notification:', notif); // Debug log
                    console.log('Meta data:', metaData); // Debug log
                    
                    // Always show delete button
                    let actionButtons = `
                        <div class="modal-actions">
                            <button class="action-btn delete-btn" data-id="${notificationID}" data-action="delete">Delete</button>`;
                    
                    if (!isRead) {
                        actionButtons += `
                            <button class="action-btn" data-id="${notificationID}" data-action="approve">Approve</button>
                            <button class="action-btn" data-id="${notificationID}" data-action="deny">Deny</button>`;
                    }
                    
                    actionButtons += `</div>`;
                    
                    // Store meta data in element for later retrieval
                    notifElement._metaData = metaData;

                    notifElement.innerHTML = `
                        <div>
                            <strong>${notif.notif_msg}</strong> 
                            <span class="read-status-tag" style="font-size: 0.8em; color: ${isRead ? '#666' : 'red'};">(${readStatus})</span>
                            <br>
                            <small style="color: #666;">${new Date(notif.created_at).toLocaleString()}</small>
                        </div>
                        ${actionButtons}
                    `;
                    listContainer.appendChild(notifElement);
                });
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
    fetchAndDisplayNotifications();
    setInterval(fetchAndDisplayNotifications, 10000);
});
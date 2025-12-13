// check_rec.js - Admin-only delete button (completely removed from DOM for non-admins) with terms display
document.addEventListener("DOMContentLoaded", () => {
  const recordsTbody = document.getElementById("records");
  const searchInput = document.getElementById("search");
  const deleteBtn = document.getElementById("deleteBtn");
  const addFormMsg = document.getElementById("formMessage");
  const modal = document.getElementById("customerModal");
  const modalClose = document.querySelector(".modal-close");
  let currentCustomerID = null;
  let currentCustomerName = "";
  
  // Check if current user is admin (from PHP variable)
  const isAdminUser = typeof isAdmin !== 'undefined' ? isAdmin : false;
  
  // Filter variables
  let currentFilters = {
    search: '',
    status: 'all',
    nameType: 'both',
    sort: 'name_asc'
  };

  // Remove delete button completely if user is not admin
  if (!isAdminUser && deleteBtn) {
    console.log("Removing delete button from DOM (user is not admin)");
    deleteBtn.parentNode.removeChild(deleteBtn);
  }

  // Helper: display message with styling
  function showMessage(message, type = "info") {
    addFormMsg.textContent = message;
    addFormMsg.className = ""; // Clear existing classes
    
    if (type === "success") {
      addFormMsg.classList.add("success");
    } else if (type === "error") {
      addFormMsg.classList.add("error");
    }
    
    // Auto-hide success messages after 3 seconds
    if (type === "success") {
      setTimeout(() => {
        if (addFormMsg.textContent === message) {
          addFormMsg.textContent = "";
          addFormMsg.className = "";
        }
      }, 3000);
    }
  }

  // Modal functions
  function openModal() {
    modal.classList.add("show");
    document.body.style.overflow = "hidden";
  }

  function closeModal() {
    modal.classList.remove("show");
    document.body.style.overflow = "auto";
    showMessage(""); // Clear messages
  }

  // Close modal when clicking X or outside modal
  modalClose.addEventListener("click", closeModal);
  
  window.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeModal();
    }
  });

  // Close modal with Escape key
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && modal.classList.contains("show")) {
      closeModal();
    }
  });

  // Format date for display
  function formatDate(dateString) {
    if (!dateString || dateString === "0000-00-00") return "---";
    const date = new Date(dateString);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  // Format currency for display - Fixed to handle string or number
  function formatCurrency(amount) {
    // Convert to number if it's a string
    let num;
    if (typeof amount === 'string') {
      // Remove currency symbols, commas, and spaces
      num = parseFloat(amount.replace(/[^\d.-]/g, ''));
    } else {
      num = parseFloat(amount || 0);
    }
    
    // Check if it's a valid number
    if (isNaN(num)) {
      console.warn("Invalid amount for formatting:", amount);
      return "₱0.00";
    }
    
    return `₱${num.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })}`;
  }

  // Initialize filter functionality
  function initializeFilters() {
    const filterToggle = document.getElementById("filterToggle");
    const filtersPanel = document.getElementById("filtersPanel");
    const applyFiltersBtn = document.getElementById("applyFilters");
    const clearFiltersBtn = document.getElementById("clearFilters");
    
    if (!filterToggle) return; // Exit if no filter elements
    
    // Toggle filters panel
    filterToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      filtersPanel.classList.toggle('show');
      filterToggle.classList.toggle('active');
    });
    
    // Close filters when clicking outside
    document.addEventListener('click', (e) => {
      if (!filtersPanel.contains(e.target) && !filterToggle.contains(e.target)) {
        filtersPanel.classList.remove('show');
        filterToggle.classList.remove('active');
      }
    });
    
    // Apply filters
    applyFiltersBtn.addEventListener('click', () => {
      updateCurrentFilters();
      loadRecords();
      filtersPanel.classList.remove('show');
      filterToggle.classList.remove('active');
    });
    
    // Clear all filters
    clearFiltersBtn.addEventListener('click', () => {
      clearFilters();
      loadRecords();
      filtersPanel.classList.remove('show');
      filterToggle.classList.remove('active');
    });
    
    // Search input with debounce
    let searchTimeout;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        currentFilters.search = searchInput.value.trim();
        loadRecords();
      }, 300);
    });
  }

  function updateCurrentFilters() {
    currentFilters.search = searchInput.value.trim();
    currentFilters.status = document.querySelector('input[name="status"]:checked').value;
    currentFilters.nameType = document.querySelector('input[name="nameType"]:checked').value;
    currentFilters.sort = document.querySelector('input[name="sort"]:checked').value;
  }

  function clearFilters() {
    // Reset form inputs
    const statusAll = document.querySelector('input[name="status"][value="all"]');
    const nameTypeBoth = document.querySelector('input[name="nameType"][value="both"]');
    const sortNameAsc = document.querySelector('input[name="sort"][value="name_asc"]');
    
    if (statusAll) statusAll.checked = true;
    if (nameTypeBoth) nameTypeBoth.checked = true;
    if (sortNameAsc) sortNameAsc.checked = true;
    
    searchInput.value = '';
    
    // Reset current filters
    currentFilters = {
      search: '',
      status: 'all',
      nameType: 'both',
      sort: 'name_asc'
    };
  }

  // Fetch and display all records in table
  async function loadRecords() {
    try {
      // Build query string with filters
      const params = new URLSearchParams();
      params.append('search', currentFilters.search);
      params.append('status', currentFilters.status);
      params.append('nameType', currentFilters.nameType);
      params.append('sort', currentFilters.sort);
      
      const res = await fetch(`../php/fetch_records.php?${params.toString()}`);
      const data = await res.json();

      recordsTbody.innerHTML = "";
      const noRecordsMsg = document.getElementById("noRecordsMessage");

      if (!Array.isArray(data) || data.length === 0) {
        if (noRecordsMsg) noRecordsMsg.style.display = "block";
        return;
      }

      if (noRecordsMsg) noRecordsMsg.style.display = "none";

      data.forEach(cust => {
        const row = document.createElement("tr");
        row.className = "record-row";
        
        // Add status classes
        if (cust.IsOverdue) {
          row.classList.add('overdue');
        } else if (cust.IsPaid) {
          row.classList.add('paid');
        }
        
        row.innerHTML = `
          <td>
            <strong>${cust.FirstName} ${cust.LastName}</strong>
            ${cust.IsOverdue ? '<span class="status-badge overdue-badge">OVERDUE</span>' : ''}
            ${cust.IsPaid ? '<span class="status-badge paid-badge">PAID</span>' : ''}
          </td>
          <td>
            <button class="table-action-btn" data-id="${cust.CustomerID}">
              View Details
            </button>
          </td>
        `;
        recordsTbody.appendChild(row);
      });

      console.log("Records loaded:", data.length);
      console.log("User is admin:", isAdminUser);
      
      attachDisplayEvents();
    } catch (err) {
      console.error("Error loading records:", err);
      showMessage(`Error loading records: ${err.message}`, "error");
    }
  }

  // Attach display button events to table rows
  function attachDisplayEvents() {
    const buttons = document.querySelectorAll(".table-action-btn");
    
    buttons.forEach(btn => {
      // Remove any existing listeners to prevent duplicates
      const newBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(newBtn, btn);
      
      newBtn.addEventListener("click", async (e) => {
        e.stopPropagation(); // Prevent event bubbling
        const id = newBtn.dataset.id;
        currentCustomerID = id;
        
        try {
          const res = await fetch(`../php/fetch_customer.php?id=${id}`);
          const cust = await res.json();
          
          if (!cust.error) {
            currentCustomerName = `${cust.FirstName} ${cust.LastName}`;
            
            // Update modal content - Use raw numbers
            document.getElementById("cust-name").textContent = currentCustomerName;
            document.getElementById("cust-business").textContent = cust.BusinessName || "---";
            document.getElementById("cust-phone").textContent = cust.PhoneNum || "---";
            document.getElementById("cust-address").textContent = cust.Address || "---";
            
            // Format and display amounts
            document.getElementById("cust-amount").textContent = formatCurrency(cust.LoanAmount || cust.LoanAmountFormatted || 0);
            document.getElementById("cust-total").textContent = formatCurrency(cust.TotalAmount || cust.TotalAmountFormatted || 0);
            document.getElementById("cust-balance").textContent = formatCurrency(cust.Balance || cust.BalanceFormatted || 0);
            document.getElementById("cust-duedate").textContent = formatDate(cust.DueDate);
            
            // Display terms (just like in payments.js)
            document.getElementById("cust-terms").textContent = cust.TermsText || "No terms available";
            
            document.getElementById("cust-payment").textContent = formatCurrency(cust.AmountPaid || cust.AmountPaidFormatted || 0);
            
            // Clear any previous messages
            showMessage("");
            
            // Open modal
            openModal();
          } else {
            showMessage("Error loading customer details.", "error");
          }
        } catch (error) {
          console.error("Error loading customer data:", error);
          showMessage("Failed to load customer data.", "error");
        }
      });
    });

    // Make entire row clickable
    document.querySelectorAll(".record-row").forEach(row => {
      row.style.cursor = "pointer";
      row.addEventListener("click", (e) => {
        if (!e.target.classList.contains("table-action-btn")) {
          const btn = row.querySelector(".table-action-btn");
          if (btn) btn.click();
        }
      });
    });
  }

  // Delete customer function - Only runs if user is admin
  // Note: This won't exist for non-admin users since we removed the button
  if (isAdminUser && deleteBtn) {
    deleteBtn.addEventListener("click", async () => {
      if (!currentCustomerID) {
        showMessage("Please select a customer first.", "error");
        return;
      }

      if (!confirm(`Are you sure you want to delete ${currentCustomerName}? This action cannot be undone.`)) {
        showMessage("Deletion cancelled.", "info");
        return;
      }

      const password = prompt(`Enter your password to confirm deletion of ${currentCustomerName}:`);
      if (!password) {
        showMessage("Deletion canceled. No password entered.", "error");
        return;
      }

      try {
        const res = await fetch("../php/delete-customer.php", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `id=${encodeURIComponent(currentCustomerID)}&password=${encodeURIComponent(password)}`
        });

        const data = await res.json();

        if (data.success) {
          showMessage(data.message, "success");
          setTimeout(() => {
            closeModal();
            loadRecords(); // Refresh the table
          }, 1500);
        } else {
          showMessage(data.message, "error");
        }
      } catch (error) {
        showMessage("Failed to delete customer. Please try again.", "error");
      }
    });
  }

  // Initialize everything
  function initialize() {
    console.log("Initializing check_rec.js");
    console.log("Current user admin status:", isAdminUser);
    
    // Initialize filters
    initializeFilters();
    
    // Load initial records
    loadRecords();
    
    // Check if elements exist
    if (!recordsTbody) {
      console.error("ERROR: Could not find records table body!");
    }
    
    if (!searchInput) {
      console.error("ERROR: Could not find search input!");
    }
  }

  // Start the application
  initialize();
});
document.addEventListener("DOMContentLoaded", () => {
    const collectionGrid = document.getElementById("collectionGrid");
    const loadingMessage = document.getElementById("loadingMessage");
    const noCollectionsMessage = document.getElementById("noCollectionsMessage");
    const refreshBtn = document.getElementById("refreshBtn");
    const historyModal = document.getElementById("historyModal");
    const closeModal = document.getElementById("closeModal");
    const modalCustomerName = document.getElementById("modalCustomerName");
    const modalCustomerInfo = document.getElementById("modalCustomerInfo");
    const modalLoading = document.getElementById("modalLoading");
    const modalNoPayments = document.getElementById("modalNoPayments");
    const modalHistoryContainer = document.getElementById("modalHistoryContainer");
    const historyTableBody = document.getElementById("historyTableBody");
    const searchInput = document.getElementById("searchInput");

    let allCustomersData = []; // Store all customers for filtering

    // Refresh button
    refreshBtn.addEventListener("click", () => {
        loadCollectionSummary();
    });

    // Live search on input
    searchInput.addEventListener("input", () => {
        performLiveSearch();
    });

    // Close modal
    closeModal.addEventListener("click", closeHistoryModal);
    
    // Close modal when clicking outside
    historyModal.addEventListener("click", (e) => {
        if (e.target === historyModal) {
            closeHistoryModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && historyModal.style.display === "flex") {
            closeHistoryModal();
        }
    });

    function closeHistoryModal() {
        historyModal.style.display = "none";
        historyTableBody.innerHTML = "";
        modalLoading.style.display = "block";
        modalNoPayments.style.display = "none";
        modalHistoryContainer.style.display = "none";
    }

    // Load collection summary
    async function loadCollectionSummary() {
        try {
            loadingMessage.style.display = "block";
            collectionGrid.style.display = "none";
            noCollectionsMessage.style.display = "none";

            const res = await fetch("../php/fetch_collection_summary.php");
            const data = await res.json();

            loadingMessage.style.display = "none";

            if (!Array.isArray(data) || data.length === 0) {
                noCollectionsMessage.style.display = "block";
                return;
            }

            // Store all customers for search functionality
            allCustomersData = data;

            // Display all customers
            displayCustomers(data);
        } catch (err) {
            loadingMessage.style.display = "none";
            noCollectionsMessage.style.display = "block";
            noCollectionsMessage.textContent = `Error loading collection history: ${err.message}`;
            console.error("Error loading collection summary:", err);
        }
    }

    // Display customers in the grid
    function displayCustomers(customers) {
        // Clear existing grid
        collectionGrid.innerHTML = "";

        if (!customers || customers.length === 0) {
            noCollectionsMessage.style.display = "block";
            collectionGrid.style.display = "none";
            return;
        }

        // Create customer cards
        customers.forEach(customer => {
            const card = document.createElement("div");
            card.className = "customer-card";
            card.dataset.customerId = customer.CustomerID;
            
            card.innerHTML = `
                <div class="customer-card-header">
                    <span class="customer-id">ID: ${customer.CustomerID}</span>
                    <span class="payment-count">${customer.PaymentCount} Payment${customer.PaymentCount !== 1 ? 's' : ''}</span>
                </div>
                <div class="customer-name">${customer.FirstName} ${customer.LastName}</div>
                <div class="customer-business">${customer.BusinessName}</div>
                <div class="customer-stats">
                    <div class="stat-row">
                        <span class="stat-label">Total Collected:</span>
                        <span class="stat-value">₱${customer.TotalCollected}</span>
                    </div>
                    <div class="stat-row">
                        <span class="stat-label">Loan Amount:</span>
                        <span class="stat-value">₱${customer.TotalAmount}</span>
                    </div>
                </div>
                ${customer.LastPaymentDate !== "N/A" ? `<div class="last-payment">Last Payment: ${formatDate(customer.LastPaymentDate)}</div>` : ''}
            `;

            // Add click event to open modal
            card.addEventListener("click", () => {
                openCustomerHistoryModal(customer);
            });

            collectionGrid.appendChild(card);
        });

        noCollectionsMessage.style.display = "none";
        collectionGrid.style.display = "grid";
    }

    // Perform live search by name or customer ID
    function performLiveSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();

        if (!searchTerm) {
            // If search is empty, show all customers
            displayCustomers(allCustomersData);
            return;
        }

        // Filter customers based on search term (name or ID)
        const filteredCustomers = allCustomersData.filter(customer => {
            const fullName = `${customer.FirstName} ${customer.LastName}`.toLowerCase();
            const customerId = customer.CustomerID.toString().toLowerCase();

            // Match by name or customer ID
            return fullName.includes(searchTerm) || customerId.includes(searchTerm);
        });

        displayCustomers(filteredCustomers);
    }

    // Open customer history modal
    async function openCustomerHistoryModal(customer) {
        historyModal.style.display = "flex";
        modalCustomerName.textContent = `${customer.FirstName} ${customer.LastName} - Payment History`;
        modalCustomerInfo.textContent = `Customer ID: ${customer.CustomerID} | Business: ${customer.BusinessName}`;
        
        modalLoading.style.display = "block";
        modalNoPayments.style.display = "none";
        modalHistoryContainer.style.display = "none";
        historyTableBody.innerHTML = "";

        try {
            const res = await fetch(`../php/fetch_customer_payment_history.php?customerID=${customer.CustomerID}`);
            const data = await res.json();

            modalLoading.style.display = "none";

            if (!Array.isArray(data) || data.length === 0) {
                modalNoPayments.style.display = "block";
                return;
            }

            // Display payment history
            data.forEach(payment => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td>${payment.PaymentID}</td>
                    <td>₱${payment.Amount}</td>
                    <td>${formatDate(payment.PaymentDate)}</td>
                    <td>${payment.EmpName} (ID: ${payment.EmpID})</td>
                `;
                historyTableBody.appendChild(row);
            });

            modalHistoryContainer.style.display = "block";
        } catch (err) {
            modalLoading.style.display = "none";
            modalNoPayments.style.display = "block";
            modalNoPayments.textContent = `Error loading payment history: ${err.message}`;
            console.error("Error loading customer payment history:", err);
        }
    }

    // Format date from YYYY-MM-DD to readable format
    function formatDate(dateString) {
        if (!dateString || dateString === "N/A") return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    // Load collection summary on page load
    loadCollectionSummary();
});


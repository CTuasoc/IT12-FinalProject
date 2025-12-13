document.addEventListener("DOMContentLoaded", () => {
    const collectionTableBody = document.getElementById("collectionTableBody");
    const collectionTableContainer = document.getElementById("collectionTableContainer");
    const loadingMessage = document.getElementById("loadingMessage");
    const noCollectionsMessage = document.getElementById("noCollectionsMessage");
    const refreshBtn = document.getElementById("refreshBtn");
    const searchInput = document.getElementById("search");
    const paymentDateInput = document.getElementById("paymentDateFilter");

    let allCustomersData = []; // Store all customers for filtering

    // Filter variables
    let currentFilters = {
        search: "",
        status: "all",
        nameType: "both",
        sort: "name_asc",
        paymentDate: "",
    };

    // Refresh button
    refreshBtn.addEventListener("click", () => {
        loadCollectionSummary();
    });

    // Live search on input
    if (searchInput) {
        let searchTimeout;
        searchInput.addEventListener("input", () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                currentFilters.search = searchInput.value.trim();
                loadCollectionSummary();
            }, 300);
        });
    }

    // Date filter: when user picks a date, reload collection summary for that day
    if (paymentDateInput) {
        // Default to today on first load
        const todayStr = new Date().toISOString().split("T")[0];
        paymentDateInput.value = todayStr;
        currentFilters.paymentDate = todayStr;

        paymentDateInput.addEventListener("change", () => {
            currentFilters.paymentDate = paymentDateInput.value;
            loadCollectionSummary();
        });
    }

    // Initialize filter controls (copied pattern from records page)
    function initializeFilters() {
        const filterToggle = document.getElementById("filterToggle");
        const filtersPanel = document.getElementById("filtersPanel");
        const applyFiltersBtn = document.getElementById("applyFilters");
        const clearFiltersBtn = document.getElementById("clearFilters");

        if (!filterToggle || !filtersPanel) return;

        // Close modal when clicking outside
        filterToggle.addEventListener("click", (e) => {
            e.stopPropagation();
            filtersPanel.classList.toggle("show");
            filterToggle.classList.toggle("active");
        });

        document.addEventListener("click", (e) => {
            if (!filtersPanel.contains(e.target) && !filterToggle.contains(e.target)) {
                filtersPanel.classList.remove("show");
                filterToggle.classList.remove("active");
            }
        });

        if (applyFiltersBtn) {
            applyFiltersBtn.addEventListener("click", () => {
                updateCurrentFilters();
                loadCollectionSummary();
                filtersPanel.classList.remove("show");
                filterToggle.classList.remove("active");
            });
        }

        if (clearFiltersBtn) {
            clearFiltersBtn.addEventListener("click", () => {
                clearFilters();
                loadCollectionSummary();
                filtersPanel.classList.remove("show");
                filterToggle.classList.remove("active");
            });
        }
    }

    function updateCurrentFilters() {
        currentFilters.search = searchInput ? searchInput.value.trim() : "";
        const statusEl = document.querySelector('input[name="status"]:checked');
        const nameTypeEl = document.querySelector('input[name="nameType"]:checked');
        const sortEl = document.querySelector('input[name="sort"]:checked');

        if (statusEl) currentFilters.status = statusEl.value;
        if (nameTypeEl) currentFilters.nameType = nameTypeEl.value;
        if (sortEl) currentFilters.sort = sortEl.value;

        if (paymentDateInput) {
            currentFilters.paymentDate = paymentDateInput.value;
        }
    }

    function clearFilters() {
        const statusAll = document.querySelector('input[name="status"][value="all"]');
        const nameTypeBoth = document.querySelector('input[name="nameType"][value="both"]');
        const sortNameAsc = document.querySelector('input[name="sort"][value="name_asc"]');

        if (statusAll) statusAll.checked = true;
        if (nameTypeBoth) nameTypeBoth.checked = true;
        if (sortNameAsc) sortNameAsc.checked = true;

        if (searchInput) searchInput.value = "";
        if (paymentDateInput) {
            // Don't clear the date filter - keep current date
            // paymentDateInput.value = "";
        }

        currentFilters = {
            search: "",
            status: "all",
            nameType: "both",
            sort: "name_asc",
            paymentDate: paymentDateInput ? paymentDateInput.value : "",
        };
    }

    function parseNumber(value) {
        if (typeof value === "number") return value;
        if (!value) return 0;
        const num = parseFloat(String(value).replace(/,/g, ""));
        return isNaN(num) ? 0 : num;
    }

    function formatCurrency(amount) {
        const num = parseNumber(amount);
        return `₱${num.toLocaleString("en-PH", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        })}`;
    }

    // Format date from YYYY-MM-DD to readable format
    function formatDate(dateString) {
        if (!dateString || dateString === "N/A" || dateString === "0000-00-00") return "---";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("en-PH", {
            year: "numeric",
            month: "short",
            day: "numeric",
        });
    }

    // Load collection summary
    async function loadCollectionSummary() {
        try {
            loadingMessage.style.display = "block";
            collectionTableContainer.style.display = "none";
            noCollectionsMessage.style.display = "none";

            const params = new URLSearchParams();
            params.append("search", currentFilters.search);
            params.append("status", currentFilters.status);
            params.append("nameType", currentFilters.nameType);
            params.append("sort", currentFilters.sort);
            if (currentFilters.paymentDate) {
                params.append("paymentDate", currentFilters.paymentDate);
            }

            const res = await fetch(`../php/fetch_records.php?${params.toString()}`);
            const data = await res.json();

            loadingMessage.style.display = "none";
            collectionTableBody.innerHTML = "";

            if (!Array.isArray(data) || data.length === 0) {
                noCollectionsMessage.style.display = "block";
                noCollectionsMessage.textContent = currentFilters.paymentDate 
                    ? `No collections found for ${formatDate(currentFilters.paymentDate)}.`
                    : "No collection records found.";
                return;
            }

            allCustomersData = data;
            displayCustomers(data);
        } catch (err) {
            loadingMessage.style.display = "none";
            noCollectionsMessage.style.display = "block";
            noCollectionsMessage.textContent = `Error loading collection history: ${err.message}`;
            console.error("Error loading collection history:", err);
        }
    }

    // Display customers in the table
    function displayCustomers(customers) {
        // Clear existing table
        collectionTableBody.innerHTML = "";

        if (!customers || customers.length === 0) {
            noCollectionsMessage.style.display = "block";
            noCollectionsMessage.textContent = currentFilters.paymentDate 
                ? `No collections found for ${formatDate(currentFilters.paymentDate)}.`
                : "No collection records found.";
            collectionTableContainer.style.display = "none";
            return;
        }

        const today = new Date();
        const dayMs = 1000 * 60 * 60 * 24;
        const selectedDate = currentFilters.paymentDate || "";
        const selectedDateText = selectedDate ? formatDate(selectedDate) : "";

        // Filter customers who have payments on the selected date
        const customersWithPayments = customers.filter(cust => {
            if (!selectedDate) return true; // Show all if no date selected
            
            // Check if customer has a payment on the selected date
            // This assumes your backend returns a PaidOnDate field for customers who paid on that day
            return cust.PaidOnDate === true || cust.PaymentDate === selectedDate;
        });

        if (customersWithPayments.length === 0 && selectedDate) {
            noCollectionsMessage.style.display = "block";
            noCollectionsMessage.textContent = `No payments found for ${selectedDateText}.`;
            collectionTableContainer.style.display = "none";
            return;
        }

        customersWithPayments.forEach((cust) => {
            const row = document.createElement("tr");
            row.className = "record-row";

            if (cust.IsOverdue) {
                row.classList.add("overdue");
            } else if (cust.IsPaid) {
                row.classList.add("paid");
            }

            const loanAmount = parseNumber(cust.LoanAmount);
            const totalAmount = parseNumber(cust.TotalAmount);
            const perDay = parseNumber(cust.PerDay);
            const amountPaid = parseNumber(cust.AmountPaid);
            const balance = Math.max(totalAmount - amountPaid, 0);

            const interestAmount = Math.max(totalAmount - loanAmount, 0);

            let termDays = null;
            if (perDay > 0 && totalAmount > 0) {
                termDays = Math.round(totalAmount / perDay);
            }

            let daysRemaining = null;
            if (perDay > 0 && balance > 0) {
                daysRemaining = Math.ceil(balance / perDay);
            } else if (balance <= 0) {
                daysRemaining = 0;
            }

            let termsText = "---";
            if (termDays !== null) {
                if (daysRemaining !== null && daysRemaining > 0) {
                    termsText = `${termDays} days (${daysRemaining} days remaining)`;
                } else if (daysRemaining === 0) {
                    termsText = `${termDays} days (Paid)`;
                } else {
                    termsText = `${termDays} days`;
                }
            }

            let loanDateText = "---";
            if (cust.DueDate && termDays !== null) {
                const dueDate = new Date(cust.DueDate);
                if (!isNaN(dueDate.getTime())) {
                    const loanDate = new Date(dueDate.getTime() - termDays * dayMs);
                    loanDateText = formatDate(loanDate.toISOString().split("T")[0]);
                }
            }

            const statusBadges = `
                ${cust.IsOverdue ? '<span class="status-badge overdue-badge">OVERDUE</span>' : ""}
                ${cust.IsPaid ? '<span class="status-badge paid-badge">PAID</span>' : ""}
            `;

            // Amount paid on the selected date (NEW: Changed from Daily Payment to Amount Paid Today)
            let amountPaidToday = "---";
            if (selectedDate && cust.PaidOnDate) {
                amountPaidToday = cust.AmountPaidOnDate ? formatCurrency(cust.AmountPaidOnDate) : formatCurrency(perDay);
            } else if (selectedDate) {
                amountPaidToday = "₱0.00";
            }

            // Payment status for the selected date (NEW: Changed from Action to Payment Status)
            let paymentStatus = "---";
            let paymentStatusClass = "";
            
            if (selectedDate) {
                if (cust.PaidOnDate) {
                    paymentStatus = "PAID";
                    paymentStatusClass = "paid-status";
                } else {
                    paymentStatus = "NOT PAID";
                    paymentStatusClass = "not-paid-status";
                }
            }

            row.innerHTML = `
                <td><strong>${cust.FirstName} ${cust.LastName}</strong></td>
                <td>${loanDateText}</td>
                <td>${formatCurrency(loanAmount)}</td>
                <td>${formatCurrency(interestAmount)}</td>
                <td>${amountPaidToday} ${statusBadges}</td>
                <td><span class="payment-status ${paymentStatusClass}">${paymentStatus}</span></td>
            `;

            collectionTableBody.appendChild(row);
        });

        noCollectionsMessage.style.display = "none";
        collectionTableContainer.style.display = "block";
    }

    // Initial setup
    initializeFilters();
    // Load collection summary on page load
    loadCollectionSummary();
});
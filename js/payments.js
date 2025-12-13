document.addEventListener("DOMContentLoaded", () => {
    const customersTableBody = document.getElementById("customersTableBody");
    const customersTableContainer = document.getElementById("customersTableContainer");
    const loadingMessage = document.getElementById("loadingMessage");
    const noCustomersMessage = document.getElementById("noCustomersMessage");
    const refreshBtn = document.getElementById("refreshBtn");
    const searchInput = document.getElementById("searchInput");
    const paymentModal = document.getElementById("paymentModal");
    const closeModal = document.getElementById("closeModal");
    const cancelPayment = document.getElementById("cancelPayment");
    const paymentForm = document.getElementById("paymentForm");
    const todayDateElement = document.getElementById("todayDate");
    const customAmountCheckbox = document.getElementById("customAmountCheckbox");
    const customAmountGroup = document.getElementById("customAmountGroup");
    const customAmountInput = document.getElementById("customAmount");
    const modalCustomerName = document.getElementById("modalCustomerName");
    
    const modalRemainingBalance = document.getElementById("modalRemainingBalance");
    const modalDailyPayment = document.getElementById("modalDailyPayment");
    const modalTerms = document.getElementById("modalTerms");
    const alreadyPaidMessage = document.getElementById("alreadyPaidMessage");
    const proceedPayment = document.getElementById("proceedPayment");

    let allCustomers = [];
    let currentCustomer = null;
    let today = new Date().toISOString().split('T')[0];

    // Set today's date
    const todayFormatted = new Date().toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    todayDateElement.textContent = `Today: ${todayFormatted}`;

    // Event Listeners
    if (refreshBtn) refreshBtn.addEventListener("click", loadCustomers);
    if (closeModal) closeModal.addEventListener("click", () => paymentModal.style.display = "none");
    if (cancelPayment) cancelPayment.addEventListener("click", () => paymentModal.style.display = "none");
    if (customAmountCheckbox) customAmountCheckbox.addEventListener("change", toggleCustomAmount);
    
    window.addEventListener("click", (e) => {
        if (e.target === paymentModal) paymentModal.style.display = "none";
    });

    // Search functionality
    if (searchInput) {
        searchInput.addEventListener("input", () => {
            filterCustomers(searchInput.value.trim().toLowerCase());
        });
    }

    // Payment form submission
    if (paymentForm) {
        paymentForm.addEventListener("submit", async (e) => {
            e.preventDefault();
            await processPayment();
        });
    }

    // Handle custom amount input changes
    if (customAmountInput) {
        customAmountInput.addEventListener('input', updatePaymentInfo);
    }

    // Handle row clicks in table
    customersTableBody.addEventListener("click", (e) => {
        const row = e.target.closest('tr');
        if (row && !e.target.closest('.pay-btn')) {
            const customerID = row.dataset.customerId;
            showPaymentModal(customerID);
        }
        
        const payButton = e.target.closest('.pay-btn');
        if (payButton) {
            const customerID = payButton.dataset.customerId;
            showPaymentModal(customerID);
        }
    });

    // Toggle custom amount input
    function toggleCustomAmount() {
        if (customAmountCheckbox.checked) {
            customAmountGroup.style.display = 'block';
            customAmountInput.focus();
        } else {
            customAmountGroup.style.display = 'none';
            customAmountInput.value = '';
        }
        updatePaymentInfo();
    }

    // Update payment info text - removed display of amount to be paid
    function updatePaymentInfo() {
        // Function kept for compatibility but no longer displays amount
    }

    // Show payment modal
    async function showPaymentModal(customerID) {
        const customer = allCustomers.find(c => c.CustomerID == customerID);
        if (!customer) return;

        currentCustomer = customer;
        
        // Check if already paid today
        const alreadyPaidToday = await checkIfPaidToday(customerID);
        
        // Populate modal fields
        modalCustomerName.textContent = customer.CustomerName;
        // Removed display of payment date, total loan amount, and amount paid per request
        modalRemainingBalance.textContent = `₱${parseFloat(customer.RemainingBalance).toFixed(2)}`;
        modalDailyPayment.textContent = `₱${parseFloat(customer.DailyPayment).toFixed(2)}`;
        
        // Calculate and display terms
        const termsText = calculateTermsText(customer);
        modalTerms.textContent = termsText;
        
        // Reset form
        customAmountCheckbox.checked = false;
        customAmountGroup.style.display = 'none';
        customAmountInput.value = '';
        customAmountInput.placeholder = `Enter amount (₱${customer.DailyPayment} is daily payment)`;
        updatePaymentInfo();
        
        // Show/hide appropriate sections
        if (alreadyPaidToday || customer.RemainingBalance <= 0) {
            alreadyPaidMessage.style.display = 'block';
            proceedPayment.disabled = true;
            if (customer.RemainingBalance <= 0) {
                proceedPayment.textContent = 'Loan Fully Paid';
                alreadyPaidMessage.innerHTML = '<div class="already-paid-box">This loan is fully paid.</div>';
            } else {
                proceedPayment.textContent = 'Already Paid Today';
                alreadyPaidMessage.innerHTML = '<div class="already-paid-box">This customer has already paid today.</div>';
            }
        } else {
            alreadyPaidMessage.style.display = 'none';
            proceedPayment.disabled = false;
            proceedPayment.textContent = 'Proceed with Payment';
        }
        
        // Show modal
        paymentModal.style.display = "flex";
    }

    // Calculate terms text
    function calculateTermsText(customer) {
        const dailyPayment = parseFloat(customer.DailyPayment);
        if (!dailyPayment || dailyPayment <= 0) {
            return "No terms available";
        }
        
        const totalAmount = parseFloat(customer.TotalAmount);
        const amountPaid = parseFloat(customer.AmountPaid);
        
        const totalTerms = Math.ceil(totalAmount / dailyPayment);
        const paidTerms = Math.floor(amountPaid / dailyPayment);
        const remainingTerms = Math.max(0, totalTerms - paidTerms);
        
        if (remainingTerms > 0) {
            return `${totalTerms} days (${remainingTerms} days remaining)`;
        } else {
            return `${totalTerms} days (Fully Paid)`;
        }
    }

    // Check if customer has already paid today
    async function checkIfPaidToday(customerID) {
        try {
            const formData = new FormData();
            formData.append('customerID', customerID);
            formData.append('checkDate', today);

            const res = await fetch('../php/check_daily_payment.php', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                console.error('Check payment failed:', res.status);
                return false;
            }

            const data = await res.json();
            return data.alreadyPaid || false;
        } catch (error) {
            console.error('Error checking daily payment:', error);
            return false;
        }
    }

    // Process payment
    async function processPayment() {
        if (!currentCustomer) return;

        const amount = getPaymentAmount();
        if (amount <= 0 || isNaN(amount)) {
            showNotification('Please enter a valid amount', 'error');
            return;
        }

        // Validate amount doesn't exceed remaining balance
        if (amount > currentCustomer.RemainingBalance) {
            showNotification(`Amount exceeds remaining balance of ₱${currentCustomer.RemainingBalance.toFixed(2)}`, 'error');
            return;
        }

        // Disable proceed button during processing
        proceedPayment.disabled = true;
        const originalText = proceedPayment.textContent;
        proceedPayment.textContent = 'Processing...';

        try {
            const formData = new FormData();
            formData.append('customerID', currentCustomer.CustomerID);
            formData.append('amount', amount);
            formData.append('paymentDate', today);
            formData.append('isCustomAmount', customAmountCheckbox.checked ? '1' : '0');

            const res = await fetch('../php/record_daily_payment.php', {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                throw new Error(`HTTP error! status: ${res.status}`);
            }

            const data = await res.json();
            
            if (data.success) {
                // Close modal and refresh customer list
                paymentModal.style.display = "none";
                await loadCustomers();
                
                if (data.isFullyPaid) {
                    showNotification(`${currentCustomer.CustomerName} has fully paid their loan!`, 'success');
                } else {
                    showNotification(`Payment of ₱${amount.toFixed(2)} recorded successfully!`, 'success');
                }
            } else {
                showNotification(data.message || 'Failed to record payment', 'error');
            }
        } catch (error) {
            console.error('Error processing payment:', error);
            showNotification('Network error: ' + error.message, 'error');
        } finally {
            proceedPayment.disabled = false;
            proceedPayment.textContent = originalText;
        }
    }

    // Get payment amount based on checkbox
    function getPaymentAmount() {
        if (customAmountCheckbox.checked && customAmountInput.value) {
            return parseFloat(customAmountInput.value);
        }
        return parseFloat(currentCustomer.DailyPayment);
    }

    // Filter customers based on search input
    function filterCustomers(searchTerm) {
        if (!searchTerm) {
            displayCustomers(allCustomers);
            return;
        }

        const filtered = allCustomers.filter(customer => 
            customer.CustomerName.toLowerCase().includes(searchTerm) ||
            (customer.FirstName && customer.FirstName.toLowerCase().includes(searchTerm)) ||
            (customer.LastName && customer.LastName.toLowerCase().includes(searchTerm)) ||
            (customer.BusinessName && customer.BusinessName.toLowerCase().includes(searchTerm))
        );
        displayCustomers(filtered);
    }

    // Display customers in table - SIMPLE VERSION
    function displayCustomers(customers) {
        customersTableBody.innerHTML = "";

        if (customers.length === 0) {
            noCustomersMessage.style.display = "block";
            noCustomersMessage.textContent = "No customers found.";
            customersTableContainer.style.display = "none";
            return;
        }

        noCustomersMessage.style.display = "none";
        customersTableContainer.style.display = "block";

        customers.forEach(customer => {
            const row = document.createElement("tr");
            row.dataset.customerId = customer.CustomerID;
            row.style.cursor = 'pointer';
            
            // SIMPLE STATUS: Only check if paid today
            const isPaidToday = customer.PaidToday;
            const statusClass = isPaidToday ? "status-paid" : "status-unpaid";
            const statusText = isPaidToday ? "Paid" : "Unpaid";
            
            // Check if loan is fully paid
            const isFullyPaid = customer.RemainingBalance <= 0;
            const isDisabled = isPaidToday || isFullyPaid;
            const payButtonText = isFullyPaid ? "Fully Paid" : (isPaidToday ? "Already Paid" : "Pay Today");
            
            row.innerHTML = `
                <td>${customer.CustomerName}</td>
                <td><span class="status-badge ${statusClass}">${statusText}</span></td>
                <td>
                    <button class="pay-btn ${isDisabled ? 'disabled' : ''}" 
                            data-customer-id="${customer.CustomerID}"
                            ${isDisabled ? 'disabled' : ''}>
                        ${payButtonText}
                    </button>
                </td>
            `;
            customersTableBody.appendChild(row);
        });
    }

    // Fetch and display customers
    async function loadCustomers() {
        try {
            loadingMessage.style.display = "block";
            loadingMessage.textContent = "Loading customers...";
            customersTableContainer.style.display = "none";
            noCustomersMessage.style.display = "none";

            const res = await fetch("../php/fetch_daily_customers.php");
            
            if (!res.ok) {
                const errorText = await res.text();
                console.error('Server returned error:', res.status, errorText.substring(0, 200));
                throw new Error(`Server error: ${res.status}`);
            }

            let data;
            try {
                data = await res.json();
            } catch (parseError) {
                const text = await res.text();
                console.error('Invalid JSON response:', text.substring(0, 200));
                throw new Error('Invalid server response format');
            }

            loadingMessage.style.display = "none";

            if (data.error) {
                throw new Error(data.error);
            }

            if (data.customers !== undefined) {
                allCustomers = data.customers;
            } else if (Array.isArray(data)) {
                allCustomers = data;
            } else if (data.success === false) {
                throw new Error(data.message || 'Unknown error');
            } else {
                throw new Error('Invalid data format received');
            }

            if (allCustomers.length === 0) {
                noCustomersMessage.style.display = "block";
                noCustomersMessage.textContent = "No customers found.";
                return;
            }

            displayCustomers(allCustomers);

        } catch (err) {
            console.error("Error loading customers:", err);
            loadingMessage.style.display = "none";
            noCustomersMessage.style.display = "block";
            noCustomersMessage.textContent = `Error: ${err.message}`;
            showNotification(`Failed to load customers: ${err.message}`, 'error');
        }
    }

    // Show notification
    function showNotification(message, type = 'info') {
        const existingNotification = document.querySelector('.notification');
        if (existingNotification) {
            existingNotification.remove();
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, 5000);
    }

    // Initialize
    loadCustomers();
});
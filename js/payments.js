document.addEventListener("DOMContentLoaded", () => {
    const paymentTableBody = document.getElementById("paymentTableBody");
    const paymentTableContainer = document.getElementById("paymentTableContainer");
    const loadingMessage = document.getElementById("loadingMessage");
    const noPaymentsMessage = document.getElementById("noPaymentsMessage");
    const recordPaymentBtn = document.getElementById("recordPaymentBtn");
    const paymentModal = document.getElementById("paymentModal");
    const closeModal = document.getElementById("closeModal");
    const cancelBtn = document.getElementById("cancelBtn");
    const paymentForm = document.getElementById("paymentForm");
    const customerSelect = document.getElementById("customerSelect");
    const customerInfo = document.getElementById("customerInfo");
    const paymentAmount = document.getElementById("paymentAmount");
    const paymentDate = document.getElementById("paymentDate");
    const formMessage = document.getElementById("formMessage");
    const refreshBtn = document.getElementById("refreshBtn");

    // Set today's date as default
    paymentDate.value = new Date().toISOString().split('T')[0];

    // Open payment modal
    recordPaymentBtn.addEventListener("click", () => {
        loadCustomers();
        paymentModal.classList.add("show");
        document.body.classList.add("modal-open");
        paymentForm.reset();
        paymentDate.value = new Date().toISOString().split('T')[0];
        customerInfo.style.display = "none";
        formMessage.textContent = "";
        formMessage.className = "form-message";
    });

    // Close modal
    closeModal.addEventListener("click", closePaymentModal);
    cancelBtn.addEventListener("click", closePaymentModal);
    
    // Close modal when clicking outside
    paymentModal.addEventListener("click", (e) => {
        if (e.target === paymentModal) {
            closePaymentModal();
        }
    });

    function closePaymentModal() {
        paymentModal.classList.remove("show");
        document.body.classList.remove("modal-open");
        paymentForm.reset();
        customerInfo.style.display = "none";
        formMessage.textContent = "";
        formMessage.className = "form-message";
    }

    // Load customers for dropdown
    async function loadCustomers() {
        try {
            const res = await fetch("../php/fetch_customers.php");
            const data = await res.json();

            customerSelect.innerHTML = '<option value="">-- Select Customer --</option>';
            
            if (Array.isArray(data) && data.length > 0) {
                data.forEach(customer => {
                    const option = document.createElement("option");
                    option.value = customer.CustomerID;
                    option.textContent = `${customer.CustomerID} - ${customer.FirstName} ${customer.LastName} (${customer.BusinessName})`;
                    option.dataset.total = customer.TotalAmount;
                    option.dataset.paid = customer.AmountPaid;
                    option.dataset.balance = customer.Balance;
                    customerSelect.appendChild(option);
                });
            }
        } catch (err) {
            showFormMessage("Error loading customers: " + err.message, "error");
        }
    }

    // Format number with commas and 2 decimal places
    function formatNumber(number) {
        // If it's already a formatted string with commas, remove them for parsing
        if (typeof number === 'string') {
            number = number.replace(/,/g, '');
        }
        const num = parseFloat(number);
        if (isNaN(num)) return '0.00';
        
        return num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
    }

    // Format input as user types
    paymentAmount.addEventListener('input', function(e) {
        // Get the current cursor position
        const cursorPosition = e.target.selectionStart;
        
        // Remove all non-digit characters except decimal point
        let value = this.value.replace(/[^\d.]/g, '');
        
        // Remove extra decimal points
        const decimalCount = (value.match(/\./g) || []).length;
        if (decimalCount > 1) {
            value = value.substring(0, value.lastIndexOf('.'));
        }
        
        // Format the number with commas
        if (value) {
            // If there's a decimal, format the integer part
            if (value.includes('.')) {
                const parts = value.split('.');
                parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
                // Limit decimal places to 2
                if (parts[1]) {
                    parts[1] = parts[1].substring(0, 2);
                }
                value = parts.join('.');
            } else {
                value = value.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
        }
        
        // Update the input value
        this.value = value;
        
        // Restore the cursor position (approximate)
        const newCursorPosition = cursorPosition + (this.value.length - (e.target.value.length || 0));
        this.setSelectionRange(newCursorPosition, newCursorPosition);
    });

    // Update customer info when customer is selected
    customerSelect.addEventListener("change", () => {
        const selectedOption = customerSelect.options[customerSelect.selectedIndex];
        if (selectedOption.value) {
            // Format the values for display
            document.getElementById("infoTotalAmount").textContent = "₱" + formatNumber(selectedOption.dataset.total);
            document.getElementById("infoAmountPaid").textContent = "₱" + formatNumber(selectedOption.dataset.paid);
            
            // Store the raw balance value (without formatting) in a data attribute
            const rawBalance = selectedOption.dataset.balance;
            document.getElementById("infoBalance").textContent = "₱" + formatNumber(rawBalance);
            document.getElementById("infoBalance").setAttribute('data-raw-balance', rawBalance);
            
            const balance = parseFloat(rawBalance);
            document.getElementById("infoBalance").className = balance > 0 ? "info-value balance-amount" : "info-value balance-amount paid";
            customerInfo.style.display = "block";
        } else {
            customerInfo.style.display = "none";
        }
    });

    // Handle form submission with improved UX
    paymentForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const submitButton = paymentForm.querySelector("button[type='submit']");
        const customerID = customerSelect.value;
        // Remove commas before parsing to ensure correct float conversion
        const amount = parseFloat(paymentAmount.value.replace(/,/g, ''));
        const selectedOption = customerSelect.options[customerSelect.selectedIndex];

        // Get the raw balance from a data attribute for accuracy
        const rawBalance = document.getElementById("infoBalance").getAttribute('data-raw-balance') || selectedOption.dataset.balance;
        const balance = parseFloat(rawBalance.replace(/,/g, ''));

        // --- Client-Side Validation ---
        if (!customerID) {
            showFormMessage("Please select a customer.", "error");
            return;
        }

        if (isNaN(amount) || amount <= 0) {
            showFormMessage("Please enter a valid payment amount greater than zero.", "error");
            return;
        }

        // Check if payment exceeds the remaining balance
        if (amount > balance) {
            showFormMessage(`Payment cannot exceed the remaining balance of ₱${formatNumber(balance)}.`, "error");
            return;
        }

        // --- Form Submission ---
        const formData = new FormData();
        formData.append("customerID", customerID);
        formData.append("amount", amount);

        try {
            // Disable button and show processing message to prevent multiple clicks
            submitButton.disabled = true;
            submitButton.textContent = "Processing...";
            showFormMessage("Submitting your payment, please wait...", "info");

            // Use the new, optimized endpoint
            const res = await fetch("../php/process_payment_optimized.php", {
                method: "POST",
                body: formData
            });

            const data = await res.json();

            if (data.success) {
                showFormMessage(data.message, "success");
                // Automatically close modal and refresh table after a short delay
                setTimeout(() => {
                    closePaymentModal();
                    loadPaymentHistory(); // Refresh the main payment history table
                }, 1200);
            } else {
                // Show specific error message from the server
                showFormMessage(data.message || "An unknown error occurred.", "error");
            }

        } catch (err) {
            // Handle network errors or other exceptions
            showFormMessage("A network error occurred: " + err.message, "error");
        } finally {
            // Re-enable the button regardless of success or failure
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = "Record Payment";
            }
        }
    });

    // Show form message
    function showFormMessage(message, type) {
        formMessage.textContent = message;
        formMessage.className = `form-message ${type}`;
    }

    // Refresh button
    refreshBtn.addEventListener("click", () => {
        loadPaymentHistory();
    });

    // Fetch and display payment history
    async function loadPaymentHistory() {
        try {
            loadingMessage.style.display = "block";
            paymentTableContainer.style.display = "none";
            noPaymentsMessage.style.display = "none";

            const res = await fetch("../php/fetch_payment_history.php");
            const data = await res.json();

            loadingMessage.style.display = "none";

            if (!Array.isArray(data) || data.length === 0) {
                noPaymentsMessage.style.display = "block";
                return;
            }

            // Clear existing table rows
            paymentTableBody.innerHTML = "";
            let lastCustomerId = null;

            // Data is now pre-sorted by the server (CustomerID, then PaymentID)
            data.forEach(payment => {
                const row = document.createElement("tr");

                // Add a visual separator when the CustomerID changes
                if (payment.CustomerID !== lastCustomerId && lastCustomerId !== null) {
                    row.classList.add("customer-group-start");
                }

                row.innerHTML = `
                    <td>${payment.PaymentID}</td>
                    <td>${payment.CustomerID}</td>
                    <td>${payment.FirstName} ${payment.LastName}</td>
                    <td>${payment.BusinessName}</td>
                    <td>₱${payment.Amount}</td>
                    <td>${formatDate(payment.PaymentDate)}</td>
                    <td>${payment.EmpID}</td>
                `;
                paymentTableBody.appendChild(row);

                lastCustomerId = payment.CustomerID;
            });

            paymentTableContainer.style.display = "block";
        } catch (err) {
            loadingMessage.style.display = "none";
            noPaymentsMessage.style.display = "block";
            noPaymentsMessage.textContent = `Error loading payment history: ${err.message}`;
            console.error("Error loading payment history:", err);
        }
    }

    // Format date from YYYY-MM-DD to readable format
    function formatDate(dateString) {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString;
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "short",
            day: "numeric"
        });
    }

    // Load payment history on page load
    loadPaymentHistory();
});

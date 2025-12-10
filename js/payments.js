document.addEventListener("DOMContentLoaded", () => {
    const paymentTableBody = document.getElementById("paymentTableBody");
    const paymentTableContainer = document.getElementById("paymentTableContainer");
    const loadingMessage = document.getElementById("loadingMessage");
    const noPaymentsMessage = document.getElementById("noPaymentsMessage");
    const refreshBtn = document.getElementById("refreshBtn");

    // Refresh button
    if (refreshBtn) {
        refreshBtn.addEventListener("click", () => {
            loadPaymentHistory();
        });
    }

    // Handle action button clicks (event delegation)
    paymentTableBody.addEventListener("click", async (e) => {
        const target = e.target;
        if (target.classList.contains("paid-btn")) {
            const customerID = target.dataset.customerId;
            // Disable the button to prevent duplicate clicks
            target.disabled = true;
            const originalText = target.textContent;
            target.textContent = 'Processing...';

            try {
                const formData = new FormData();
                formData.append('customerID', customerID);
                formData.append('action', 'paid');

                const res = await fetch('../php/mark_payment.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await res.json();
                if (data.success) {
                    // Refresh the table to reflect increased Terms and AmountPaid
                    loadPaymentHistory();
                } else {
                    console.error('mark_payment failed', data.message);
                    alert(data.message || 'Failed to record payment');
                }
            } catch (err) {
                console.error('Network error marking paid:', err);
                alert('Network error: ' + err.message);
            } finally {
                target.disabled = false;
                target.textContent = originalText;
            }

        } else if (target.classList.contains("pass-btn")) {
            const customerID = target.dataset.customerId;
            // PASS does not create a payment record; we still call endpoint to acknowledge
            target.disabled = true;
            const originalText = target.textContent;
            target.textContent = 'Saving...';

            try {
                const formData = new FormData();
                formData.append('customerID', customerID);
                formData.append('action', 'pass');

                const res = await fetch('../php/mark_payment.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await res.json();
                if (data.success) {
                    // No change to Terms, but we can optionally refresh UI
                    loadPaymentHistory();
                } else {
                    console.error('mark_payment pass failed', data.message);
                    alert(data.message || 'Failed to mark pass');
                }
            } catch (err) {
                console.error('Network error marking pass:', err);
                alert('Network error: ' + err.message);
            } finally {
                target.disabled = false;
                target.textContent = originalText;
            }
        }
    });

    // Fetch and display payment history
    async function loadPaymentHistory() {
        try {
            loadingMessage.style.display = "block";
            paymentTableContainer.style.display = "none";
            noPaymentsMessage.style.display = "none";

            const res = await fetch("../php/fetch_payment_history.php");

            // If server returns non-2xx, or non-JSON, try to surface the response for debugging
            const contentType = res.headers.get('content-type') || '';
            if (!res.ok) {
                // Try to get body text for more context (could be HTML error page)
                const text = await res.text();
                console.error('fetch_payment_history.php returned HTTP', res.status, res.statusText);
                console.error('Response body:', text);
                loadingMessage.style.display = "none";
                noPaymentsMessage.style.display = "block";
                noPaymentsMessage.textContent = `Error loading payment history: server returned ${res.status}`;
                return;
            }

            if (!contentType.includes('application/json')) {
                // Unexpected content type (likely HTML). Read it and show helpful message.
                const text = await res.text();
                console.error('Expected JSON but received:', contentType);
                console.error('Response body (first 1000 chars):', text.substring(0, 1000));
                loadingMessage.style.display = "none";
                noPaymentsMessage.style.display = "block";
                noPaymentsMessage.textContent = 'Error loading payment history: invalid server response (see console)';
                return;
            }

            const data = await res.json();

            loadingMessage.style.display = "none";

            if (!Array.isArray(data) || data.length === 0) {
                noPaymentsMessage.style.display = "block";
                return;
            }

            // Clear existing table rows
            paymentTableBody.innerHTML = "";

            // Display customer records with new columns
            data.forEach(customer => {
                const row = document.createElement("tr");
                
                row.innerHTML = `
                    <td>${customer.CustomerName}</td>
                    <td>${formatDate(customer.DateOfLoan)}</td>
                    <td>₱${customer.Principal}</td>
                    <td>₱${customer.Interest}</td>
                    <td>${customer.Terms}</td>
                    <td>₱${customer.DailyPayment}</td>
                    <td class="action-cell">
                        <button class="action-btn paid-btn" data-customer-id="${customer.CustomerID}" title="Mark as PAID">PAID</button>
                        <button class="action-btn pass-btn" data-customer-id="${customer.CustomerID}" title="Mark as PASS">PASS</button>
                    </td>
                `;
                paymentTableBody.appendChild(row);
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

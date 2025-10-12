document.addEventListener("DOMContentLoaded", () => {
  const recordsDiv = document.getElementById("records");
  const searchInput = document.getElementById("search");
  const deleteBtn = document.getElementById("deleteBtn");
  const addFormMsg = document.getElementById("formMessage");
  let currentCustomerID = null;

  // Helper: display message
  function showMessage(message, color = "black") {
    addFormMsg.style.color = color;
    addFormMsg.textContent = message;
  }

  // Fetch and display all records
  async function loadRecords() {
    try {
      const res = await fetch("../php/fetch_records.php");
      const data = await res.json();

      recordsDiv.innerHTML = "";

      if (!Array.isArray(data) || data.length === 0) {
        recordsDiv.innerHTML = "<p>No customer records found.</p>";
        return;
      }

      data.forEach(cust => {
        const card = document.createElement("div");
        card.className = "record-card";
        card.innerHTML = `
          <div class="record-header">
            <p class="Name">${cust.FirstName} ${cust.LastName}</p>
            <button class="display" data-id="${cust.CustomerID}">Display</button>
          </div>
          <div class="details">
            <div class="record-detail">
              <p class="desc">Amount</p>
              <p class="info">${cust.LoanAmount}</p>
            </div>
            <div class="record-detail">
              <p class="desc">Balance</p>
              <p class="info">${cust.LoanBalance}</p>
            </div>
          </div>
        `;
        recordsDiv.appendChild(card);
      });

      attachDisplayEvents();
      showMessage(""); // clear messages after load
    } catch (err) {
      showMessage(`Error loading records: ${err.message}`, "red");
    }
  }

  // Attach display button events
  function attachDisplayEvents() {
    document.querySelectorAll(".display").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
        currentCustomerID = id;
        const res = await fetch(`../php/fetch_customer.php?id=${id}`);
        const cust = await res.json();

        if (!cust.error) {
          document.getElementById("cust-name").textContent = cust.FirstName + " " + cust.LastName;
          document.getElementById("cust-business").textContent = cust.BusinessName;
          document.getElementById("cust-phone").textContent = cust.PhoneNum;
          document.getElementById("cust-address").textContent = cust.Address;
          document.getElementById("cust-amount").textContent = cust.LoanAmount;
          document.getElementById("cust-total").textContent = cust.TotalAmount;
          document.getElementById("cust-balance").textContent = (cust.TotalAmount - cust.AmountPaid).toFixed(2);
          document.getElementById("cust-duedate").textContent = cust.DueDate;
          const amountPaid = parseFloat(cust.AmountPaid) || 0;
          document.getElementById("cust-payment").textContent = amountPaid.toFixed(2);
          showMessage("Customer loaded successfully.", "green");
        } else {
          showMessage("Error loading customer.", "red");
        }
      });
    });
  }

  // Admin-only delete with password confirmation
  if (typeof isAdmin !== "undefined" && isAdmin) {
    deleteBtn.style.display = "inline-block";
    deleteBtn.addEventListener("click", async () => {
      if (!currentCustomerID) {
        showMessage("Please select a customer first.", "red");
        return;
      }

      const password = prompt("Enter your password to confirm deletion:");
      if (!password) {
        showMessage("Deletion canceled. No password entered.", "red");
        return;
      }

      const res = await fetch("delete_customer.php", {

        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${encodeURIComponent(currentCustomerID)}&password=${encodeURIComponent(password)}`
      });

      const data = await res.json();

      if (data.success) {
        showMessage(data.message, "green");
        loadRecords();
      } else {
        showMessage(data.message, "red");
      }
    });
  }

  // Search filter
  searchInput.addEventListener("input", () => {
    const term = searchInput.value.toLowerCase();
    document.querySelectorAll(".record-card").forEach(card => {
      const name = card.querySelector(".Name").textContent.toLowerCase();
      card.style.display = name.includes(term) ? "block" : "none";
    });
  });

  loadRecords();
});

document.addEventListener("DOMContentLoaded", () => {
  const recordsDiv = document.getElementById("records");
  const searchInput = document.getElementById("search");

  // Fetch and display all records
  async function loadRecords() {
    try {
      const res = await fetch("../php/fetch_records.php");
      const data = await res.json();

      recordsDiv.innerHTML = ""; // Clear previous content

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
    } catch (err) {
      recordsDiv.innerHTML = `<p>Error loading records: ${err.message}</p>`;
    }
  }

  // Attach display button events
  function attachDisplayEvents() {
    document.querySelectorAll(".display").forEach(btn => {
      btn.addEventListener("click", async () => {
        const id = btn.dataset.id;
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
          document.getElementById("cust-payment").textContent = `${amountPaid.toFixed(2)}`;
        }
      });
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
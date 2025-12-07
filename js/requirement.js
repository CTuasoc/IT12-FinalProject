// ../js/requirement.js  (Full features: Add / Edit / Delete / Search / View)
document.addEventListener("DOMContentLoaded", () => {
    // --- DOM refs ---
    const listBtn = document.getElementById("listBtn");
    const addBtn = document.getElementById("addBtn");
    const customerListSection = document.getElementById("customerListSection");
    const addCustomerSection = document.getElementById("addCustomerSection");
    const customerTableBody = document.getElementById("customerTableBody");
    const addCustomerForm = document.getElementById("addCustomerForm");
    const formMessage = document.getElementById("formMessage");
    const searchBar = document.getElementById("searchBar");
  
    // dynamic sections
    let editSection = null;
    let viewSection = null;
  
    // data
    let customers = [];
    const fullName = (c) => `${c.FirstName || ""} ${c.LastName || ""}`.trim();
  
    // --- helper: build API URL relative to current page's directory (robust) ---
    const api = (file) => {
      // window.location.pathname might be like "/IT12-FinalProject/php/requirement.php"
      // Remove last component and append file
      const base = window.location.pathname.replace(/[^\/]*$/, "");
      return `${base}${file}`;
    };
  
    const escapeHtml = (s) =>
      String(s || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
  
    const showSection = (name) => {
      [customerListSection, addCustomerSection, editSection, viewSection].forEach(
        (s) => {
          if (s) s.style.display = "none";
        }
      );
      if (name === "list") customerListSection.style.display = "block";
      else if (name === "add") addCustomerSection.style.display = "block";
      else if (name === "edit" && editSection) editSection.style.display = "block";
      else if (name === "view" && viewSection) viewSection.style.display = "block";
    };
  
    // --- Fetch customers ---
    async function fetchCustomers() {
      try {
        const res = await fetch(api("fetch_customer_req.php"), { cache: "no-store" });
        const data = await res.json();
        if (!data.success) throw new Error(data.message || "Failed to fetch customers");
        customers = data.customers || [];
        renderTable();
      } catch (err) {
        console.error("fetchCustomers error:", err);
        customerTableBody.innerHTML =
          `<tr><td colspan="6" style="text-align:center;color:#f55">Failed to load data.</td></tr>`;
      }
    }
  
    // --- Render customers table with search/filter ---
    function renderTable() {
      const q = (searchBar.value || "").trim().toLowerCase();
  
      const filtered = customers.filter((c) => {
        if (!c) return false;
        const name = fullName(c).toLowerCase();
        const business = (c.BusinessName || "").toLowerCase();
        const phone = (c.PhoneNumber || "").toLowerCase();
        const address = (c.Address || "").toLowerCase();
        const status = (c.Status || "").toLowerCase();
        return (
          name.includes(q) ||
          business.includes(q) ||
          phone.includes(q) ||
          address.includes(q) ||
          status.includes(q)
        );
      });
  
      if (filtered.length === 0) {
        customerTableBody.innerHTML =
          `<tr><td colspan="6" style="text-align:center;">No customers found.</td></tr>`;
        return;
      }
  
      customerTableBody.innerHTML = filtered
        .map((c) => {
          const statusClass = (c.Status || "").toLowerCase() === "pending" ? "status-bad" : "status-good";
          return `
            <tr data-id="${c.ApplicationID}">
              <td>${escapeHtml(fullName(c))}</td>
              <td>${escapeHtml(c.BusinessName)}</td>
              <td>${escapeHtml(c.PhoneNumber)}</td>
              <td>${escapeHtml(c.Address)}</td>
              <td><span class="status-badge ${statusClass}">${escapeHtml(c.Status)}</span></td>
              <td class="operation">
                <button class="operation-btn send-btn" data-id="${c.ApplicationID}">Send</button>
                <button class="operation-btn edit-btn" data-id="${c.ApplicationID}">Edit</button>
                <button class="operation-btn delete-btn" data-id="${c.ApplicationID}">Delete</button>
             </td>          
            </tr>
          `;
        })
        .join("");
    }
  
    // --- Add: toggle handlers ---
    listBtn.addEventListener("click", () => {
      showSection("list");
      formMessage.style.display = "none";
      fetchCustomers();
    });
  
    addBtn.addEventListener("click", () => {
      showSection("add");
      formMessage.style.display = "none";
      if (addCustomerForm) addCustomerForm.reset();
    });
  
    // --- Add: submit via AJAX ---
    if (addCustomerForm) {
      addCustomerForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        formMessage.style.display = "block";
        formMessage.style.color = "#fff";
        formMessage.textContent = "Adding...";
        try {
          const res = await fetch(api("add_customer_req.php"), {
            method: "POST",
            body: new FormData(addCustomerForm),
          });
          const data = await res.json();
          if (data.success) {
            formMessage.style.color = "lightgreen";
            formMessage.textContent = data.message || "Customer added successfully!";
            addCustomerForm.reset();
            await fetchCustomers();
            // go back to list
            showSection("list");
          } else {
            formMessage.style.color = "red";
            formMessage.textContent = data.message || "Add failed.";
          }
        } catch (err) {
          console.error("Add customer error:", err);
          formMessage.style.color = "red";
          formMessage.textContent = "Request failed.";
        }
      });
    }
  
    // --- Delegated click handlers for View / Edit / Delete ---
    document.body.addEventListener("click", async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
  
      // Delete
      if (btn.classList.contains("delete-btn")) {
        const id = btn.dataset.id;
        if (!confirm("Are you sure you want to permanently delete this customer?")) return;
        try {
          const res = await fetch(api("delete_customer_req.php"), {
            method: "POST",
            body: new URLSearchParams({ id }),
          });
          const data = await res.json();
          if (data.success) {
            // remove from local array
            customers = customers.filter((c) => String(c.ApplicationID) !== String(id));
            renderTable();
            alert("Customer deleted.");
          } else {
            alert("Delete failed: " + (data.message || ""));
          }
        } catch (err) {
          console.error("Delete error:", err);
          alert("Delete request failed.");
        }
        return;
      }
  
      // View
      if (btn.classList.contains("view-btn")) {
        const id = btn.dataset.id;
        const customer = customers.find((c) => String(c.ApplicationID) === String(id));
        if (!customer) return alert("Customer not found.");
        createOrShowViewSection(customer);
        return;
      }
  
      // SEND notification to admin
      if (btn.classList.contains("send-btn")) {
        const id = btn.dataset.id;
        if (!id) return alert("No customer selected for sending.");
        if (!confirm("Send notification to admin that this customer needs approval?")) return;
        
        fetch(api("send_customer_notification.php"), {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `id=${encodeURIComponent(id)}`,
        })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            alert("Notification sent to admin!");
          } else {
            alert("Failed to notify admin: " + (data.message || ""));
          }
        })
        .catch((err) => {
          alert("Request error, please try again.");
          console.error("Send notification error:", err);
        });
        return;
      }
  
      // Edit
      if (btn.classList.contains("edit-btn")) {
        const id = btn.dataset.id;
        const customer = customers.find((c) => String(c.ApplicationID) === String(id));
        if (!customer) return alert("Customer not found.");
        createOrShowEditSection(customer);
        return;
      }
    });
  
    // --- Search input ---
    if (searchBar) {
      searchBar.addEventListener("input", renderTable);
    }
  
    // --- Create / Show View section ---
    function createOrShowViewSection(customer) {
      if (!viewSection) {
        viewSection = document.createElement("div");
        viewSection.className = "content-section";
        viewSection.id = "viewSection";
        document.querySelector(".customer-container").appendChild(viewSection);
      }
  
      viewSection.innerHTML = `
        <h2>View Customer</h2>
        <div style="margin-bottom:10px;">
          <strong>Name:</strong> ${escapeHtml(fullName(customer))}<br/>
          <strong>Business Name:</strong> ${escapeHtml(customer.BusinessName)}<br/>
          <strong>Phone Number:</strong> ${escapeHtml(customer.PhoneNumber)}<br/>
          <strong>Address:</strong> ${escapeHtml(customer.Address)}<br/>
          <strong>Status:</strong> ${escapeHtml(customer.Status)}<br/>
        </div>
        <div>
          <button id="viewBackBtn" class="operation-btn">Back</button>
        </div>
      `;
      showSection("view");
  
      // back button
      viewSection.querySelector("#viewBackBtn").addEventListener("click", () => {
        showSection("list");
      });
    }
  
    // --- Create / Show Edit section ---
    function createOrShowEditSection(customer) {
      if (!editSection) {
        editSection = document.createElement("div");
        editSection.className = "content-section";
        editSection.id = "editSection";
        document.querySelector(".customer-container").appendChild(editSection);
      }
  
      editSection.innerHTML = `
        <h2>Edit Customer</h2>
        <form id="editCustomerForm" class="add-customer">
          <input type="hidden" name="id" value="${escapeHtml(customer.ApplicationID)}" />
          <div class="form-group">
            <label>First Name</label>
            <input type="text" name="first_name" value="${escapeHtml(customer.FirstName)}" required>
          </div>
          <div class="form-group">
            <label>Last Name</label>
            <input type="text" name="last_name" value="${escapeHtml(customer.LastName)}" required>
          </div>
          <div class="form-group">
            <label>Business Name</label>
            <input type="text" name="business_name" value="${escapeHtml(customer.BusinessName)}" required>
          </div>
          <div class="form-group">
            <label>Phone Number</label>
            <input type="text" name="phone_number" value="${escapeHtml(customer.PhoneNumber)}" required>
          </div>
          <div class="form-group">
            <label>Address</label>
            <input type="text" name="address" value="${escapeHtml(customer.Address)}" required>
          </div>
          <div class="form-group">
            <label>Status</label>
            <select name="status" required>
              <option value="Pending" ${customer.Status === "Pending" ? "selected" : ""}>Pending</option>
              <option value="Approved" ${customer.Status === "Approved" ? "selected" : ""}>Approved</option>
              <option value="Rejected" ${customer.Status === "Rejected" ? "selected" : ""}>Rejected</option>
              <option value="Archived" ${customer.Status === "Archived" ? "selected" : ""}>Archived</option>
            </select>
          </div>
          <div style="margin-top:10px;">
            <button type="submit" class="operation-btn">Update</button>
            <button type="button" id="editCancelBtn" class="operation-btn">Cancel</button>
          </div>
          <p id="editFormMessage" style="margin-top:8px;"></p>
        </form>
      `;
  
      showSection("edit");
  
      const form = editSection.querySelector("#editCustomerForm");
      const msg = editSection.querySelector("#editFormMessage");
      const cancelBtn = editSection.querySelector("#editCancelBtn");
  
      cancelBtn.addEventListener("click", () => {
        showSection("list");
      });
  
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        msg.style.color = "#fff";
        msg.textContent = "Updating...";
        try {
          const res = await fetch(api("update_customer_req.php"), {
            method: "POST",
            body: new FormData(form),
          });
          const data = await res.json();
          if (data.success) {
            msg.style.color = "lightgreen";
            msg.textContent = data.message || "Updated!";
            // update local copy
            const idx = customers.findIndex((c) => String(c.ApplicationID) === String(form.id.value));
            if (idx > -1) {
              customers[idx] = {
                ...customers[idx],
                FirstName: form.first_name.value,
                LastName: form.last_name.value,
                BusinessName: form.business_name.value,
                PhoneNumber: form.phone_number.value,
                Address: form.address.value,
                Status: form.status.value,
              };
            }
            renderTable();
            setTimeout(() => showSection("list"), 600);
          } else {
            msg.style.color = "red";
            msg.textContent = data.message || "Update failed.";
          }
        } catch (err) {
          console.error("Update error:", err);
          msg.style.color = "red";
          msg.textContent = "Request failed.";
        }
      });
    }
  
    // --- Initial load ---
    fetchCustomers();
  });
  
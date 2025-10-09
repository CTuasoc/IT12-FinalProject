// ../js/loginstatus.js
document.addEventListener("DOMContentLoaded", () => {
  // --- DOM refs ---
  const membersSection = document.getElementById("membersSection");
  const addSection = document.getElementById("addSection");
  const employeeTableBody = document.getElementById("employeeTableBody");
  const totalEmployeesEl = document.getElementById("totalEmployees");
  const activeEmployeesEl = document.getElementById("activeEmployees");
  const searchInput = document.getElementById("searchInput");
  const addForm = document.getElementById("addEmployeeForm");
  const addFormMsg = document.getElementById("formMessage");
  const chips = Array.from(document.querySelectorAll(".chip"));
  const sidebarTabs = Array.from(document.querySelectorAll(".tab"));

  let editSection = null;
  let historySection = null;
  let employees = [];
  let deptFilter = "collectors"; // default

  // --- helper functions ---
  const escapeHtml = (s) =>
    String(s || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");

  const showSection = (name) => {
    [membersSection, addSection, editSection, historySection].forEach((s) => {
      if (s) s.style.display = "none";
    });
    if (name === "members") membersSection.style.display = "block";
    else if (name === "add") addSection.style.display = "block";
    else if (name === "edit" && editSection) editSection.style.display = "block";
    else if (name === "history" && historySection) historySection.style.display = "block";
  };

  // --- FETCH EMPLOYEES ---
  async function fetchEmployees() {
    try {
      const res = await fetch("../php/fetch_employees.php", { cache: "no-store" });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || "Failed to fetch employees.");
      employees = data.data || [];
      renderTable();
      updateStats();
      populateHistorySelect();
    } catch (err) {
      console.error("fetchEmployees error:", err);
      employeeTableBody.innerHTML =
        `<tr><td colspan="7" style="text-align:center;color:#f88">Failed to load employees</td></tr>`;
    }
  }

  // --- FILTERING LOGIC (fixed) ---
  function filterByDept(emp) {
    const d = Number(emp.DeptID);
    if (deptFilter === "collectors") return d === 3; // Collectors only
    if (deptFilter === "office") return d === 1 || d === 2; // Admins + Secretaries
    return true;
  }

  // --- RENDER EMPLOYEE TABLE ---
  function renderTable() {
    const q = searchInput.value.trim().toLowerCase();
    const filtered = employees.filter(
      (e) =>
        filterByDept(e) &&
        ((e.FullName || "").toLowerCase().includes(q) ||
          (e.Email || "").toLowerCase().includes(q) ||
          (e.DeptName || "").toLowerCase().includes(q))
    );

    if (filtered.length === 0) {
      employeeTableBody.innerHTML =
        `<tr><td colspan="7" style="text-align:center;">No employees found.</td></tr>`;
      return;
    }

    employeeTableBody.innerHTML = filtered
      .map((emp) => {
        const badge =
          emp.Status === "Active"
            ? `<span class="badge-success">Active</span>`
            : `<span class="badge-error">Inactive</span>`;
        return `
        <tr data-empid="${emp.EmpID}">
          <td>${escapeHtml(emp.FullName)}</td>
          <td>${escapeHtml(emp.DeptName)}</td>
          <td>${escapeHtml(emp.Email)}</td>
          <td>${emp.TimeIn || "--"}</td>
          <td>${emp.TimeOut || "--"}</td>
          <td>${badge}</td>
          <td class="ops">
            <button class="icon btn-view-history" data-empid="${emp.EmpID}">📅</button>
            <button class="icon btn-edit" data-empid="${emp.EmpID}">✏️</button>
            <button class="icon btn-delete" data-empid="${emp.EmpID}">🗑️</button>
          </td>
        </tr>`;
      })
      .join("");
  }

  function updateStats() {
    const byDept = employees.filter(filterByDept);
    totalEmployeesEl.textContent = byDept.length;
    activeEmployeesEl.textContent = byDept.filter((e) => e.Status === "Active").length;
  }

  // --- POPULATE HISTORY SELECT ---
  function populateHistorySelect() {
    if (!historySection) return;
    const sel = historySection.querySelector("#historyEmpSelect");
    if (!sel) return;
    sel.innerHTML = employees
      .filter(filterByDept)
      .map(
        (e) =>
          `<option value="${e.EmpID}">${escapeHtml(
            e.FullName || e.Email || "Employee " + e.EmpID
          )}</option>`
      )
      .join("");
  }

  // --- SEARCH ---
  searchInput.addEventListener("input", renderTable);

  // --- SIDEBAR TAB SWITCH (Collectors / Office) ---
  sidebarTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      sidebarTabs.forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      deptFilter =
        tab.dataset.tab === "admins" || tab.dataset.tab === "office"
          ? "office"
          : "collectors";
      renderTable();
      updateStats();
    });
  });

  // --- TOP CHIPS SWITCH (Members / Add New) ---
  chips.forEach((chip) => {
    chip.addEventListener("click", () => {
      chips.forEach((c) => c.classList.remove("active"));
      chip.classList.add("active");
      showSection(chip.dataset.content || "members");
    });
  });

  // --- ADD EMPLOYEE FORM ---
  addForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    addFormMsg.style.color = "#fff";
    addFormMsg.textContent = "Adding...";
    try {
      const res = await fetch("../php/add_employee.php", {
        method: "POST",
        body: new FormData(addForm),
      });
      const data = await res.json();
      if (data.success) {
        addFormMsg.style.color = "lightgreen";
        addFormMsg.textContent = "Employee added!";
        addForm.reset();
        await fetchEmployees();
        chips.forEach((c) => c.classList.remove("active"));
        document.querySelector('.chip[data-content="members"]').classList.add("active");
        showSection("members");
      } else {
        addFormMsg.style.color = "red";
        addFormMsg.textContent = data.message || "Add failed.";
      }
    } catch (err) {
      console.error("Add error:", err);
      addFormMsg.style.color = "red";
      addFormMsg.textContent = "Request failed.";
    }
  });

  // --- DELEGATED BUTTON ACTIONS ---
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    // View Login History
    if (btn.classList.contains("btn-view-history")) {
      const empid = btn.dataset.empid;
      if (!historySection) createHistorySection();
      const sel = historySection.querySelector("#historyEmpSelect");
      sel.value = empid;
      showSection("history");
      return;
    }

    // Load History
    if (btn.id === "historyLoadBtn") {
      const sel = historySection.querySelector("#historyEmpSelect");
      const month = historySection.querySelector("#historyMonth").value;
      const tbody = historySection.querySelector("#historyTableBody");
      if (!month) return alert("Please select a month.");
      tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Loading...</td></tr>`;
      try {
        const res = await fetch(
          `../php/fetch_login_history.php?empid=${sel.value}&month=${month}`
        );
        const data = await res.json();
        if (data.success && data.data.length) {
          tbody.innerHTML = data.data
            .map(
              (r) =>
                `<tr><td>${r.LogDate}</td><td>${r.TimeIn || "--"}</td><td>${
                  r.TimeOut || "--"
                }</td></tr>`
            )
            .join("");
        } else {
          tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">No records found.</td></tr>`;
        }
      } catch (err) {
        tbody.innerHTML = `<tr><td colspan="3" style="text-align:center;">Failed to load.</td></tr>`;
      }
      return;
    }

    // Back from History
    if (btn.id === "historyBackBtn") {
      showSection("members");
      return;
    }

    // Edit Employee
    if (btn.classList.contains("btn-edit")) {
      const empid = btn.dataset.empid;
      const emp = employees.find((e) => e.EmpID == empid);
      if (emp) showEditSection(emp);
      return;
    }

    // Delete Employee
    if (btn.classList.contains("btn-delete")) {
      const empid = btn.dataset.empid;
      if (!confirm("Are you sure you want to delete this employee?")) return;
      try {
        const res = await fetch("../php/delete_employee.php", {
          method: "POST",
          body: new URLSearchParams({ empid }),
        });
        const data = await res.json();
        if (data.success) {
          await fetchEmployees();
        } else {
          alert("Delete failed.");
        }
      } catch (err) {
        console.error("Delete error:", err);
      }
      return;
    }

    // Cancel Edit
    if (btn.id === "editCancelBtn") {
      showSection("members");
      return;
    }
  });

  // --- CREATE HISTORY SECTION ---
  function createHistorySection() {
    historySection = document.createElement("div");
    historySection.id = "historySection";
    historySection.className = "content-section";
    historySection.innerHTML = `
      <h2>Login History</h2>
      <div style="display:flex;gap:8px;align-items:center;margin-top:10px;">
        <select id="historyEmpSelect" style="flex:1"></select>
        <input id="historyMonth" type="month" />
        <button id="historyLoadBtn" class="btn">Load</button>
        <button id="historyBackBtn" class="btn">Back</button>
      </div>
      <div class="table-wrap" style="margin-top:12px;">
        <table class="data-table">
          <thead><tr><th>Date</th><th>Time In</th><th>Time Out</th></tr></thead>
          <tbody id="historyTableBody"><tr><td colspan="3" style="text-align:center;">Select filters to view history.</td></tr></tbody>
        </table>
      </div>`;
    document.querySelector(".content").appendChild(historySection);
    populateHistorySelect();
  }

  // --- CREATE EDIT SECTION ---
  function showEditSection(emp) {
    if (!editSection) {
      editSection = document.createElement("div");
      editSection.id = "editSection";
      editSection.className = "content-section";
      document.querySelector(".content").appendChild(editSection);
    }

    editSection.innerHTML = `
      <h2>Edit Employee</h2>
      <form id="editEmployeeForm" class="add-employee">
        <input type="hidden" name="empid" value="${emp.EmpID}">
        <div class="form-group">
          <label>First Name</label>
          <input type="text" name="firstname" value="${escapeHtml(emp.FirstName || "")}" required>
        </div>
        <div class="form-group">
          <label>Last Name</label>
          <input type="text" name="lastname" value="${escapeHtml(emp.LastName || "")}" required>
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" name="email" value="${escapeHtml(emp.Email || "")}" required>
        </div>
        <div class="form-group">
          <label>Department</label>
          <select name="deptid" required>
            <option value="">Select Department</option>
            <option value="1" ${emp.DeptID == 1 ? "selected" : ""}>Admin</option>
            <option value="2" ${emp.DeptID == 2 ? "selected" : ""}>Secretary</option>
            <option value="3" ${emp.DeptID == 3 ? "selected" : ""}>Collector</option>
          </select>
        </div>
        <div style="margin-top:8px;">
          <button type="submit" class="btn">Update</button>
          <button type="button" id="editCancelBtn" class="btn" style="margin-left:8px;">Cancel</button>
        </div>
        <p id="editFormMessage" style="margin-top:8px;"></p>
      </form>`;

    showSection("edit");
    const form = editSection.querySelector("#editEmployeeForm");
    const msg = editSection.querySelector("#editFormMessage");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      msg.style.color = "#fff";
      msg.textContent = "Updating...";
      try {
        const res = await fetch("../php/update_employee.php", {
          method: "POST",
          body: new FormData(form),
        });
        const data = await res.json();
        if (data.success) {
          msg.style.color = "lightgreen";
          msg.textContent = "Employee updated!";
          await fetchEmployees();
          setTimeout(() => showSection("members"), 700);
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

  // --- INITIAL LOAD ---
  fetchEmployees();
});

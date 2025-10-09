// ../js/loginstatus.js
document.addEventListener("DOMContentLoaded", () => {
  const membersSection = document.getElementById("membersSection");
  const addSection = document.getElementById("addSection");
  const editSection = document.getElementById("editSection"); // NEW
  const historySection = document.getElementById("historySection"); // NEW

  const chips = document.querySelectorAll(".chip");
  const sidebarTabs = document.querySelectorAll(".tab");
  const searchInput = document.getElementById("searchInput");
  const form = document.getElementById("addEmployeeForm");
  const formMsg = document.getElementById("formMessage");
  const editForm = document.getElementById("editEmployeeForm");
  const editMsg = document.getElementById("editMessage");
  const tableBody = document.getElementById("employeeTableBody");
  const totalEmployeesEl = document.getElementById("totalEmployees");
  const activeEmployeesEl = document.getElementById("activeEmployees");

  // History dropdowns
  const historyMonthSelect = document.getElementById("historyMonth");
  const historyYearSelect = document.getElementById("historyYear");
  const historyTableBody = document.getElementById("historyTableBody");

  let employees = [];
  let currentEditingID = null;
  let deptFilter = "collectors";

  // Normalize department tab
  function normalizeTab(raw) {
    raw = raw.toLowerCase();
    if (raw.includes("office")) return "office";
    if (raw.includes("collectors")) return "collectors";
    return "collectors";
  }

  // Fetch employees
  async function fetchEmployees() {
    try {
      const res = await fetch("../php/fetch_employees.php");
      const data = await res.json();
      if (!data.success) throw new Error(data.message);
      employees = data.data || [];
      renderTable();
    } catch (err) {
      console.error("Error fetching employees:", err);
      tableBody.innerHTML = `<tr><td colspan="7">Failed to load employees.</td></tr>`;
    }
  }

  // Render employee table
  function renderTable() {
    const q = (searchInput.value || "").trim().toLowerCase();

    const filteredDept = employees.filter(emp => {
      const dep = Number(emp.DeptID);
      if (deptFilter === "collectors") return dep === 3;
      if (deptFilter === "office") return dep === 1 || dep === 2;
      return false;
    });

    const filtered = filteredDept.filter(emp => {
      const name = (emp.FullName || "").toLowerCase();
      const email = (emp.Email || "").toLowerCase();
      const dept = (emp.DeptName || "").toLowerCase();
      return !q || name.includes(q) || email.includes(q) || dept.includes(q);
    });

    totalEmployeesEl.textContent = filteredDept.length;
    activeEmployeesEl.textContent = filteredDept.filter(e => e.Status === "Active").length;

    tableBody.innerHTML = filtered.length
      ? filtered.map(emp => `
        <tr>
          <td>${escapeHtml(emp.FullName)}</td>
          <td>${escapeHtml(emp.DeptName)}</td>
          <td>${escapeHtml(emp.Email)}</td>
          <td>${emp.TimeIn || "--"}</td>
          <td>${emp.TimeOut || "--"}</td>
          <td><span class="${emp.Status === "Active" ? "badge-success" : "badge-error"}">${emp.Status}</span></td>
          <td class="ops">
            <button class="icon view-history" data-id="${emp.EmpID}">📅</button>
            <button class="icon edit-emp" data-id="${emp.EmpID}">✏️</button>
            <button class="icon delete-emp" data-id="${emp.EmpID}">🗑️</button>
          </td>
        </tr>
      `).join("")
      : `<tr><td colspan="7" style="text-align:center; padding:18px;">No employees found.</td></tr>`;
  }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Sidebar switching (Collectors / Office Workers)
  sidebarTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      sidebarTabs.forEach(t => t.classList.remove("active"));
      tab.classList.add("active");
      deptFilter = normalizeTab(tab.dataset.tab);
      renderTable();
    });
  });

  // Top chips (Members / Add New / History / Edit)
  chips.forEach(chip => {
    chip.addEventListener("click", () => {
      chips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");

      const type = chip.dataset.content;
      [membersSection, addSection, editSection, historySection].forEach(sec => sec.style.display = "none");

      if (type === "members") membersSection.style.display = "block";
      else if (type === "add") addSection.style.display = "block";
      else if (type === "edit") editSection.style.display = "block";
      else if (type === "history") historySection.style.display = "block";
    });
  });

  searchInput.addEventListener("input", renderTable);

  // Add new employee
  form?.addEventListener("submit", async e => {
    e.preventDefault();
    formMsg.textContent = "Adding employee...";
    try {
      const formData = new FormData(form);
      const res = await fetch("../php/add_employee.php", { method: "POST", body: formData });
      const data = await res.json();

      if (data.success) {
        formMsg.style.color = "lightgreen";
        formMsg.textContent = "Employee added successfully!";
        form.reset();
        await fetchEmployees();
        showSection("members");
      } else throw new Error(data.message);
    } catch (err) {
      console.error(err);
      formMsg.style.color = "red";
      formMsg.textContent = "Error adding employee.";
    }
  });

  // Helper to switch section
  function showSection(name) {
    [membersSection, addSection, editSection, historySection].forEach(sec => sec.style.display = "none");
    if (name === "members") membersSection.style.display = "block";
    if (name === "add") addSection.style.display = "block";
    if (name === "edit") editSection.style.display = "block";
    if (name === "history") historySection.style.display = "block";
  }

  // View login history (container)
  document.addEventListener("click", async e => {
    if (e.target.classList.contains("view-history")) {
      const empid = e.target.dataset.id;
      showSection("history");

      // Fill dropdowns (month/year)
      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear - i);
      historyYearSelect.innerHTML = years.map(y => `<option value="${y}">${y}</option>`).join("");
      historyMonthSelect.innerHTML = Array.from({ length: 12 }, (_, i) => {
        const m = i + 1;
        return `<option value="${m.toString().padStart(2, "0")}">${m.toString().padStart(2, "0")}</option>`;
      }).join("");

      async function loadHistory() {
        const year = historyYearSelect.value;
        const month = historyMonthSelect.value;
        const ym = `${year}-${month}`;
        const res = await fetch(`../php/fetch_login_history.php?empid=${empid}&month=${ym}`);
        const data = await res.json();

        if (data.success) {
          historyTableBody.innerHTML = data.data.length
            ? data.data.map(row => `
              <tr>
                <td>${row.LogDate}</td>
                <td>${row.TimeIn || "--"}</td>
                <td>${row.TimeOut || "--"}</td>
              </tr>
            `).join("")
            : `<tr><td colspan="3" style="text-align:center;">No records.</td></tr>`;
        } else {
          historyTableBody.innerHTML = `<tr><td colspan="3">${data.message}</td></tr>`;
        }
      }

      historyMonthSelect.onchange = loadHistory;
      historyYearSelect.onchange = loadHistory;
      loadHistory();
    }
  });

  // Edit employee
  document.addEventListener("click", e => {
    if (e.target.classList.contains("edit-emp")) {
      const emp = employees.find(x => x.EmpID === e.target.dataset.id);
      if (!emp) return;
      currentEditingID = emp.EmpID;
      showSection("edit");

      editForm.firstname.value = emp.FullName.split(" ")[0] || "";
      editForm.lastname.value = emp.FullName.split(" ")[1] || "";
      editForm.email.value = emp.Email || "";
      editForm.deptid.value = emp.DeptID || "";
    }
  });

  editForm?.addEventListener("submit", async e => {
    e.preventDefault();
    if (!currentEditingID) return;
    editMsg.textContent = "Updating employee...";

    try {
      const formData = new FormData(editForm);
      formData.append("empid", currentEditingID);
      const res = await fetch("../php/update_employee.php", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        editMsg.style.color = "lightgreen";
        editMsg.textContent = "Employee updated successfully!";
        await fetchEmployees();
        showSection("members");
      } else throw new Error(data.message);
    } catch (err) {
      console.error(err);
      editMsg.style.color = "red";
      editMsg.textContent = "Error updating employee.";
    }
  });

  // Delete employee
  document.addEventListener("click", async e => {
    if (e.target.classList.contains("delete-emp")) {
      const empid = e.target.dataset.id;
      if (!confirm("Are you sure you want to delete this employee?")) return;

      const formData = new FormData();
      formData.append("empid", empid);
      const res = await fetch("../php/delete_employee.php", { method: "POST", body: formData });
      const data = await res.json();
      if (data.success) {
        alert("Employee deleted!");
        await fetchEmployees();
      } else {
        alert("Error: " + data.message);
      }
    }
  });

  // Initial load
  fetchEmployees();
});

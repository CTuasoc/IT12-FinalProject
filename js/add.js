document.addEventListener("DOMContentLoaded", () => {
  const loanAmountInput = document.getElementById("loanamount");
  const dueDateInput = document.getElementById("duedate");
  const totalAmountInput = document.getElementById("totalamount");
  const perDayInput = document.getElementById("perday");
  const addForm = document.getElementById("addForm");
  const addFormMsg = document.getElementById("formMessage");

  // Calculate loan details
  function calculateLoan() {
    const loanAmount = parseFloat(loanAmountInput.value) || 0;
    const interestRate = 0.05; // 5%

    // Total with interest
    const totalAmount = loanAmount + (loanAmount * interestRate);
    totalAmountInput.value = totalAmount > 0 ? totalAmount.toFixed(2) : "";

    // Per Day (based on due date)
    const dueDate = new Date(dueDateInput.value);
    const today = new Date();

    if (dueDate > today && loanAmount > 0) {
      const diffTime = dueDate - today;
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      perDayInput.value = (totalAmount / days).toFixed(2);
    } else {
      perDayInput.value = "";
    }
  }

  loanAmountInput.addEventListener("input", calculateLoan);
  dueDateInput.addEventListener("change", calculateLoan);

  // Handle form submit with AJAX
  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(addForm);

      fetch("../php/add.php", {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            addFormMsg.style.color = "lightgreen";
            addFormMsg.textContent = "Account Added Successfully!";

            // Reset form
            addForm.reset();
            totalAmountInput.value = "";
            perDayInput.value = "";

            // Refresh records if available
            if (typeof loadRecords === "function") {
              loadRecords();
            }
          } else {
            alert("Error: " + data.message);
          }
        })
        .catch((err) => {
          alert("Request failed: " + err);
        });
    });
  }
});

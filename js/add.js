document.addEventListener("DOMContentLoaded", () => {
  const loanAmountInput = document.getElementById("loanamount");
  const dueDateInput = document.getElementById("duedate");
  const totalAmountInput = document.getElementById("totalamount");
  const perDayInput = document.getElementById("perday");
  const phoneInput = document.querySelector('input[name="phonenum"]');
  const addForm = document.getElementById("addForm");
  const addFormMsg = document.getElementById("formMessage");

  // Notification function
  function showNotification(message, type = 'success') {
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
      existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    notification.innerHTML = `
      <span class="notification-message">${message}</span>
      <button class="notification-close" onclick="this.parentElement.remove()">&times;</button>
    `;
    
    const container = document.getElementById('notificationContainer');
    if (container) {
      container.appendChild(notification);
    } else {
      // Fallback: append to body
      document.body.appendChild(notification);
    }
    
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

  // Phone number validation function
  function validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    
    if (cleaned.length !== 11) {
      return false;
    }
    
    if (!cleaned.startsWith('09')) {
      return false;
    }
    
    return cleaned;
  }

  // Format phone number as 0992-524-5958
  function formatPhoneNumber(phoneDigits) {
    let formatted = '';
    if (phoneDigits.length > 0) {
      formatted = phoneDigits.slice(0, 4);
      if (phoneDigits.length > 4) {
        formatted += '-' + phoneDigits.slice(4, 7);
      }
      if (phoneDigits.length > 7) {
        formatted += '-' + phoneDigits.slice(7, 11);
      }
    }
    return formatted;
  }

  // Real-time phone number formatting
  if (phoneInput) {
    phoneInput.addEventListener('input', function(e) {
      let digits = e.target.value.replace(/\D/g, '');
      
      if (digits.length > 11) {
        digits = digits.slice(0, 11);
      }
      
      e.target.value = formatPhoneNumber(digits);
      
      // Visual feedback
      const isValid = validatePhoneNumber(digits);
      if (isValid && digits.length === 11) {
        e.target.style.borderColor = 'green';
        e.target.style.borderWidth = '2px';
      } else if (digits.length > 0 && digits.length !== 11) {
        e.target.style.borderColor = 'red';
        e.target.style.borderWidth = '2px';
      } else {
        e.target.style.borderColor = '';
        e.target.style.borderWidth = '';
      }
    });

    phoneInput.addEventListener('blur', function(e) {
      const digits = e.target.value.replace(/\D/g, '');
      if (digits.length > 0 && digits.length !== 11) {
        e.target.style.borderColor = 'red';
        e.target.style.borderWidth = '2px';
      }
    });
  }

  // Populate form with customer data if available
  if (typeof window.customerData !== 'undefined' && window.customerData) {
    if (window.customerData.firstname) {
      document.querySelector('input[name="firstname"]').value = window.customerData.firstname;
    }
    if (window.customerData.lastname) {
      document.querySelector('input[name="lastname"]').value = window.customerData.lastname;
    }
    if (window.customerData.businessname) {
      document.querySelector('input[name="businessname"]').value = window.customerData.businessname;
    }
    if (window.customerData.phonenum) {
      const phone = window.customerData.phonenum.replace(/\D/g, '');
      if (phone.length === 11) {
        document.querySelector('input[name="phonenum"]').value = formatPhoneNumber(phone);
      } else {
        document.querySelector('input[name="phonenum"]').value = window.customerData.phonenum;
      }
    }
    if (window.customerData.address) {
      document.querySelector('input[name="address"]').value = window.customerData.address;
    }
  }

  function calculateLoan() {
    const loanAmount = parseFloat(loanAmountInput.value) || 0;
    const interestRate = 0.05;

    const totalAmount = loanAmount + (loanAmount * interestRate);
    totalAmountInput.value = totalAmount > 0 ? totalAmount.toFixed(2) : "";

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

  if (loanAmountInput) loanAmountInput.addEventListener("input", calculateLoan);
  if (dueDateInput) dueDateInput.addEventListener("change", calculateLoan);

  if (addForm) {
    addForm.addEventListener("submit", (e) => {
      e.preventDefault();

      // Client-side validation
      const phoneValue = document.querySelector('input[name="phonenum"]').value.replace(/\D/g, '');
      const addressValue = document.querySelector('input[name="address"]').value;
      
      if (!validatePhoneNumber(phoneValue)) {
        showNotification("Please enter a valid 11-digit phone number starting with 09 (e.g., 0992-524-5958)", "error");
        document.querySelector('input[name="phonenum"]').focus();
        return;
      }
      
      if (!addressValue || addressValue.trim().length < 5) {
        showNotification("Please enter a valid address (minimum 5 characters)", "error");
        document.querySelector('input[name="address"]').focus();
        return;
      }

      const formData = new FormData(addForm);
      formData.set('phonenum', phoneValue);

      fetch("../php/add.php", {
        method: "POST",
        body: formData,
      })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          showNotification("Account Added Successfully!", "success");
          
          addForm.reset();
          totalAmountInput.value = "";
          perDayInput.value = "";
          
          if (phoneInput) {
            phoneInput.style.borderColor = '';
            phoneInput.style.borderWidth = '';
          }
          
          if (addFormMsg) {
            addFormMsg.textContent = "";
          }
          
          if (typeof loadRecords === "function") {
            loadRecords();
          }
        } else {
          showNotification("Error: " + data.message, "error");
        }
      })
      .catch((err) => {
        showNotification("Request failed: " + err.message, "error");
      });
    });
  }
  
  // Initialize validation styling
  if (phoneInput) {
    const initialPhoneDigits = phoneInput.value.replace(/\D/g, '');
    if (initialPhoneDigits.length > 0) {
      if (validatePhoneNumber(initialPhoneDigits)) {
        phoneInput.style.borderColor = 'green';
        phoneInput.style.borderWidth = '2px';
      } else {
        phoneInput.style.borderColor = 'red';
        phoneInput.style.borderWidth = '2px';
      }
    }
  }
  // Add smooth scrolling for mobile
  document.querySelectorAll('input').forEach(input => {
      input.addEventListener('focus', function() {
          if (window.innerWidth <= 768) {
              setTimeout(() => {
                  this.scrollIntoView({ behavior: 'smooth', block: 'center' });
              }, 300);
          }
      });
  });

  // Prevent zoom on input focus for mobile
  document.querySelectorAll('input[type="number"]').forEach(input => {
      input.addEventListener('focus', function() {
          if (window.innerWidth <= 768) {
              this.style.fontSize = '16px';
          }
      });
  });
});

document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('searchInput');
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');
    
    // Populate year dropdown
    populateYearDropdown();
    
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            filterTable();
        });
    }
    
    if (monthFilter) {
        monthFilter.addEventListener('change', function() {
            filterTable();
        });
    }
    
    if (yearFilter) {
        yearFilter.addEventListener('change', function() {
            filterTable();
        });
    }
});

function populateYearDropdown() {
    const yearFilter = document.getElementById('yearFilter');
    const table = document.querySelector('.collection-list table');
    const rows = table.querySelectorAll('tbody tr');
    const years = new Set();
    
    // Extract years from table data
    rows.forEach(row => {
        const dateCell = row.querySelector('td:nth-child(3)');
        if (dateCell) {
            const dateText = dateCell.textContent.trim();
            const year = dateText.split('-')[0];
            if (year) {
                years.add(year);
            }
        }
    });
    
    // Sort years in descending order
    const sortedYears = Array.from(years).sort().reverse();
    
    // Add years to dropdown
    sortedYears.forEach(year => {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        yearFilter.appendChild(option);
    });
}

function filterTable() {
    const searchInput = document.getElementById('searchInput');
    const monthFilter = document.getElementById('monthFilter');
    const yearFilter = document.getElementById('yearFilter');
    const table = document.querySelector('.collection-list table');
    const rows = table.querySelectorAll('tbody tr');
    
    const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
    const selectedMonth = monthFilter ? monthFilter.value : '';
    const selectedYear = yearFilter ? yearFilter.value : '';
    
    rows.forEach(row => {
        const customerName = row.querySelector('td:first-child').textContent.toLowerCase();
        const dateCell = row.querySelector('td:nth-child(3)').textContent.trim();
        
        // Check if customer name matches
        const nameMatch = customerName.includes(searchTerm);
        
        // Check if date matches
        let dateMatch = true;
        if (selectedMonth || selectedYear) {
            const dateParts = dateCell.split('-');
            const rowYear = dateParts[0];
            const rowMonth = dateParts[1];
            
            if (selectedMonth && selectedYear) {
                dateMatch = rowMonth === selectedMonth && rowYear === selectedYear;
            } else if (selectedMonth) {
                dateMatch = rowMonth === selectedMonth;
            } else if (selectedYear) {
                dateMatch = rowYear === selectedYear;
            }
        }
        
        // Show row only if both filters match
        if (nameMatch && dateMatch) {
            row.style.display = '';
        } else {
            row.style.display = 'none';
        }
    });
}

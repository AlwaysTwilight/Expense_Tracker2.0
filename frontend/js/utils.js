// Utility functions

ExpenseTracker.prototype.addWarningStyles = function() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .animate-pulse {
            animation: pulse 2s infinite;
        }
    `;
    document.head.appendChild(styleElement);
};

ExpenseTracker.prototype.formatDate = function(date) {
    try {
        const d = new Date(date);
        
        switch(this.settings.dateFormat) {
            case 'mm/dd/yyyy':
                return `${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getDate().toString().padStart(2, '0')}/${d.getFullYear()}`;
            case 'yyyy-mm-dd':
                return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
            case 'dd/mm/yyyy':
            default:
                return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
        }
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid Date';
    }
};

ExpenseTracker.prototype.formatDateForFilename = function(date) {
    try {
        const d = new Date(date);
        return `${d.getFullYear()}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getDate().toString().padStart(2, '0')}`;
    } catch (error) {
        console.error('Error formatting date for filename:', error);
        return 'invalid-date';
    }
};

ExpenseTracker.prototype.showToast = function(message, type = 'info') {
    try {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;
        
        const toastId = 'toast-' + Date.now();
        const toast = document.createElement('div');
        toast.className = `toast show`;
        toast.id = toastId;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'assertive');
        toast.setAttribute('aria-atomic', 'true');
        
        // Set background color based on type
        let bgClass = 'bg-primary';
        let icon = 'info-circle';
        
        switch(type) {
            case 'success':
                bgClass = 'bg-success';
                icon = 'check-circle';
                break;
            case 'warning':
                bgClass = 'bg-warning text-dark';
                icon = 'exclamation-triangle';
                break;
            case 'danger':
            case 'error':
                bgClass = 'bg-danger';
                icon = 'exclamation-circle';
                break;
            case 'info':
            default:
                bgClass = 'bg-primary';
                icon = 'info-circle';
        }
        
        toast.innerHTML = `
            <div class="toast-header ${bgClass} text-white">
                <i class="fas fa-${icon} me-2"></i>
                <strong class="me-auto">Expense Tracker</strong>
                <button type="button" class="btn-close btn-close-white" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
            <div class="toast-body">
                ${message}
            </div>
        `;
        
        toastContainer.appendChild(toast);
        
        // Auto hide after 3 seconds
        setTimeout(() => {
            const toastElement = document.getElementById(toastId);
            if (toastElement) {
                toastElement.classList.remove('show');
                setTimeout(() => {
                    toastElement.remove();
                }, 500);
            }
        }, 3000);
    } catch (error) {
        console.error('Error showing toast:', error);
    }
};

// Helper function to add warning styles - this is a global function used on DOMContentLoaded
function addWarningStyles() {
    const styleElement = document.createElement('style');
    styleElement.textContent = `
        @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
        }
        
        .animate-pulse {
            animation: pulse 2s infinite;
        }
    `;
    document.head.appendChild(styleElement);
}

// Helper function for password visibility toggle setup
function setupPasswordToggles() {
    document.querySelectorAll('.toggle-password').forEach(button => {
        button.addEventListener('click', function() {
            const targetId = this.getAttribute('data-target');
            const passwordInput = document.getElementById(targetId);
            
            if (passwordInput) {
                // Toggle input type
                if (passwordInput.type === 'password') {
                    passwordInput.type = 'text';
                    this.innerHTML = '<i class="fas fa-eye-slash"></i>';
                } else {
                    passwordInput.type = 'password';
                    this.innerHTML = '<i class="fas fa-eye"></i>';
                }
            }
        });
    });
}

// Modified behavior for the date range filter
ExpenseTracker.prototype.updateDateRangeFilter = function() {
    const dateRangeFilter = document.getElementById('dateRangeFilter');
    if (dateRangeFilter) {
        // Store original change handler
        const originalChangeHandler = dateRangeFilter.onchange;
        
        // Add our handler
        dateRangeFilter.addEventListener('change', function(e) {
            if (e.target.value === 'today') {
                // Set date range to today only
                const today = new Date();
                const year = today.getFullYear();
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const day = String(today.getDate()).padStart(2, '0');
                const todayFormatted = `${year}-${month}-${day}`;
                
                // If we have custom date fields, set them to today
                const startDateInput = document.getElementById('startDate');
                const endDateInput = document.getElementById('endDate');
                
                if (startDateInput && endDateInput) {
                    startDateInput.value = todayFormatted;
                    endDateInput.value = todayFormatted;
                    
                    // Show the custom date fields
                    document.getElementById('customDateStart').style.display = 'block';
                    document.getElementById('customDateEnd').style.display = 'block';
                    
                    // Manually set dateRangeFilter to custom to ensure proper filtering logic
                    e.target.value = 'custom';
                }
            }
            
            // Call original handler if it exists
            if (typeof originalChangeHandler === 'function') {
                originalChangeHandler(e);
            }
        });
    }
};
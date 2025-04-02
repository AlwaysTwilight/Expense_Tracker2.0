// Main entry point of the application

// Define API URL - move to environment config in a real app
const API_URL = '/api';

// Main ExpenseTracker class
class ExpenseTracker {
    constructor() {
        // Initialize data structures
        this.expenses = [];
        this.budgets = [];
        this.miscExpenses = [];
        this.chartInstances = {};
        this.settings = {};
    
        this.addWarningStyles();
        
        // Check authentication first
        if (!this.checkAuthentication()) {
          return; // Stop initialization if not authenticated
        }
        
        // Continue with normal initialization
        this.loadSettings()
          .then(() => this.loadData())
          .then(() => {
            // Set the current date information
            const now = new Date();
            this.currentMonth = now.toLocaleString('default', { month: 'long' });
            this.currentYear = now.getFullYear();
            this.currentDate = now;
            
            // Check if it's the start of the month (1-5th day)
            this.isStartOfMonth = now.getDate() <= 5;
            
            this.setupTodayExpensesModal();
    
            // Check if the month has been reset already to avoid resetting multiple times
            this.checkMonthlyReset();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Initialize UI
            this.initUI();
            
            // Apply theme
            this.applyTheme(this.settings.theme || 'light');
            
            window.expenseTracker = this;
            
            // Show initial page
            this.showPage('dashboard');
            this.updateDashboard();
        
            document.addEventListener('DOMContentLoaded', () => {
                const foodTab = document.getElementById('food-tab');
                if (foodTab) {
                    foodTab.click(); // Programmatically click the food tab to ensure it's active
                }
                
                // Apply credit card visibility settings
                this.updateCreditCardVisibility();
                this.updateSIPVisibility();
            });
          })
          .catch(error => {
            console.error('Error initializing ExpenseTracker:', error);
            this.showToast('Error initializing application. Please check the console for details.', 'error');
          });
    }

    checkMonthlyReset() {
        try {
            // Check if we need to reset the month's budget
            if (this.isStartOfMonth) {
                // Get the last reset date from localStorage
                const lastReset = localStorage.getItem('lastMonthlyReset');
                const thisMonthKey = `${this.currentMonth}-${this.currentYear}`;
                
                // If no reset has been done this month or it's a new month
                if (!lastReset || lastReset !== thisMonthKey) {
                    // Create a new budget for this month with default values
                    let monthBudget = this.getMonthBudget(this.currentMonth, this.currentYear);
                    
                    if (!monthBudget) {
                        // If no budget exists, create a new one with default values from settings
                        monthBudget = {
                            Month: this.currentMonth,
                            Year: this.currentYear,
                            TotalBudget: this.settings.defaultCashBalance + this.settings.defaultBankBalance,
                            SIP: this.settings.defaultSIP,
                            Rent: this.settings.defaultRent,
                            CreditCard: 0,
                            Electricity: 0,
                            WaterBill: 0,
                            Laundry: 0,
                            CreditCardPaid: false,
                            ElectricityPaid: false,
                            WaterBillPaid: false,
                            LaundryPaid: false,
                            SIPPaid: false,
                            RentPaid: false,
                            SavingsGoal: this.settings.defaultSavingsGoal,
                            HasSavingsGoal: true,
                            CreditCardBalance: this.settings.defaultCreditLimit,
                            CreditCardUsed: 0,
                            PreviousMonthCredit: 0,
                            initialCashBalance: this.settings.defaultCashBalance,
                            initialBankBalance: this.settings.defaultBankBalance
                        };
                        this.budgets.push(monthBudget);
                        this.saveData();
                    } else {
                        // Reset values to defaults while keeping any user customizations
                        // Don't overwrite initialCashBalance or initialBankBalance if already set
                        monthBudget.TotalBudget = this.settings.defaultCashBalance + this.settings.defaultBankBalance;
                        monthBudget.SIP = this.settings.defaultSIP;
                        monthBudget.Rent = this.settings.defaultRent;
                        monthBudget.SavingsGoal = this.settings.defaultSavingsGoal;
                        monthBudget.CreditCardUsed = 0;
                        monthBudget.SIPPaid = false;
                        monthBudget.RentPaid = false;
                        
                        // Remove initial values to ensure they get defaults
                        delete monthBudget.initialCashBalance;
                        delete monthBudget.initialBankBalance;
                        
                        this.saveData();
                    }
                    
                    // Save that we've reset this month
                    localStorage.setItem('lastMonthlyReset', thisMonthKey);
                    
                    this.showToast(`Budget reset for new month: ${this.currentMonth} ${this.currentYear}`, 'info');
                }
            }
        } catch (error) {
            console.error('Error checking monthly reset:', error);
        }
    }

    applyTheme(theme) {
        // Remove any existing theme classes
        document.body.classList.remove('dark-theme', 'blue-theme');
        
        // Apply the selected theme
        if (theme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (theme === 'blue') {
            document.body.classList.add('blue-theme');
        }
        
        // Save the theme setting
        this.settings.theme = theme;
        this.saveSettings();
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    try {
        const app = new ExpenseTracker();
    } catch (error) {
        console.error('Error initializing application:', error);
        alert('Error initializing the application. Please refresh the page and try again.');
    }
});

// Event listener to modify behavior for the "View Details" link
document.addEventListener('DOMContentLoaded', function() {
    // Find the "View Details" link
    const viewDetailsLink = document.querySelector('.view-details-link');
    
    if (viewDetailsLink) {
        // Remove any existing attributes and event listeners
        const newLink = viewDetailsLink.cloneNode(true);
        viewDetailsLink.parentNode.replaceChild(newLink, viewDetailsLink);
        
        // Remove modal attributes
        newLink.removeAttribute('data-bs-toggle');
        newLink.removeAttribute('data-bs-target');
        
        // Add click handler to redirect to analysis page
        newLink.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Set a flag in sessionStorage to indicate we're viewing today's data
            sessionStorage.setItem('viewTodayOnly', 'true');
            
            // Redirect to analysis page
            const analysisLink = document.querySelector('[data-page="analysis"]');
            if (analysisLink) {
                analysisLink.click();
            } else if (window.expenseTracker) {
                // Fallback if the normal navigation doesn't work
                window.expenseTracker.showPage('analysis');
            }
        });
    }
    
    // When leaving the analysis page, reset the date filter to default
    document.querySelectorAll('[data-page]').forEach(link => {
        if (link.getAttribute('data-page') !== 'analysis') {
            link.addEventListener('click', function() {
                // Reset date filter to default when navigating away from analysis page
                const dateRangeFilter = document.getElementById('dateRangeFilter');
                if (dateRangeFilter) {
                    // Remove today option if it exists
                    const todayOption = dateRangeFilter.querySelector('option[value="today"]');
                    if (todayOption) {
                        todayOption.remove();
                    }
                    
                    // Reset to default (this month)
                    dateRangeFilter.value = 'thisMonth';
                }
            });
        }
    });
});
// UI Management Functions

ExpenseTracker.prototype.initUI = function() {
    try {
        this.displayUserInfo();
        // Initialize the budget year dropdown
        const yearSelect = document.getElementById('budgetYear');
        const currentYear = new Date().getFullYear();
        
        if (yearSelect) {
            yearSelect.innerHTML = '';
            const currentYear = new Date().getFullYear();
            for (let year = 2020; year <= 2100; year++) {
                const option = document.createElement('option');
                option.value = year;
                option.textContent = year;
                if (year === currentYear) {
                    option.selected = true;
                }
                yearSelect.appendChild(option);
            }
        }
        
        // Add Petrol option to Misc dropdown
        const miscTagSelect = document.getElementById('miscTag');
        if (miscTagSelect) {
            // Check if Petrol option already exists
            let petrolOptionExists = false;
            for (let i = 0; i < miscTagSelect.options.length; i++) {
                if (miscTagSelect.options[i].value === 'Petrol') {
                    petrolOptionExists = true;
                    break;
                }
            }
            
            // Add Petrol option if it doesn't exist
            if (!petrolOptionExists) {
                const petrolOption = document.createElement('option');
                petrolOption.value = 'Petrol';
                petrolOption.textContent = 'Petrol';
                
                // Insert after the first option (if it exists)
                if (miscTagSelect.options.length > 0) {
                    miscTagSelect.insertBefore(petrolOption, miscTagSelect.options[1]);
                } else {
                    miscTagSelect.appendChild(petrolOption);
                }
            }
        }
        
        // Set current month in dropdown
        const budgetMonth = document.getElementById('budgetMonth');
        if (budgetMonth) {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
            budgetMonth.innerHTML = '';
            
            const currentMonth = new Date().toLocaleString('default', { month: 'long' });
            months.forEach(month => {
                const option = document.createElement('option');
                option.value = month;
                option.textContent = month;
                if (month === currentMonth) {
                    option.selected = true;
                }
                budgetMonth.appendChild(option);
            });
        }
        
        const expenseDateInput = document.getElementById('expenseDate');
        if (expenseDateInput) {
            const today = new Date();
            const year = today.getFullYear();
            const month = String(today.getMonth() + 1).padStart(2, '0');
            const day = String(today.getDate()).padStart(2, '0');
            expenseDateInput.value = `${year}-${month}-${day}`;
        }
        
        // Show savings goal container if it's the start of the month
        const savingsGoalContainer = document.getElementById('savingsGoalContainer');
        if (savingsGoalContainer && this.isStartOfMonth) {
            savingsGoalContainer.classList.remove('d-none');
            
            // Check if a savings goal has already been set for this month
            const monthBudget = this.getMonthBudget(this.currentMonth, this.currentYear);
            
            if (monthBudget && monthBudget.HasSavingsGoal) {
                const setSavingsGoal = document.getElementById('setSavingsGoal');
                const savingsGoalAmountContainer = document.getElementById('savingsGoalAmountContainer');
                const savingsGoalAmount = document.getElementById('savingsGoalAmount');
                
                if (setSavingsGoal && savingsGoalAmountContainer && savingsGoalAmount) {
                    setSavingsGoal.checked = true;
                    savingsGoalAmountContainer.classList.remove('d-none');
                    savingsGoalAmount.value = monthBudget.SavingsGoal || 0;
                }
            }
        }
        
        // Initialize the budget form with values for the current month/year
        this.loadBudgetForm(this.currentMonth, this.currentYear);
        
        // Initialize petrol tab based on day of week (Monday = 1)
        const today = new Date();
        const isMonday = today.getDay() === 1;
        
        const petrolWarning = document.getElementById('petrolWarning');
        const petrolForm = document.getElementById('petrolForm');
        
        if (petrolWarning && petrolForm) {
            if (isMonday) {
                petrolWarning.classList.add('d-none');
                petrolForm.classList.remove('d-none');
            } else {
                petrolWarning.classList.remove('d-none');
                petrolForm.classList.add('d-none');
            }
        }
        
        // Initialize bill payment switches based on current month's data
        this.updateBillPaymentStatus();
        
        // Calculate food items total when textarea changes
        const foodItemsList = document.getElementById('foodItemsList');
        const foodTotal = document.getElementById('foodTotal');
        
        if (foodItemsList && foodTotal) {
            foodItemsList.addEventListener('input', () => {
                const total = this.calculateFoodTotal();
                foodTotal.textContent = `${this.settings.currency}${total.toFixed(2)}`;
            });
        }
        
        // Show/hide custom tag input when "Others" is selected
        const miscTag = document.getElementById('miscTag');
        const customTagContainer = document.getElementById('customTagContainer');
        
        if (miscTag && customTagContainer) {
            miscTag.addEventListener('change', (e) => {
                if (e.target.value === 'Others') {
                    customTagContainer.classList.remove('d-none');
                } else {
                    customTagContainer.classList.add('d-none');
                }
            });
        }
        
        // Initialize the expenses table
        this.updateExpensesTable();
        
        // Initialize dashboard charts
        this.updateDashboardCharts();
        
        // Populate settings form with current settings
        this.initSettingsForm();
        
        // Initialize analysis filters
        this.initAnalysisFilters();
        
        // NEW: Set default bill values
        this.setDefaultBillValues();
        
        // Ensure Food tab is active by default on the expenses page
        const foodTab = document.getElementById('food-tab');
        const foodContent = document.getElementById('food');
        const billsTab = document.getElementById('bills-tab');
        const billsContent = document.getElementById('bills');
        const miscTab = document.getElementById('misc-tab');
        const miscContent = document.getElementById('misc');
        
        if (foodTab && foodContent && billsTab && billsContent && miscTab && miscContent) {
            // Make sure Food tab has the active class
            foodTab.classList.add('active');
            foodTab.setAttribute('aria-selected', 'true');
            foodContent.classList.add('show', 'active');
            
            // Make sure Bills tab doesn't have the active class
            billsTab.classList.remove('active');
            billsTab.setAttribute('aria-selected', 'false');
            billsContent.classList.remove('show', 'active');
            
            // Make sure Misc tab doesn't have the active class
            miscTab.classList.remove('active');
            miscTab.setAttribute('aria-selected', 'false');
            miscContent.classList.remove('show', 'active');
            
            // Fix tabs not showing correctly when clicking between tabs
            document.querySelectorAll('#expenseTabs .nav-link').forEach(tab => {
                tab.addEventListener('click', (e) => {
                    e.preventDefault();
                    
                    // Remove active class from all tabs
                    document.querySelectorAll('#expenseTabs .nav-link').forEach(t => {
                        t.classList.remove('active');
                        t.setAttribute('aria-selected', 'false');
                    });
                    
                    // Hide all tab panes
                    document.querySelectorAll('#expenseTabsContent .tab-pane').forEach(pane => {
                        pane.classList.remove('show', 'active');
                    });
                    
                    // Show the selected tab and its content
                    e.target.classList.add('active');
                    e.target.setAttribute('aria-selected', 'true');
                    
                    const target = document.querySelector(e.target.getAttribute('data-bs-target'));
                    if (target) {
                        target.classList.add('show', 'active');
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error initializing UI:', error);
        this.showToast('Error initializing UI. Please refresh the page.', 'error');
    }
};

ExpenseTracker.prototype.setDefaultBillValues = function() {
    try {
        // Get current month's budget for updated values
        const monthBudget = this.getMonthBudget(this.currentMonth, this.currentYear);
        
        // Set SIP amount from budget if available, otherwise from settings
        const sipAmountInput = document.getElementById('sipAmount');
        if (sipAmountInput) {
            if (monthBudget && monthBudget.SIP !== undefined) {
                sipAmountInput.value = monthBudget.SIP;
            } else {
                sipAmountInput.value = this.settings.defaultSIP;
            }
        }
        
        // Set Rent amount from budget if available, otherwise from settings
        const rentAmountInput = document.getElementById('rentAmount');
        if (rentAmountInput) {
            if (monthBudget && monthBudget.Rent !== undefined) {
                rentAmountInput.value = monthBudget.Rent;
            } else {
                rentAmountInput.value = this.settings.defaultRent;
            }
        }
    } catch (error) {
        console.error('Error setting default bill values:', error);
    }
};

ExpenseTracker.prototype.initSettingsForm = function() {
    try {
        const defaultElements = {
            'defaultSIP': this.settings.defaultSIP || 2000,
            'defaultRent': this.settings.defaultRent || 1900,
            'defaultCreditLimit': this.settings.defaultCreditLimit || 10000,
            'defaultPaymentMethod': this.settings.defaultPaymentMethod || 'UPI',
            'themeSelector': this.settings.theme || 'light',
            'currencyFormat': this.settings.currency || '₹',
            'dateFormat': this.settings.dateFormat || 'dd/mm/yyyy',
            'itemsPerPage': this.settings.itemsPerPage || 25,
            'defaultCashBalance': this.settings.defaultCashBalance || 2000,
            'defaultBankBalance': this.settings.defaultBankBalance || 8000,
            'defaultSavingsGoal': this.settings.defaultSavingsGoal || 1000
        };
        
        // Set values for each element if it exists
        Object.entries(defaultElements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
        
        // Set credit card enabled checkbox
        const creditCardEnabledCheckbox = document.getElementById('creditCardEnabled');
        if (creditCardEnabledCheckbox) {
            creditCardEnabledCheckbox.checked = this.settings.creditCardEnabled !== false;
        }
        
        // Set SIP enabled checkbox
        const sipEnabledCheckbox = document.getElementById('sipEnabled');
        if (sipEnabledCheckbox) {
            sipEnabledCheckbox.checked = this.settings.sipEnabled !== false;
        }
        
        // Calculate and set default budget (read-only)
        const defaultBudgetInput = document.getElementById('defaultBudget');
        if (defaultBudgetInput) {
            defaultBudgetInput.value = (this.settings.defaultCashBalance + this.settings.defaultBankBalance).toFixed(0);
            defaultBudgetInput.readOnly = true;
            defaultBudgetInput.classList.add('bg-light');
        }
    } catch (error) {
        console.error('Error initializing settings form:', error);
    }
};

ExpenseTracker.prototype.initAnalysisFilters = function() {
    try {
        // Populate subcategory filters
        const subcategories = new Set();
        this.expenses.forEach(expense => {
            if (expense.Subcategory) {
                subcategories.add(expense.Subcategory);
            }
        });
        
        const subcategoryContainer = document.getElementById('subcategoryFilters');
        const allSubcategoriesCheckbox = document.getElementById('subcategory-all');
        
        if (subcategoryContainer && allSubcategoriesCheckbox) {
            // Clear existing subcategories (except the "All" option)
            const checkboxes = subcategoryContainer.querySelectorAll('.subcategory-filter');
            checkboxes.forEach(checkbox => checkbox.parentNode.remove());
            
            // Add subcategories from expenses
            subcategories.forEach(subcategory => {
                if (!subcategory) return; // Skip empty subcategories
                
                const formCheck = document.createElement('div');
                formCheck.className = 'form-check';
                
                const checkbox = document.createElement('input');
                checkbox.className = 'form-check-input subcategory-filter';
                checkbox.type = 'checkbox';
                checkbox.id = `subcategory-${subcategory.toLowerCase().replace(/\s+/g, '-')}`;
                checkbox.value = subcategory;
                checkbox.checked = true;
                
                const label = document.createElement('label');
                label.className = 'form-check-label';
                label.htmlFor = checkbox.id;
                label.textContent = subcategory;
                
                formCheck.appendChild(checkbox);
                formCheck.appendChild(label);
                subcategoryContainer.appendChild(formCheck);
                
                // Add event listener to toggle 'All' checkbox
                checkbox.addEventListener('change', () => {
                    this.updateAllCheckbox('subcategory');
                });
            });
            
            // Setup 'All' checkbox event listeners for category filters
            document.querySelectorAll('.category-filter').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateAllCheckbox('category');
                });
            });
            
            // Setup 'All' checkbox event listeners for payment method filters
            document.querySelectorAll('.payment-filter').forEach(checkbox => {
                checkbox.addEventListener('change', () => {
                    this.updateAllCheckbox('payment');
                });
            });
            
            // Setup 'All' checkbox event handlers
            document.getElementById('category-all')?.addEventListener('change', (e) => {
                document.querySelectorAll('.category-filter').forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
            
            document.getElementById('payment-all')?.addEventListener('change', (e) => {
                document.querySelectorAll('.payment-filter').forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });
            
            document.getElementById('subcategory-all')?.addEventListener('change', (e) => {
                document.querySelectorAll('.subcategory-filter').forEach(checkbox => {
                    checkbox.checked = e.target.checked;
                });
            });

            // Find min and max amounts in expenses for range slider
            let minAmount = 0;
            let maxAmount = 5000; // Default
            
            if (this.expenses.length > 0) {
                const amounts = this.expenses.map(expense => expense.Amount);
                minAmount = Math.min(...amounts);
                maxAmount = Math.max(...amounts);
                // Round to nearest convenient values
                minAmount = Math.floor(minAmount / 100) * 100;
                maxAmount = Math.ceil(maxAmount / 1000) * 1000;
            }
            
            // Get range slider elements
            const minAmountEl = document.getElementById('minAmountInput');
            const maxAmountEl = document.getElementById('maxAmountInput');
            const minAmountDisplay = document.getElementById('minAmount');
            const maxAmountDisplay = document.getElementById('maxAmount');
            
            if (minAmountEl && maxAmountEl && minAmountDisplay && maxAmountDisplay) {
                // Set initial range and values
                minAmountEl.min = minAmount;
                minAmountEl.max = maxAmount;
                minAmountEl.value = minAmount;
                
                maxAmountEl.min = minAmount;
                maxAmountEl.max = maxAmount;
                maxAmountEl.value = maxAmount;
                
                // Update displays
                minAmountDisplay.textContent = `${this.settings.currency}${minAmount}`;
                maxAmountDisplay.textContent = `${this.settings.currency}${maxAmount}`;
                
                // Add event listeners for real-time updates
                minAmountEl.addEventListener('input', () => {
                    const value = parseInt(minAmountEl.value);
                    minAmountDisplay.textContent = `${this.settings.currency}${value}`;
                    
                    // Ensure min doesn't exceed max
                    if (value > parseInt(maxAmountEl.value)) {
                        maxAmountEl.value = value;
                        maxAmountDisplay.textContent = `${this.settings.currency}${value}`;
                    }
                });
                
                maxAmountEl.addEventListener('input', () => {
                    const value = parseInt(maxAmountEl.value);
                    maxAmountDisplay.textContent = `${this.settings.currency}${value}`;
                    
                    // Ensure max doesn't go below min
                    if (value < parseInt(minAmountEl.value)) {
                        minAmountEl.value = value;
                        minAmountDisplay.textContent = `${this.settings.currency}${value}`;
                    }
                });
            }
        }
    } catch (error) {
        console.error('Error initializing analysis filters:', error);
    }
};

ExpenseTracker.prototype.updateAllCheckbox = function(type) {
    try {
        const allCheckbox = document.querySelector(`.${type}-all`);
        const filterCheckboxes = document.querySelectorAll(`.${type}-filter`);
        
        if (allCheckbox && filterCheckboxes.length > 0) {
            const allChecked = Array.from(filterCheckboxes).every(checkbox => checkbox.checked);
            allCheckbox.checked = allChecked;
        }
    } catch (error) {
        console.error('Error updating all checkbox:', error);
    }
};

ExpenseTracker.prototype.setupEventListeners = function() {
    try {
        // Navigation event listeners
        document.querySelectorAll('[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = e.currentTarget.getAttribute('data-page');
                this.showPage(page);
                
                // Update UI for specific pages
                if (page === 'analysis') {
                    this.updateAnalysisPage();
                } else if (page === 'dashboard') {
                    this.updateDashboard();
                } else if (page === 'budget') {
                    this.updateBudgetHistory();
                }
            });
        });
        
        // Savings goal toggle
        const setSavingsGoal = document.getElementById('setSavingsGoal');
        const savingsGoalAmountContainer = document.getElementById('savingsGoalAmountContainer');
        
        if (setSavingsGoal && savingsGoalAmountContainer) {
            setSavingsGoal.addEventListener('change', (e) => {
                if (e.target.checked) {
                    savingsGoalAmountContainer.classList.remove('d-none');
                } else {
                    savingsGoalAmountContainer.classList.add('d-none');
                }
            });
        }
        
        // Update savings goal button
        const updateSavingsGoalBtn = document.getElementById('updateSavingsGoalBtn');
        if (updateSavingsGoalBtn) {
            updateSavingsGoalBtn.addEventListener('click', () => {
                this.updateSavingsGoal();
            });
        }
        
        // Cash and bank balance events to update monthly budget
        const initialCashBalanceInput = document.getElementById('initialCashBalance');
        const initialBankBalanceInput = document.getElementById('initialBankBalance');
        const monthlyBudgetInput = document.getElementById('monthlyBudget');

        if (initialCashBalanceInput && initialBankBalanceInput && monthlyBudgetInput) {
            // Function to update monthly budget when cash or bank is changed
            const updateTotal = () => {
                const cashBalance = parseFloat(initialCashBalanceInput.value) || 0;
                const bankBalance = parseFloat(initialBankBalanceInput.value) || 0;
                monthlyBudgetInput.value = (cashBalance + bankBalance).toFixed(0);
                this.validateBudgetInputs();
            };
            
            initialCashBalanceInput.addEventListener('input', updateTotal);
            initialBankBalanceInput.addEventListener('input', updateTotal);
        }

        // Update budget button
        const updateBudgetBtn = document.getElementById('updateBudgetBtn');
        if (updateBudgetBtn) {
            updateBudgetBtn.addEventListener('click', () => {
                this.updateBudget();
            });
        }
        
        // Date range filter change
        const dateRangeFilter = document.getElementById('dateRangeFilter');
        const customDateFields = document.querySelectorAll('#customDateStart, #customDateEnd');
        
        if (dateRangeFilter && customDateFields.length > 0) {
            dateRangeFilter.addEventListener('change', (e) => {
                if (e.target.value === 'custom') {
                    customDateFields.forEach(field => field.style.display = 'block');
                } else {
                    customDateFields.forEach(field => field.style.display = 'none');
                }
            });
        }
        
        // Apply analysis filters button
        const applyFilters = document.getElementById('applyFilters');
        if (applyFilters) {
            applyFilters.addEventListener('click', () => {
                this.updateAnalysisPage();
            });
        }
        
        // Download analysis button
        const downloadAnalysisBtn = document.getElementById('downloadAnalysisBtn');
        if (downloadAnalysisBtn) {
            downloadAnalysisBtn.addEventListener('click', async () => {
                const downloadFormat = document.querySelector('input[name="downloadFormat"]:checked')?.value || 'csv';
                if (downloadFormat === 'pdf') {
                    await this.downloadAnalysisPDF();
                } else {
                    this.downloadAnalysisCSV();
                }
            });
        }
        
        // Expense form submission handlers
        const addFoodExpense = document.getElementById('addFoodExpense');
        if (addFoodExpense) {
            addFoodExpense.addEventListener('click', () => {
                this.addFoodExpense();
            });
        }
        
        const addPetrolExpense = document.getElementById('addPetrolExpense');
        if (addPetrolExpense) {
            addPetrolExpense.addEventListener('click', () => {
                this.addPetrolExpense();
            });
        }
        
        const addMiscExpense = document.getElementById('addMiscExpense');
        if (addMiscExpense) {
            addMiscExpense.addEventListener('click', () => {
                this.addMiscExpense();
            });
        }
        
        const saveMiscExpenses = document.getElementById('saveMiscExpenses');
        if (saveMiscExpenses) {
            saveMiscExpenses.addEventListener('click', () => {
                this.saveMiscExpenses();
            });
        }
        
        // Bill payment handlers
        const billButtons = {
            'addCreditCardBill': 'Credit Card',
            'addElectricityBill': 'Electricity',
            'addWaterBill': 'Water Bill',
            'addLaundryExpense': 'Laundry',
            'addSipExpense': 'SIP',
            'addRentExpense': 'Rent'
        };
        
        Object.entries(billButtons).forEach(([buttonId, billType]) => {
            const button = document.getElementById(buttonId);
            if (button) {
                button.addEventListener('click', () => {
                    this.addBillExpense(billType);
                });
            }
        });
        
        // Bill payment status toggle handlers
        const billToggles = {
            'creditCardBillPaid': 'creditCardBill',
            'electricityBillPaid': 'electricityBill',
            'waterBillPaid': 'waterBill',
            'laundryPaid': 'laundry',
            'sipPaid': 'sip',
            'rentPaid': 'rent'
        };
        
        Object.entries(billToggles).forEach(([toggleId, formId]) => {
            const toggle = document.getElementById(toggleId);
            if (toggle) {
                toggle.addEventListener('change', (e) => {
                    this.toggleBillPaymentForm(formId, e.target.checked);
                    
                    if (e.target.checked) {
                        // If checked ("Already Paid"), update the status without adding expense
                        const billType = formId === 'creditCardBill' ? 'Credit Card' :
                                    formId === 'electricityBill' ? 'Electricity' :
                                    formId === 'waterBill' ? 'Water Bill' :
                                    formId === 'laundry' ? 'Laundry' :
                                    formId === 'sip' ? 'SIP' :
                                    formId === 'rent' ? 'Rent' : '';
                                    
                        if (billType) {
                            const date = new Date();
                            const month = date.toLocaleString('default', { month: 'long' });
                            const year = date.getFullYear();
                            
                            this.updateBillPaymentStatus(billType, true, 0, month, year);
                            this.saveData();
                            
                            this.showToast(`Marked ${billType} as already paid.`, 'success');
                            
                            // Update dashboard if visible
                            if (this.currentPage === 'dashboard') {
                                this.updateDashboard();
                            }
                        }
                    }
                });
            }
        });
        
        // Month/Year selection for budget
        const budgetMonth = document.getElementById('budgetMonth');
        const budgetYear = document.getElementById('budgetYear');
        
        if (budgetMonth && budgetYear) {
            budgetMonth.addEventListener('change', () => {
                const month = budgetMonth.value;
                const year = parseInt(budgetYear.value);
                this.loadBudgetForm(month, year);
            });
            
            budgetYear.addEventListener('change', () => {
                const month = budgetMonth.value;
                const year = parseInt(budgetYear.value);
                this.loadBudgetForm(month, year);
            });
        }
        
        // Expense search
        const expenseSearchButton = document.getElementById('expenseSearchButton');
        const expenseSearchInput = document.getElementById('expenseSearchInput');
        
        if (expenseSearchButton && expenseSearchInput) {
            expenseSearchButton.addEventListener('click', () => {
                this.updateExpensesTable();
            });
            
            expenseSearchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.updateExpensesTable();
                }
            });
        }
        
        // Delete confirmation
        const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
        if (confirmDeleteBtn) {
            confirmDeleteBtn.addEventListener('click', () => {
                const expenseId = confirmDeleteBtn.getAttribute('data-expense-id');
                if (expenseId) {
                    this.deleteExpense(parseInt(expenseId));
                    
                    // Close modal
                    const modal = bootstrap.Modal.getInstance(document.getElementById('deleteConfirmModal'));
                    if (modal) {
                        modal.hide();
                    }
                }
            });
        }
        
        // Settings page events
        const saveDefaultsBtn = document.getElementById('saveDefaultsBtn');
        if (saveDefaultsBtn) {
            saveDefaultsBtn.addEventListener('click', () => {
                // Get values from form
                const defaultSIP = parseFloat(document.getElementById('defaultSIP')?.value) || 2000;
                const defaultRent = parseFloat(document.getElementById('defaultRent')?.value) || 1900;
                const defaultCreditLimit = parseFloat(document.getElementById('defaultCreditLimit')?.value) || 10000;
                const defaultPaymentMethod = document.getElementById('defaultPaymentMethod')?.value || 'UPI';
                const defaultCashBalance = parseFloat(document.getElementById('defaultCashBalance')?.value) || 2000;
                const defaultBankBalance = parseFloat(document.getElementById('defaultBankBalance')?.value) || 8000;
                const defaultSavingsGoal = parseFloat(document.getElementById('defaultSavingsGoal')?.value) || 1000;
                const creditCardEnabled = document.getElementById('creditCardEnabled')?.checked !== false;
                const sipEnabled = document.getElementById('sipEnabled')?.checked !== false;
                
                // Calculate default budget based on cash + bank balance
                const defaultBudget = defaultCashBalance + defaultBankBalance;
                
                // Update settings
                this.settings.defaultSIP = defaultSIP;
                this.settings.defaultRent = defaultRent;
                this.settings.defaultCreditLimit = defaultCreditLimit;
                this.settings.defaultPaymentMethod = defaultPaymentMethod;
                this.settings.defaultCashBalance = defaultCashBalance;
                this.settings.defaultBankBalance = defaultBankBalance;
                this.settings.defaultBudget = defaultBudget;
                this.settings.defaultSavingsGoal = defaultSavingsGoal;
                this.settings.creditCardEnabled = creditCardEnabled;
                this.settings.sipEnabled = sipEnabled;
                
                this.saveSettings();
                
                // Also update the current month's budget if it exists
                const currentMonth = this.currentMonth;
                const currentYear = this.currentYear;
                let monthBudget = this.getMonthBudget(currentMonth, currentYear);
                
                // If current month budget doesn't exist, create it with default values
                if (!monthBudget) {
                    monthBudget = {
                        Month: currentMonth,
                        Year: currentYear,
                        TotalBudget: defaultBudget,
                        SIP: defaultSIP,
                        Rent: defaultRent,
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
                        SavingsGoal: defaultSavingsGoal,
                        HasSavingsGoal: defaultSavingsGoal > 0,
                        CreditCardBalance: defaultCreditLimit,
                        CreditCardUsed: 0,
                        PreviousMonthCredit: 0,
                        initialCashBalance: defaultCashBalance,
                        initialBankBalance: defaultBankBalance
                    };
                    this.budgets.push(monthBudget);
                    this.saveData();
                }
                
                this.showToast('Default values saved successfully!', 'success');
                
                // Update any open forms with new default values
                if (this.currentPage === 'budget') {
                    const month = document.getElementById('budgetMonth')?.value;
                    const year = parseInt(document.getElementById('budgetYear')?.value);
                    if (month && year) {
                        this.loadBudgetForm(month, year);
                    }
                }
                
                // Update bill values with new defaults
                this.setDefaultBillValues();
                
                // Update credit card and SIP visibility
                this.updateCreditCardVisibility();
                this.updateSIPVisibility();
                
                // Update dashboard if needed
                if (this.currentPage === 'dashboard') {
                    this.updateDashboard();
                } else if (this.currentPage === 'expenses') {
                    // Refresh the expense page to show/hide SIP and credit card sections
                    this.showPage('expenses');
                }
            });
        }
        
        const saveDisplaySettingsBtn = document.getElementById('saveDisplaySettingsBtn');
        if (saveDisplaySettingsBtn) {
            saveDisplaySettingsBtn.addEventListener('click', () => {
                const themeSelector = document.getElementById('themeSelector');
                const currencyFormat = document.getElementById('currencyFormat');
                const dateFormat = document.getElementById('dateFormat');
                const itemsPerPage = document.getElementById('itemsPerPage');
                
                if (themeSelector && currencyFormat && dateFormat && itemsPerPage) {
                    const theme = themeSelector.value;
                    this.settings.theme = theme;
                    this.settings.currency = currencyFormat.value;
                    this.settings.dateFormat = dateFormat.value;
                    this.settings.itemsPerPage = parseInt(itemsPerPage.value);
                    
                    this.saveSettings();
                    this.applyTheme(theme);
                    this.showToast('Display settings saved successfully!', 'success');
                    
                    // Refresh UI to update currency symbols
                    this.updateDashboard();
                }
            });
        }
        
        // Data management events
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportData();
            });
        }
        
        const importDataBtn = document.getElementById('importDataBtn');
        const importDataFile = document.getElementById('importDataFile');
        
        if (importDataBtn && importDataFile) {
            importDataBtn.addEventListener('click', () => {
                if (importDataFile.files.length > 0) {
                    this.importData(importDataFile.files[0]);
                } else {
                    this.showToast('Please select a file to import.', 'warning');
                }
            });
        }
        
        // Enable/disable reset button based on checkbox
        const resetConfirmCheck = document.getElementById('resetConfirmCheck');
        const confirmResetBtn = document.getElementById('confirmResetBtn');
        
        if (resetConfirmCheck && confirmResetBtn) {
            resetConfirmCheck.addEventListener('change', (e) => {
                confirmResetBtn.disabled = !e.target.checked;
            });
        }
        
        // Reset app button
        if (confirmResetBtn) {
            confirmResetBtn.addEventListener('click', () => {
                this.resetApplication();
                
                // Close modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('resetConfirmModal'));
                if (modal) {
                    modal.hide();
                }
            });
        }

        // Today's expenses modal - handle click on view details
        const viewTodayExpensesBtn = document.querySelector('[data-bs-target="#todayExpensesModal"]');
        if (viewTodayExpensesBtn) {
            viewTodayExpensesBtn.addEventListener('click', () => {
                // Refresh today's expenses data when modal is opened
                this.updateTodayExpenses();
            });
        }
        
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                this.logout();
            });
        }
        
        // Add profile update form handler
        const updateProfileForm = document.getElementById('updateProfileForm');
        if (updateProfileForm) {
            updateProfileForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('profileName').value;
                const email = document.getElementById('profileEmail').value;
                const username = document.getElementById('profileUsername').value;
                const phoneNumber = document.getElementById('profilePhone').value;
                
                // Reset messages
                const errorMsg = document.getElementById('profileErrorMsg');
                const successMsg = document.getElementById('profileSuccessMsg');
                if (errorMsg) errorMsg.style.display = 'none';
                if (successMsg) successMsg.style.display = 'none';
                
                try {
                    const result = await this.updateUserProfile({ 
                        name, 
                        email, 
                        username, 
                        phoneNumber 
                    });
                    
                    // Show success message
                    if (successMsg) {
                        successMsg.textContent = result.message || 'Profile updated successfully!';
                        successMsg.style.display = 'block';
                    } else {
                        this.showToast('Profile updated successfully!', 'success');
                    }
                    
                    // Update displayed name
                    const userNameDisplay = document.getElementById('userNameDisplay');
                    if (userNameDisplay && this.currentUser) {
                        userNameDisplay.textContent = this.currentUser.name;
                    }
                    
                    // Update welcome message on dashboard if visible
                    this.updateWelcomeMessage();
                    
                } catch (error) {
                    if (errorMsg) {
                        errorMsg.textContent = error.message || 'Failed to update profile.';
                        errorMsg.style.display = 'block';
                    } else {
                        this.showToast(error.message || 'Failed to update profile.', 'error');
                    }
                }
            });
        }

    } catch (error) {
        console.error('Error setting up event listeners:', error);
        this.showToast('Error setting up application. Please refresh the page.', 'error');
    }
};

// Page navigation
ExpenseTracker.prototype.showPage = function(pageName) {
    try {
      // Hide all pages
      document.querySelectorAll('.page').forEach(page => {
        page.classList.add('d-none');
      });
      
      // Show selected page
      const selectedPage = document.getElementById(`${pageName}-page`);
      if (selectedPage) {
        selectedPage.classList.remove('d-none');
      }
      
      // Update active navigation link
      document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
      });
      
      const activeLink = document.querySelector(`.nav-link[data-page="${pageName}"]`);
      if (activeLink) {
        activeLink.classList.add('active');
      }
      
      // Store current page
      this.currentPage = pageName;
      
      // Special page initializations
      if (pageName === 'budget') {
        // Budget page initialization
        const month = document.getElementById('budgetMonth')?.value || this.currentMonth;
        const year = parseInt(document.getElementById('budgetYear')?.value || this.currentYear);
        this.loadBudgetForm(month, year);
        this.updateBudgetHistory();
      } else if (pageName === 'analysis') {
        this.updateAnalysisPage();
      } else if (pageName === 'dashboard') {
        this.updateDashboard();
      } else if (pageName === 'expenses') {
        this.setDefaultBillValues();
        this.updateSIPVisibility();
        this.updateCreditCardVisibility();
      } else if (pageName === 'profile') {
        // Display user profile information
        this.displayUserInfo();
      }
    } catch (error) {
      console.error('Error showing page:', error);
    }
};

ExpenseTracker.prototype.updateCreditCardVisibility = function() {
    try {
        const creditCardEnabled = this.settings.creditCardEnabled;
        
        // Hide/show credit card related elements
        // FIX: Use proper selectors instead of :contains which isn't supported
        const creditCardElements = [
            // Dashboard elements - find by class or more specific selectors
            document.querySelectorAll('.credit-card')[2], // The third credit card element (assuming it's "Credit Available")
            // Expense page elements
            document.querySelectorAll('option[value="Credit Card"]'),
            // Budget page elements
            document.getElementById('creditCardLimit')?.closest('.mb-3'),
            document.getElementById('previousMonthCredit')?.closest('.mb-3')
        ];
        
        creditCardElements.forEach(element => {
            if (element) {
                if (Array.isArray(element) || element instanceof NodeList) {
                    element.forEach(el => {
                        if (el) {
                            el.style.display = creditCardEnabled ? '' : 'none';
                        }
                    });
                } else {
                    element.style.display = creditCardEnabled ? '' : 'none';
                }
            }
        });
        
        // Update payment method options in all selects
        document.querySelectorAll('select').forEach(select => {
            if (select.id && select.id.includes('PaymentMethod')) {
                const creditOption = Array.from(select.options).find(option => option.value === 'Credit Card');
                if (creditOption) {
                    creditOption.disabled = !creditCardEnabled;
                    if (!creditCardEnabled && creditOption.selected) {
                        // Find UPI or Cash option
                        const upiOption = Array.from(select.options).find(option => option.value === 'UPI');
                        const cashOption = Array.from(select.options).find(option => option.value === 'Cash');
                        if (upiOption) {
                            upiOption.selected = true;
                        } else if (cashOption) {
                            cashOption.selected = true;
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error updating credit card visibility:', error);
    }
};

ExpenseTracker.prototype.updateSIPVisibility = function() {
    try {
        const sipEnabled = this.settings.sipEnabled;
        
        // Find SIP card in the bills tab
        const sipCard = document.querySelector('.card-body:has(h5.card-title:contains("SIP Payment"))');
        if (sipCard) {
            const parentCol = sipCard.closest('.col-md-6');
            if (parentCol) {
                parentCol.style.display = sipEnabled ? '' : 'none';
            }
        }
        
        // If SIP is disabled, IMMEDIATELY mark it as paid in the current month's budget
        if (!sipEnabled) {
            // Force update the checkbox visually first
            const sipPaidCheckbox = document.getElementById('sipPaid');
            if (sipPaidCheckbox) {
                sipPaidCheckbox.checked = true;
                
                // Manually trigger the change event to activate the form toggle
                const changeEvent = new Event('change', { bubbles: true });
                sipPaidCheckbox.dispatchEvent(changeEvent);
            }
            
            // Force hide the SIP form
            const sipForm = document.getElementById('sipForm');
            if (sipForm) {
                sipForm.classList.add('d-none');
            }
            
            // Update budget data to mark SIP as paid for current month
            const currentMonth = this.currentMonth;
            const currentYear = this.currentYear;
            
            let monthBudget = this.getMonthBudget(currentMonth, currentYear);
            if (monthBudget) {
                monthBudget.SIPPaid = true;
                this.saveData();
            } else {
                // Create a new budget with SIP already paid if it doesn't exist
                this.createNewMonthBudgetWithSIPPaid(currentMonth, currentYear);
            }
            
            // Show confirmation
            this.showToast('SIP has been marked as paid automatically.', 'info');
        }
    } catch (error) {
        console.error('Error updating SIP visibility:', error);
    }
};

ExpenseTracker.prototype.createNewMonthBudgetWithSIPPaid = function(month, year) {
    try {
        const newBudget = {
            Month: month,
            Year: year,
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
            SIPPaid: true, // Mark SIP as paid
            RentPaid: false,
            SavingsGoal: this.settings.defaultSavingsGoal,
            HasSavingsGoal: false,
            CreditCardBalance: this.settings.defaultCreditLimit,
            CreditCardUsed: 0,
            PreviousMonthCredit: 0,
            initialCashBalance: this.settings.defaultCashBalance,
            initialBankBalance: this.settings.defaultBankBalance
        };
        
        this.budgets.push(newBudget);
        this.saveData();
        
        return newBudget;
    } catch (error) {
        console.error('Error creating new month budget with SIP paid:', error);
        return null;
    }
};

ExpenseTracker.prototype.setupTodayExpensesModal = function() {
    try {
        // Find the view details link
        const viewDetailsLink = document.querySelector('[data-bs-target="#todayExpensesModal"]');
        
        if (viewDetailsLink) {
            viewDetailsLink.addEventListener('click', (e) => {
                e.preventDefault(); // Prevent default behavior
                
                // Update today's expenses data
                this.updateTodayExpenses();
                
                // Show modal using Bootstrap - proper initialization
                const todayExpensesModal = document.getElementById('todayExpensesModal');
                if (todayExpensesModal) {
                    // Check if modal instance already exists
                    let modalInstance = bootstrap.Modal.getInstance(todayExpensesModal);
                    
                    // If not, create a new one
                    if (!modalInstance) {
                        modalInstance = new bootstrap.Modal(todayExpensesModal, {
                            backdrop: true,
                            keyboard: true,
                            focus: true
                        });
                    }
                    
                    modalInstance.show();
                }
            });
        }
        
        // Set up the close button event handlers
        const closeButtons = document.querySelectorAll('[data-bs-dismiss="modal"]');
        closeButtons.forEach(button => {
            button.addEventListener('click', () => {
                const modal = button.closest('.modal');
                if (modal) {
                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) {
                        modalInstance.hide();
                    }
                }
            });
        });
        
        // Also set up the modal's show event handler as a backup
        const todayExpensesModal = document.getElementById('todayExpensesModal');
        if (todayExpensesModal) {
            todayExpensesModal.addEventListener('show.bs.modal', () => {
                this.updateTodayExpenses();
            });
        }
    } catch (error) {
        console.error('Error setting up today\'s expenses modal:', error);
    }
};

ExpenseTracker.prototype.toggleBillPaymentForm = function(formId, isDisabled) {
    try {
        const formElement = document.getElementById(formId + 'Form');
        if (formElement) {
            if (isDisabled) {
                formElement.classList.add('d-none');
            } else {
                formElement.classList.remove('d-none');
            }
        }
    } catch (error) {
        console.error('Error toggling bill payment form:', error);
    }
};

ExpenseTracker.prototype.updateBillPaymentStatus = function(billType = null, isPaid = false, amount = 0, month = null, year = null) {
    try {
        // If no specific bill type, update all bill payment status UI
        if (!billType) {
            const monthBudget = this.getMonthBudget(this.currentMonth, this.currentYear);
            
            if (monthBudget) {
                // Update UI based on budget data
                // No changes needed for this part as it only affects the UI
            }
            return;
        }
        
        // Update specific bill payment status in budget data
        month = month || this.currentMonth;
        year = year || this.currentYear;
        
        let monthBudget = this.getMonthBudget(month, year);
        
        if (!monthBudget) {
            // Create a new budget entry with default values
            monthBudget = {
                Month: month,
                Year: year,
                // Default values...
            };
            this.budgets.push(monthBudget);
        }
        
        // Update the specific bill status
        switch(billType) {
            case 'Credit Card':
                monthBudget.CreditCard = amount;
                monthBudget.CreditCardPaid = isPaid;
                break;
            case 'Electricity':
                monthBudget.Electricity = amount;
                monthBudget.ElectricityPaid = isPaid;
                break;
            // Other cases...
        }
        
        this.saveData();
    } catch (error) {
        console.error('Error updating bill payment status:', error);
    }
};
// Expense Management Functions

ExpenseTracker.prototype.updateExpensesTable = function() {
    try {
        const table = document.getElementById('allExpensesTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;
        
        table.innerHTML = '';
        
        // Get search term
        const searchInput = document.getElementById('expenseSearchInput');
        const searchTerm = searchInput ? searchInput.value.toLowerCase() : '';
        
        // Filter expenses based on search term
        const filteredExpenses = this.expenses.filter(expense => {
            if (searchTerm === '') return true;
            
            return expense.Category.toLowerCase().includes(searchTerm) ||
                   expense.Subcategory.toLowerCase().includes(searchTerm) ||
                   expense.Description.toLowerCase().includes(searchTerm) ||
                   this.formatDate(expense.Date).includes(searchTerm) ||
                   expense.Amount.toString().includes(searchTerm) ||
                   expense.PaymentMethod.toLowerCase().includes(searchTerm);
        });
        
        // Sort expenses by date (newest first)
        const sortedExpenses = filteredExpenses.sort((a, b) => new Date(b.Date) - new Date(a.Date));
        
        if (sortedExpenses.length === 0) {
            const row = table.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 7;
            cell.textContent = searchTerm ? 'No expenses found matching your search.' : 'No expenses recorded yet.';
            cell.className = 'text-center text-muted py-3';
            return;
        }
        
        // Add expenses to table
        sortedExpenses.forEach((expense, index) => {
            const row = table.insertRow();
            
            // Date cell
            const dateCell = row.insertCell(0);
            dateCell.textContent = this.formatDate(expense.Date);
            
            // Category cell with tag styling
            const categoryCell = row.insertCell(1);
            const categorySpan = document.createElement('span');
            categorySpan.className = `category-tag category-${expense.Category.toLowerCase()}`;
            categorySpan.textContent = expense.Category;
            categoryCell.appendChild(categorySpan);
            
            // Subcategory cell
            const subcategoryCell = row.insertCell(2);
            subcategoryCell.textContent = expense.Subcategory;
            
            // Amount cell
            const amountCell = row.insertCell(3);
            amountCell.textContent = `${this.settings.currency}${expense.Amount.toFixed(2)}`;
            amountCell.className = 'text-end';
            
            // Description cell
            const descriptionCell = row.insertCell(4);
            descriptionCell.textContent = expense.Description;
            
            // Payment method cell
            const paymentCell = row.insertCell(5);
            paymentCell.textContent = expense.PaymentMethod;
            
            // Actions cell
            const actionsCell = row.insertCell(6);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.setAttribute('data-bs-toggle', 'modal');
            deleteBtn.setAttribute('data-bs-target', '#deleteConfirmModal');
            deleteBtn.onclick = () => {
                const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
                if (confirmDeleteBtn) {
                    confirmDeleteBtn.setAttribute('data-expense-id', index.toString());
                }
            };
            actionsCell.appendChild(deleteBtn);
        });
    } catch (error) {
        console.error('Error updating expenses table:', error);
    }
};

ExpenseTracker.prototype.deleteExpense = async function(index) {
    try {
      const expense = this.expenses[index];
      
      if (!expense || !expense._id) {
        throw new Error('Invalid expense');
      }
      
      // Delete from database
      const response = await this.fetchWithAuth(`${API_URL}/expenses/${expense._id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Delete from local array
      this.expenses.splice(index, 1);
      
      this.showToast('Expense deleted successfully!', 'success');
      
      // Update UI
      this.updateExpensesTable();
      if (this.currentPage === 'dashboard') {
        this.updateDashboard();
      } else if (this.currentPage === 'analysis') {
        this.updateAnalysisPage();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      this.showToast('Error deleting expense.', 'error');
    }
};

ExpenseTracker.prototype.addFoodExpense = async function() {
    try {
        const dateInput = document.getElementById('expenseDate');
        const foodSourceSelect = document.getElementById('foodSource');
        const foodDescInput = document.getElementById('foodDescription');
        const paymentMethodSelect = document.getElementById('paymentMethod');
        
        if (!dateInput || !foodSourceSelect || !foodDescInput || !paymentMethodSelect) {
            this.showToast('Some form elements are missing.', 'error');
            return;
        }
        
        const date = new Date(dateInput.value);
        const foodSource = foodSourceSelect.value;
        
        // If Quick Commerce is selected, categorize as Miscellaneous, not Food
        let category = 'Food';
        if (foodSource === 'Quick Commerce') {
            category = 'Miscellaneous';
        }
        
        const description = foodDescInput.value || `${foodSource} food expenses`;
        const paymentMethod = paymentMethodSelect.value;
        const foodTotal = this.calculateFoodTotal();
        
        if (foodTotal <= 0) {
            this.showToast('Please enter at least one valid food expense.', 'warning');
            return;
        }
        
        // Check if there's enough balance for this expense
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        const monthBudget = this.getMonthBudget(month, year);
        const currentBalances = this.getCurrentBalances(month, year);
        
        if (paymentMethod === 'Cash') {
            const cashBalance = monthBudget && monthBudget.initialCashBalance !== undefined 
                ? monthBudget.initialCashBalance 
                : this.settings.defaultCashBalance;
                
            const cashUsed = currentBalances.cashUsed || 0;
            const remainingCash = cashBalance - cashUsed;
            
            if (foodTotal > remainingCash) {
                this.showToast(`Not enough cash balance! Available: ${this.settings.currency}${remainingCash.toFixed(2)}`, 'error');
                return;
            } else if (remainingCash - foodTotal < 200) {
                this.showToast(`Warning: Cash balance will be low after this expense! Remaining: ${this.settings.currency}${(remainingCash - foodTotal).toFixed(2)}`, 'warning');
            }
        } else if (paymentMethod === 'UPI') {
            const bankBalance = monthBudget && monthBudget.initialBankBalance !== undefined 
                ? monthBudget.initialBankBalance 
                : this.settings.defaultBankBalance;
                
            const bankUsed = currentBalances.bankUsed || 0;
            const remainingBank = bankBalance - bankUsed;
            
            if (foodTotal > remainingBank) {
                this.showToast(`Not enough bank balance! Available: ${this.settings.currency}${remainingBank.toFixed(2)}`, 'error');
                return;
            } else if (remainingBank - foodTotal < 500) {
                this.showToast(`Warning: Bank balance will be low after this expense! Remaining: ${this.settings.currency}${(remainingBank - foodTotal).toFixed(2)}`, 'warning');
            }
        } else if (paymentMethod === 'Credit Card') {
            if (!this.settings.creditCardEnabled) {
                this.showToast('Credit card payments are disabled in settings.', 'error');
                return;
            }
            
            const creditUsed = monthBudget ? monthBudget.CreditCardUsed || 0 : 0;
            const creditLimit = monthBudget ? monthBudget.CreditCardBalance || this.settings.defaultCreditLimit : this.settings.defaultCreditLimit;
            const remainingCredit = creditLimit - creditUsed;
            
            if (foodTotal > remainingCredit) {
                this.showToast(`Not enough credit limit! Available: ${this.settings.currency}${remainingCredit.toFixed(2)}`, 'error');
                return;
            } else if (remainingCredit - foodTotal < 1000) {
                this.showToast(`Warning: Credit limit will be low after this expense! Remaining: ${this.settings.currency}${(remainingCredit - foodTotal).toFixed(2)}`, 'warning');
            }
        }
        
        // Create new expense
        const newExpense = {
            Date: date,
            Category: category,
            Subcategory: foodSource,
            Amount: foodTotal,
            Description: description,
            Month: month,
            Year: year,
            PaymentMethod: paymentMethod
        };
        
        // Update balance based on payment method
        await this.updateBalanceForExpense(foodTotal, paymentMethod, date);
        
        // Add to MongoDB and get the saved expense with _id
        await this.addExpenseToMongoDB(newExpense);
        
        // Reset form
        document.getElementById('foodItemsList').value = '';
        document.getElementById('foodDescription').value = '';
        document.getElementById('foodTotal').textContent = `${this.settings.currency}0.00`;
        
        this.showToast(`Added ${foodSource} ${category} expense of ${this.settings.currency}${foodTotal.toFixed(2)}!`, 'success');
        
        // Update UI
        this.updateExpensesTable();
        if (this.currentPage === 'dashboard') {
            this.updateDashboard();
        }
    } catch (error) {
        console.error('Error adding food expense:', error);
        this.showToast('Error adding food expense.', 'error');
    }
};

ExpenseTracker.prototype.addPetrolExpense = async function() {
    try {
        const dateInput = document.getElementById('expenseDate');
        const petrolAmountInput = document.getElementById('petrolAmount');
        const paymentMethodSelect = document.getElementById('petrolPaymentMethod');
        
        if (!dateInput || !petrolAmountInput || !paymentMethodSelect) {
            this.showToast('Some form elements are missing.', 'error');
            return;
        }
        
        const date = new Date(dateInput.value);
        const amount = parseFloat(petrolAmountInput.value) || 0;
        const paymentMethod = paymentMethodSelect.value;
        
        if (amount <= 0) {
            this.showToast('Please enter a valid amount.', 'warning');
            return;
        }
        
        // Create new expense
        const newExpense = {
            Date: date,
            Category: 'Transportation',
            Subcategory: 'Petrol',
            Amount: amount,
            Description: 'Petrol refill',
            Month: date.toLocaleString('default', { month: 'long' }),
            Year: date.getFullYear(),
            PaymentMethod: paymentMethod
        };
        
        // Update balance based on payment method
        await this.updateBalanceForExpense(amount, paymentMethod, date);
        
        // Add to MongoDB and get the saved expense with _id
        await this.addExpenseToMongoDB(newExpense);
        
        // Reset form
        petrolAmountInput.value = '';
        
        this.showToast(`Added Petrol expense of ${this.settings.currency}${amount.toFixed(2)}!`, 'success');
        
        // Update UI
        this.updateExpensesTable();
        if (this.currentPage === 'dashboard') {
            this.updateDashboard();
        }
    } catch (error) {
        console.error('Error adding petrol expense:', error);
        this.showToast('Error adding petrol expense.', 'error');
    }
};

ExpenseTracker.prototype.addMiscExpense = function() {
    try {
        const miscAmountInput = document.getElementById('miscAmount');
        const miscTagSelect = document.getElementById('miscTag');
        const miscDescInput = document.getElementById('miscDescription');
        const miscNotesInput = document.getElementById('miscNotes');
        const paymentMethodSelect = document.getElementById('paymentMethod');
        const customTagInput = document.getElementById('customTag');
        
        if (!miscAmountInput || !miscTagSelect || !miscDescInput || !miscNotesInput || !paymentMethodSelect) {
            this.showToast('Some form elements are missing.', 'error');
            return;
        }
        
        const amount = parseFloat(miscAmountInput.value) || 0;
        let tag = miscTagSelect.value;
        const description = miscDescInput.value || tag;
        const notes = miscNotesInput.value || '';
        const paymentMethod = paymentMethodSelect.value;
        
        if (amount <= 0) {
            this.showToast('Please enter a valid amount.', 'warning');
            return;
        }
        
        // Check if it's "Others" and get custom tag
        if (tag === 'Others' && customTagInput) {
            const customTag = customTagInput.value.trim();
            if (customTag) {
                tag = customTag;
            }
        }
        
        // Determine category based on tag
        let category = 'Miscellaneous';
        if (['Movie', 'Concert', 'Dining Out', 'Shopping', 'Games', 'Other Entertainment'].includes(tag)) {
            category = 'Entertainment';
        }
        
        // For credit card, validate if it's enabled
        if (paymentMethod === 'Credit Card' && !this.settings.creditCardEnabled) {
            this.showToast('Credit card payments are disabled in settings.', 'error');
            return;
        }
        
        // Add to misc expenses array
        this.miscExpenses.push({
            Amount: amount,
            Tag: tag,
            Category: category,
            Description: description,
            Notes: notes,
            PaymentMethod: paymentMethod
        });
        
        // Reset form
        miscAmountInput.value = '';
        miscDescInput.value = '';
        miscNotesInput.value = '';
        if (customTagInput) customTagInput.value = '';
        
        // Reset the select to first option
        miscTagSelect.selectedIndex = 0;
        
        // Hide custom tag container
        const customTagContainer = document.getElementById('customTagContainer');
        if (customTagContainer) {
            customTagContainer.classList.add('d-none');
        }
        
        // Update misc expenses list
        this.updateMiscExpensesList();
    } catch (error) {
        console.error('Error adding miscellaneous expense:', error);
        this.showToast('Error adding miscellaneous expense.', 'error');
    }
};

ExpenseTracker.prototype.updateMiscExpensesList = function() {
    try {
        const container = document.getElementById('miscExpensesList');
        const table = document.getElementById('miscExpensesTable')?.getElementsByTagName('tbody')[0];
        const totalElement = document.getElementById('miscExpensesTotal');
        
        if (!container || !table || !totalElement) return;
        
        if (this.miscExpenses.length === 0) {
            container.classList.add('d-none');
            return;
        }
        
        container.classList.remove('d-none');
        table.innerHTML = '';
        
        // Calculate total
        let total = 0;
        
        this.miscExpenses.forEach((expense, index) => {
            total += expense.Amount;
            
            const row = table.insertRow();
            
            // Tag cell
            const tagCell = row.insertCell(0);
            const categoryClass = expense.Category === 'Entertainment' ? 'category-entertainment' : 'category-miscellaneous';
            tagCell.innerHTML = `<span class="category-tag ${categoryClass}">${expense.Tag}</span>`;
            
            // Description cell
            const descCell = row.insertCell(1);
            if (expense.Notes) {
                descCell.textContent = `${expense.Description} - ${expense.Notes}`;
            } else {
                descCell.textContent = expense.Description;
            }
            
            // Amount cell
            const amountCell = row.insertCell(2);
            amountCell.textContent = `${this.settings.currency}${expense.Amount.toFixed(2)}`;
            amountCell.className = 'text-end';
            
            // Actions cell
            const actionsCell = row.insertCell(3);
            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'btn btn-sm btn-outline-danger';
            deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';
            deleteBtn.onclick = () => this.removeMiscExpense(index);
            actionsCell.appendChild(deleteBtn);
        });
        
        // Update total
        totalElement.textContent = `${this.settings.currency}${total.toFixed(2)}`;
    } catch (error) {
        console.error('Error updating miscellaneous expenses list:', error);
    }
};

ExpenseTracker.prototype.removeMiscExpense = function(index) {
    try {
        this.miscExpenses.splice(index, 1);
        this.updateMiscExpensesList();
    } catch (error) {
        console.error('Error removing miscellaneous expense:', error);
    }
};

ExpenseTracker.prototype.saveMiscExpenses = async function() {
    try {
        if (this.miscExpenses.length === 0) {
            this.showToast('No expenses to save.', 'warning');
            return;
        }
        
        const dateInput = document.getElementById('expenseDate');
        if (!dateInput) {
            this.showToast('Date input is missing.', 'error');
            return;
        }
        
        const date = new Date(dateInput.value);
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        
        // Get month budget for balance checks
        const monthBudget = this.getMonthBudget(month, year);
        const currentBalances = this.getCurrentBalances(month, year);
        
        // Group by payment method for balance checks
        const expensesByMethod = {
            'Cash': [],
            'UPI': [],
            'Credit Card': []
        };
        
        this.miscExpenses.forEach(expense => {
            expensesByMethod[expense.PaymentMethod].push(expense);
        });
        
        // Check balances for each payment method...
        
        // If all checks pass, add all expenses to MongoDB
        for (const expense of this.miscExpenses) {
            const newExpense = {
                Date: date,
                Category: expense.Category,
                Subcategory: expense.Tag,
                Amount: expense.Amount,
                Description: expense.Notes ? `${expense.Description} - ${expense.Notes}` : expense.Description,
                Month: month,
                Year: year,
                PaymentMethod: expense.PaymentMethod
            };
            
            // Add to MongoDB
            await this.addExpenseToMongoDB(newExpense);
            
            // Update balance based on payment method
            await this.updateBalanceForExpense(expense.Amount, expense.PaymentMethod, date);
        }
        
        // Reset misc expenses
        this.miscExpenses = [];
        this.updateMiscExpensesList();
        
        this.showToast(`Saved all expenses for ${this.formatDate(date)}!`, 'success');
        
        // Update UI
        this.updateExpensesTable();
        if (this.currentPage === 'dashboard') {
            this.updateDashboard();
        }
    } catch (error) {
        console.error('Error saving miscellaneous expenses:', error);
        this.showToast('Error saving miscellaneous expenses.', 'error');
    }
};

ExpenseTracker.prototype.addBillExpense = async function(billType) {
    try {
        let amountElementId, descriptionText;
        let category = 'Bills';
        
        switch(billType) {
            case 'Credit Card':
                amountElementId = 'creditCardBillAmount';
                descriptionText = 'Monthly credit card bill';
                break;
            case 'Electricity':
                amountElementId = 'electricityBillAmount';
                descriptionText = 'Monthly electricity bill';
                break;
            case 'Water Bill':
                amountElementId = 'waterBillAmount';
                descriptionText = 'Monthly water bill';
                break;
            case 'Laundry':
                amountElementId = 'laundryAmount';
                descriptionText = 'Laundry expense';
                break;
            case 'SIP':
                amountElementId = 'sipAmount';
                descriptionText = 'Monthly SIP investment';
                break;
            case 'Rent':
                amountElementId = 'rentAmount';
                descriptionText = 'Monthly rent payment';
                break;
            default:
                this.showToast('Unknown bill type.', 'error');
                return;
        }
        
        // Check if "Already Paid" is toggled on
        const checkboxId = billType === 'SIP' ? 'sipPaid' :
                        billType === 'Rent' ? 'rentPaid' :
                        billType === 'Laundry' ? 'laundryPaid' : 
                        billType === 'Water Bill' ? 'waterBillPaid' : 
                        billType.toLowerCase().replace(' ', '') + 'BillPaid';
        
        const paidCheckbox = document.getElementById(checkboxId);
        let alreadyPaid = paidCheckbox ? paidCheckbox.checked : false;
        
        // If already paid, just update the status and don't add expense
        if (alreadyPaid) {
            // Update budget data for bill payment status without adding expense
            const date = new Date();
            const month = date.toLocaleString('default', { month: 'long' });
            const year = date.getFullYear();
            
            await this.updateBillPaymentStatus(billType, true, 0, month, year);
            await this.saveData();
            
            this.showToast(`${billType} marked as paid.`, 'success');
            
            // Update dashboard if visible
            if (this.currentPage === 'dashboard') {
                this.updateDashboard();
            }
            
            return;
        }
        
        // Get form values
        const amountInput = document.getElementById(amountElementId);
        const dateInput = document.getElementById('expenseDate');
        const paymentMethodSelect = document.getElementById(billType === 'SIP' ? 'sipPaymentMethod' : 
                                                         billType === 'Rent' ? 'rentPaymentMethod' : 
                                                         billType === 'Laundry' ? 'laundryPaymentMethod' : 
                                                         billType.toLowerCase().replace(' ', '') + 'PaymentMethod');
        
        if (!amountInput || !dateInput || !paymentMethodSelect) {
            this.showToast('Some form elements are missing.', 'error');
            return;
        }
        
        const amount = parseFloat(amountInput.value) || 0;
        const date = new Date(dateInput.value);
        const paymentMethod = paymentMethodSelect.value;
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        
        if (amount <= 0) {
            this.showToast('Please enter a valid amount.', 'warning');
            return;
        }
        
        // For credit card, validate if it's enabled
        if (paymentMethod === 'Credit Card' && !this.settings.creditCardEnabled) {
            this.showToast('Credit card payments are disabled in settings.', 'error');
            return;
        }
        
        // Create new expense
        const newExpense = {
            Date: date,
            Category: category,
            Subcategory: billType,
            Amount: amount,
            Description: descriptionText,
            Month: month,
            Year: year,
            PaymentMethod: paymentMethod
        };
        
        // Add to MongoDB
        await this.addExpenseToMongoDB(newExpense);
        
        // Update balance based on payment method
        await this.updateBalanceForExpense(amount, paymentMethod, date);
        
        // Update budget data for bill payment status
        await this.updateBillPaymentStatus(billType, true, amount, month, year);
        
        // Reset form
        amountInput.value = '';
        
        this.showToast(`Added ${billType} payment of ${this.settings.currency}${amount.toFixed(2)}!`, 'success');
        
        // Update UI
        this.updateExpensesTable();
        if (this.currentPage === 'dashboard') {
            this.updateDashboard();
        }
    } catch (error) {
        console.error('Error adding bill expense:', error);
        this.showToast('Error adding bill expense.', 'error');
    }
};

ExpenseTracker.prototype.calculateFoodTotal = function() {
    try {
        const itemsText = document.getElementById('foodItemsList')?.value || '';
        if (!itemsText) return 0;
        
        const lines = itemsText.trim().split('\n');
        let total = 0;
        
        for (const line of lines) {
            const amount = parseFloat(line.trim());
            if (!isNaN(amount)) {
                total += amount;
            }
        }
        
        return total;
    } catch (error) {
        console.error('Error calculating food total:', error);
        return 0;
    }
};
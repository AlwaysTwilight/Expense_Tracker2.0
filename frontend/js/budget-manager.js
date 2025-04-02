// Budget Management Functions

ExpenseTracker.prototype.getMonthBudget = function(month, year) {
    return this.budgets.find(budget => 
        budget.Month === month && budget.Year === year
    );
};

ExpenseTracker.prototype.loadBudgetForm = function(month, year) {
    try {
        const monthBudget = this.getMonthBudget(month, year);
        
        const monthlyBudgetInput = document.getElementById('monthlyBudget');
        const monthlySavingsGoalInput = document.getElementById('monthlySavingsGoal');
        const creditCardLimitInput = document.getElementById('creditCardLimit');
        const previousMonthCreditInput = document.getElementById('previousMonthCredit');
        const initialCashBalanceInput = document.getElementById('initialCashBalance');
        const initialBankBalanceInput = document.getElementById('initialBankBalance');
        
        if (!monthlyBudgetInput || !creditCardLimitInput || !previousMonthCreditInput || 
            !initialCashBalanceInput || !initialBankBalanceInput || !monthlySavingsGoalInput) {
            return;
        }
        
        // Make monthly budget read-only
        if (monthlyBudgetInput) {
            monthlyBudgetInput.readOnly = true;
            monthlyBudgetInput.classList.add('bg-light');
        }
        
        // Always use defaultCashBalance/defaultBankBalance as initial values
        // unless custom values have been set for this month
        let cashBalance = this.settings.defaultCashBalance;
        let bankBalance = this.settings.defaultBankBalance;
        
        if (monthBudget) {
            // Only use custom values if they have been explicitly set
            if (monthBudget.initialCashBalance !== undefined) {
                cashBalance = monthBudget.initialCashBalance;
            }
            
            if (monthBudget.initialBankBalance !== undefined) {
                bankBalance = monthBudget.initialBankBalance;
            }
            
            // Set form values from budget
            initialCashBalanceInput.value = cashBalance;
            initialBankBalanceInput.value = bankBalance;
            
            // Calculate total budget (this should match TotalBudget if it hasn't been modified)
            const totalBudget = cashBalance + bankBalance;
            monthlyBudgetInput.value = totalBudget;
            
            // Set other form fields
            monthlySavingsGoalInput.value = monthBudget.SavingsGoal || this.settings.defaultSavingsGoal;
            creditCardLimitInput.value = monthBudget.CreditCardBalance || this.settings.defaultCreditLimit;
            previousMonthCreditInput.value = monthBudget.PreviousMonthCredit || 0;
        } else {
            // No budget exists, use settings defaults
            initialCashBalanceInput.value = cashBalance;
            initialBankBalanceInput.value = bankBalance;
            monthlyBudgetInput.value = cashBalance + bankBalance;
            monthlySavingsGoalInput.value = this.settings.defaultSavingsGoal;
            creditCardLimitInput.value = this.settings.defaultCreditLimit;
            previousMonthCreditInput.value = 0;
        }
        
        this.validateBudgetInputs();
        
        // Update credit card visibility
        setTimeout(() => this.updateCreditCardVisibility(), 0);
    } catch (error) {
        console.error('Error loading budget form:', error);
    }
};

ExpenseTracker.prototype.validateBudgetInputs = function() {
    try {
        const initialCashBalanceInput = document.getElementById('initialCashBalance');
        const initialBankBalanceInput = document.getElementById('initialBankBalance');
        const monthlyBudgetInput = document.getElementById('monthlyBudget');
        
        if (!initialCashBalanceInput || !initialBankBalanceInput || !monthlyBudgetInput) {
            return false;
        }
        
        const cashBalance = parseFloat(initialCashBalanceInput.value) || 0;
        const bankBalance = parseFloat(initialBankBalanceInput.value) || 0;
        const totalCashBank = cashBalance + bankBalance;
        
        const totalCashBankElement = document.getElementById('totalCashBank');
        if (totalCashBankElement) {
            totalCashBankElement.textContent = `Total: ${this.settings.currency}${totalCashBank.toFixed(2)}`;
            totalCashBankElement.classList.remove('text-danger');
            totalCashBankElement.classList.add('text-success');
        }
        
        // Update monthly budget to match cash + bank
        monthlyBudgetInput.value = totalCashBank.toFixed(0);
        
        return true;
    } catch (error) {
        console.error('Error validating budget inputs:', error);
        return false;
    }
};

ExpenseTracker.prototype.getBudgetDetails = function(month, year) {
    try {
        // Get month's budget
        const monthBudget = this.getMonthBudget(month, year);
        
        // Default values for when monthBudget is null
        const defaultValues = {
            total_budget: this.settings.defaultBudget || 0,
            daily_allowance: 500,
            remaining_budget: this.settings.defaultBudget || 0,
            budget_used_pct: 0,
            fixed_expenses: 0,
            variable_expenses: 0,
            daily_expenses: 0,
            savings_goal: 0,
            has_savings_goal: false,
            effective_total: this.settings.defaultBudget || 0,
            days_left: 30,
            credit_card_balance: this.settings.defaultCreditLimit || 0,
            credit_card_used: 0,
            credit_card_remaining: this.settings.defaultCreditLimit || 0,
            cash_balance: this.settings.defaultCashBalance || 0,
            bank_balance: this.settings.defaultBankBalance || 0
        };
        
        if (!monthBudget) {
            return defaultValues;
        }
        
        const totalBudget = monthBudget.TotalBudget || this.settings.defaultBudget || 0;
        
        // Use initialCashBalance/initialBankBalance if set in budget, otherwise use defaults
        const cashBalance = monthBudget.initialCashBalance !== undefined ? 
            monthBudget.initialCashBalance : this.settings.defaultCashBalance || 0;
            
        const bankBalance = monthBudget.initialBankBalance !== undefined ?
            monthBudget.initialBankBalance : this.settings.defaultBankBalance || 0;
        
        // Credit card details
        const creditCardBalance = monthBudget.CreditCardBalance || this.settings.defaultCreditLimit || 0;
        const creditCardUsed = monthBudget.CreditCardUsed || 0;
        const creditCardRemaining = creditCardBalance - creditCardUsed;
        
        // Check if savings goal exists
        const hasSavingsGoal = monthBudget.HasSavingsGoal || false;
        const savingsGoal = hasSavingsGoal ? monthBudget.SavingsGoal || 0 : 0;
        
        // Calculate effective total (budget minus savings)
        let effectiveTotal = totalBudget;
        if (hasSavingsGoal) {
            effectiveTotal = totalBudget - savingsGoal;
        }
        
        // Get all expenses from the expense data for the current month
        const allExpenses = this.expenses.filter(expense => 
            expense.Month === month && expense.Year === year
        );
        
        // Don't include SIP and rent automatically as fixed expenses
        // Instead, we'll only count them if they appear in the actual expenses
        const fixedExpenses = allExpenses
            .filter(expense => 
                (expense.Subcategory === 'SIP' || expense.Subcategory === 'Rent')
            )
            .reduce((sum, expense) => sum + expense.Amount, 0);
        
        // Filter only Cash/UPI expenses for budget calculations (exclude credit card)
        const cashUpiExpenses = allExpenses.filter(expense => 
            expense.PaymentMethod === 'Cash' || expense.PaymentMethod === 'UPI'
        );
        
        // For UI display, categorize expenses from the expense data
        const variableExpenses = cashUpiExpenses
            .filter(expense => 
                ['Bills', 'Services'].includes(expense.Category) && 
                !['SIP', 'Rent'].includes(expense.Subcategory) 
            )
            .reduce((sum, expense) => sum + expense.Amount, 0);
        
        const dailyExpenses = cashUpiExpenses
            .filter(expense => !['Bills', 'Services'].includes(expense.Category))
            .reduce((sum, expense) => sum + expense.Amount, 0);
        
        // Total of all Cash/UPI expenses from the expense data
        const totalExpensesFromData = variableExpenses + dailyExpenses + fixedExpenses;
        
        // Calculate remaining budget
        const remainingBudget = effectiveTotal - totalExpensesFromData;
        
        // Calculate daily spending allowance for the remaining days in the month
        const today = new Date();
        const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const daysLeft = Math.max(0, lastDayOfMonth - today.getDate() + 1);
        
        let dailyAllowance = 0;
        if (daysLeft > 0) {
            // If remaining budget is negative, daily allowance is 0
            dailyAllowance = Math.max(0, remainingBudget / daysLeft);
        }
        
        // Calculate budget used percentage based on effective total (excluding savings)
        // Prevent division by zero
        const budgetUsedPct = effectiveTotal > 0 ? Math.min(100, (totalExpensesFromData / effectiveTotal * 100)) : 0;
        
        return {
            total_budget: totalBudget,
            daily_allowance: dailyAllowance,
            remaining_budget: remainingBudget,
            budget_used_pct: budgetUsedPct,
            fixed_expenses: fixedExpenses,
            variable_expenses: variableExpenses,
            daily_expenses: dailyExpenses,
            savings_goal: savingsGoal,
            has_savings_goal: hasSavingsGoal,
            effective_total: effectiveTotal,
            days_left: daysLeft,
            credit_card_balance: creditCardBalance,
            credit_card_used: creditCardUsed,
            credit_card_remaining: creditCardRemaining,
            cash_balance: cashBalance,
            bank_balance: bankBalance
        };
    } catch (error) {
        console.error('Error getting budget details:', error);
        return defaultValues;
    }
};

ExpenseTracker.prototype.updateBudget = async function() {
    try {
        const monthInput = document.getElementById('budgetMonth');
        const yearInput = document.getElementById('budgetYear');
        const monthlyBudgetInput = document.getElementById('monthlyBudget');
        const initialCashBalanceInput = document.getElementById('initialCashBalance');
        const initialBankBalanceInput = document.getElementById('initialBankBalance');
        const monthlySavingsGoalInput = document.getElementById('monthlySavingsGoal');
        const creditCardLimitInput = document.getElementById('creditCardLimit');
        const previousMonthCreditInput = document.getElementById('previousMonthCredit');
        
        if (!monthInput || !yearInput || !monthlyBudgetInput || 
            !initialCashBalanceInput || !initialBankBalanceInput || 
            !monthlySavingsGoalInput || !creditCardLimitInput || 
            !previousMonthCreditInput) {
            this.showToast('Some budget form elements are missing.', 'error');
            return;
        }
        
        // Validate that cash + bank equals monthly budget
        if (!this.validateBudgetInputs()) {
            this.showToast('Cash + Bank should equal Monthly Budget.', 'warning');
            return;
        }
        
        const month = monthInput.value;
        const year = parseInt(yearInput.value);
        
        // Get values from form
        const initialCashBalance = parseFloat(initialCashBalanceInput.value) || 0;
        const initialBankBalance = parseFloat(initialBankBalanceInput.value) || 0;
        const monthlyBudget = parseFloat(monthlyBudgetInput.value) || 0;
        const monthlySavingsGoal = parseFloat(monthlySavingsGoalInput.value) || 0;
        const creditCardLimit = parseFloat(creditCardLimitInput.value) || 0;
        const previousMonthCredit = parseFloat(previousMonthCreditInput.value) || 0;
        
        // Update or add new budget entry
        let monthBudget = this.getMonthBudget(month, year);
        
        if (monthBudget) {
            // Update existing budget properties
            monthBudget.initialCashBalance = initialCashBalance;
            monthBudget.initialBankBalance = initialBankBalance;
            monthBudget.TotalBudget = monthlyBudget;
            monthBudget.SavingsGoal = monthlySavingsGoal;
            monthBudget.HasSavingsGoal = monthlySavingsGoal > 0;
            monthBudget.CreditCardBalance = creditCardLimit;
            monthBudget.PreviousMonthCredit = previousMonthCredit;
        } else {
            // Create new budget entry
            monthBudget = {
                Month: month,
                Year: year,
                TotalBudget: monthlyBudget,
                initialCashBalance: initialCashBalance,
                initialBankBalance: initialBankBalance,
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
                SavingsGoal: monthlySavingsGoal,
                HasSavingsGoal: monthlySavingsGoal > 0,
                CreditCardBalance: creditCardLimit,
                CreditCardUsed: 0,
                PreviousMonthCredit: previousMonthCredit
            };
            
            this.budgets.push(monthBudget);
        }
        
        await this.saveData();
        this.showToast(`Budget updated for ${month} ${year}!`, 'success');
        
        // Update UI if needed
        if (month === this.currentMonth && year === this.currentYear && this.currentPage === 'dashboard') {
            this.updateDashboard();
        }
        
        if (this.currentPage === 'budget') {
            this.updateBudgetHistory();
        }
    } catch (error) {
        console.error('Error updating budget:', error);
        this.showToast('Error updating budget.', 'error');
    }
};

ExpenseTracker.prototype.updateSavingsGoal = async function() {
    try {
        const setSavingsGoal = document.getElementById('setSavingsGoal');
        const savingsGoalAmount = document.getElementById('savingsGoalAmount');
        
        if (!setSavingsGoal || !savingsGoalAmount) {
            this.showToast('Savings goal form elements are missing.', 'error');
            return;
        }
        
        const setSavings = setSavingsGoal.checked;
        const savingsAmount = setSavings ? parseFloat(savingsGoalAmount.value) || 0 : 0;
        
        let monthBudget = this.getMonthBudget(this.currentMonth, this.currentYear);
        
        if (!monthBudget) {
            // Create a new budget entry with default values
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
                SavingsGoal: savingsAmount,
                HasSavingsGoal: setSavings,
                CreditCardBalance: this.settings.defaultCreditLimit,
                CreditCardUsed: 0,
                PreviousMonthCredit: 0,
                initialCashBalance: this.settings.defaultCashBalance,
                initialBankBalance: this.settings.defaultBankBalance
            };
            
            this.budgets.push(monthBudget);
        } else {
            // Update existing budget
            monthBudget.SavingsGoal = savingsAmount;
            monthBudget.HasSavingsGoal = setSavings;
        }
        
        await this.saveData();
        this.showToast(`Savings goal ${setSavings ? 'set to ' + this.settings.currency + savingsAmount : 'removed'} for ${this.currentMonth}!`, 'success');
        
        // Update dashboard if visible
        if (this.currentPage === 'dashboard') {
            this.updateDashboard();
        }
    } catch (error) {
        console.error('Error updating savings goal:', error);
        this.showToast('Error updating savings goal.', 'error');
    }
};

ExpenseTracker.prototype.updateBudgetHistory = function() {
    try {
        // Get unique month/year combinations from budgets
        const budgetMonths = this.budgets.map(budget => ({
            month: budget.Month,
            year: budget.Year
        }));
        
        // Sort by year and month
        budgetMonths.sort((a, b) => {
            if (a.year !== b.year) {
                return b.year - a.year; // Most recent year first
            }
            
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
            return months.indexOf(b.month) - months.indexOf(a.month); // Most recent month first
        });
        
        // Update budget history table
        const table = document.getElementById('budgetHistoryTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;
        
        table.innerHTML = '';
        
        // Data for chart
        const chartMonths = [];
        const budgetData = [];
        const expenseData = [];
        const savingsData = [];
        
        budgetMonths.forEach(({month, year}) => {
            const monthBudget = this.getMonthBudget(month, year);
            if (!monthBudget) return;
            
            const budgetDetails = this.getBudgetDetails(month, year);
            
            // Calculate actual expenses
            const monthExpenses = this.expenses.filter(expense => 
                expense.Month === month && expense.Year === year
            );
            
            const totalExpenses = monthExpenses.reduce((sum, expense) => sum + expense.Amount, 0) + 
                                budgetDetails.fixed_expenses;
            
            // Calculate savings
            const actualSavings = Math.max(0, monthBudget.TotalBudget - totalExpenses);
            
            // Create row
            const row = table.insertRow();
            
            // Month/Year cell
            const monthYearCell = row.insertCell(0);
            monthYearCell.textContent = `${month} ${year}`;
            
            // Total Budget cell
            const budgetCell = row.insertCell(1);
            budgetCell.textContent = `${this.settings.currency}${(monthBudget.TotalBudget || 0).toFixed(2)}`;
            budgetCell.className = 'text-end';
            
            // Expenses cell
            const expensesCell = row.insertCell(2);
            expensesCell.textContent = `${this.settings.currency}${totalExpenses.toFixed(2)}`;
            expensesCell.className = 'text-end';
            
            // Savings cell
            const savingsCell = row.insertCell(3);
            savingsCell.textContent = `${this.settings.currency}${actualSavings.toFixed(2)}`;
            savingsCell.className = 'text-end';
            
            // Savings Goal cell
            const savingsGoalCell = row.insertCell(4);
            if (monthBudget.HasSavingsGoal) {
                savingsGoalCell.textContent = `${this.settings.currency}${(monthBudget.SavingsGoal || 0).toFixed(2)}`;
            } else {
                savingsGoalCell.textContent = 'Not set';
                savingsGoalCell.className = 'text-muted';
            }
            savingsGoalCell.className = 'text-end';
            
            // Status cell
            const statusCell = row.insertCell(5);
            if (monthBudget.HasSavingsGoal && actualSavings >= monthBudget.SavingsGoal) {
                statusCell.innerHTML = '<span class="badge bg-success">Goal Achieved</span>';
            } else if (monthBudget.HasSavingsGoal) {
                statusCell.innerHTML = '<span class="badge bg-danger">Goal Not Met</span>';
            } else {
                statusCell.innerHTML = '<span class="badge bg-secondary">No Goal Set</span>';
            }
            
            // Add data for chart
            chartMonths.push(`${month.substring(0, 3)} ${year}`);
            budgetData.push(monthBudget.TotalBudget || 0);
            expenseData.push(totalExpenses);
            savingsData.push(actualSavings);
        });
        
        // Create budget history chart
        this.createBudgetHistoryChart(chartMonths.reverse(), 
                                    budgetData.reverse(), 
                                    expenseData.reverse(), 
                                    savingsData.reverse());
    } catch (error) {
        console.error('Error updating budget history:', error);
    }
};

ExpenseTracker.prototype.getCurrentBalances = function(month, year) {
    try {
        const monthBudget = this.getMonthBudget(month, year);
        
        // Default values if no budget exists
        let initialCashBalance = this.settings.defaultCashBalance || 0;
        let initialBankBalance = this.settings.defaultBankBalance || 0;
        
        // Use budget values if available
        if (monthBudget) {
            if (monthBudget.initialCashBalance !== undefined) {
                initialCashBalance = monthBudget.initialCashBalance;
            }
            
            if (monthBudget.initialBankBalance !== undefined) {
                initialBankBalance = monthBudget.initialBankBalance;
            }
        }
        
        // Get current month's expenses
        const monthExpenses = this.expenses.filter(expense => 
            expense.Month === month && expense.Year === year
        );
        
        // Calculate totals by payment method
        const cashExpenses = monthExpenses
            .filter(expense => expense.PaymentMethod === 'Cash')
            .reduce((sum, expense) => sum + expense.Amount, 0);
            
        const upiExpenses = monthExpenses
            .filter(expense => expense.PaymentMethod === 'UPI')
            .reduce((sum, expense) => sum + expense.Amount, 0);
            
        const creditCardExpenses = monthBudget ? monthBudget.CreditCardUsed || 0 : 0;
        
        // Calculate remaining balances
        const cashRemaining = initialCashBalance - cashExpenses;
        const bankRemaining = initialBankBalance - upiExpenses;
        
        return {
            cashUsed: cashExpenses,
            bankUsed: upiExpenses,
            creditUsed: creditCardExpenses,
            cashRemaining: cashRemaining,
            bankRemaining: bankRemaining,
            initialCashBalance: initialCashBalance,
            initialBankBalance: initialBankBalance
        };
    } catch (error) {
        console.error('Error calculating current balances:', error);
        return {
            cashUsed: 0,
            bankUsed: 0,
            creditUsed: 0,
            cashRemaining: this.settings.defaultCashBalance || 0,
            bankRemaining: this.settings.defaultBankBalance || 0,
            initialCashBalance: this.settings.defaultCashBalance || 0,
            initialBankBalance: this.settings.defaultBankBalance || 0
        };
    }
};

ExpenseTracker.prototype.calculatePaymentMethodMetrics = function(month, year) {
    try {
        // Get the month's budget with cash balance
        const monthBudget = this.getMonthBudget(month, year);
        let initialCashBalance = this.settings.initialCashBalance;
        
        if (monthBudget && monthBudget.initialCashBalance !== undefined) {
            initialCashBalance = monthBudget.initialCashBalance;
        }
        
        // Get expenses for the current month
        const monthExpenses = this.expenses.filter(expense => 
            expense.Month === month && expense.Year === year
        );
        
        // Calculate totals for each payment method
        const cashExpenses = monthExpenses
            .filter(expense => expense.PaymentMethod === 'Cash')
            .reduce((sum, expense) => sum + expense.Amount, 0);
        
        const upiExpenses = monthExpenses
            .filter(expense => expense.PaymentMethod === 'UPI')
            .reduce((sum, expense) => sum + expense.Amount, 0);
        
        const creditCardExpenses = monthExpenses
            .filter(expense => expense.PaymentMethod === 'Credit Card')
            .reduce((sum, expense) => sum + expense.Amount, 0);
        
        // Calculate remaining cash balance
        const cashBalance = initialCashBalance - cashExpenses;
        
        return {
            cashTotal: cashExpenses,
            upiTotal: upiExpenses,
            creditCardTotal: creditCardExpenses,
            cashBalance: cashBalance
        };
    } catch (error) {
        console.error('Error calculating payment method metrics:', error);
        return {
            cashTotal: 0,
            upiTotal: 0,
            creditCardTotal: 0,
            cashBalance: this.settings.initialCashBalance
        };
    }
};

ExpenseTracker.prototype.updateCreditCardUsage = function(month, year, amount) {
    try {
        const monthBudget = this.getMonthBudget(month, year);
        
        if (monthBudget) {
            // Add to current credit card usage
            monthBudget.CreditCardUsed = (monthBudget.CreditCardUsed || 0) + amount;
            this.saveData();
        }
    } catch (error) {
        console.error('Error updating credit card usage:', error);
    }
};
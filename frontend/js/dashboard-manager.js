// Dashboard Management Functions

ExpenseTracker.prototype.updateDashboard = function() {
    try {
        // Get budget details for current month
        const budgetDetails = this.getBudgetDetails(this.currentMonth, this.currentYear);
        
        // Get current balances including remaining amounts
        const currentBalances = this.getCurrentBalances(this.currentMonth, this.currentYear);
        
        // Update budget metrics, showing available budget after savings goal
        const remainingBudget = document.getElementById('remainingBudget');
        const dailyAllowance = document.getElementById('dailyAllowance');
        const daysLeft = document.getElementById('daysLeft');
        const budgetUsed = document.getElementById('budgetUsed');
        const totalBudget = document.getElementById('totalBudget');
        
        // Never show negative remaining budget - display as 0 instead
        if (remainingBudget) {
            const displayRemainingBudget = Math.max(0, budgetDetails.remaining_budget);
            remainingBudget.textContent = `${this.settings.currency}${displayRemainingBudget.toFixed(2)}`;
        }
        
        if (dailyAllowance) dailyAllowance.textContent = `${this.settings.currency}${budgetDetails.daily_allowance.toFixed(2)}`;
        if (daysLeft) daysLeft.textContent = `${budgetDetails.days_left || 0} days left`;
        if (budgetUsed) budgetUsed.textContent = `${budgetDetails.budget_used_pct.toFixed(1)}%`;
        
        // Update total budget display to include savings info if there's a savings goal
        if (totalBudget) {
            if (budgetDetails.has_savings_goal && budgetDetails.savings_goal > 0) {
                totalBudget.textContent = `Total: ${this.settings.currency}${budgetDetails.total_budget.toFixed(2)} (Savings: ${this.settings.currency}${budgetDetails.savings_goal.toFixed(2)})`;
            } else {
                totalBudget.textContent = `Total: ${this.settings.currency}${budgetDetails.effective_total.toFixed(2)}`;
            }
        }
        
        // Update payment method cards to show REMAINING balances
        const cashBalance = document.getElementById('cashBalance');
        const bankBalance = document.getElementById('bankBalance');
        const creditAvailable = document.getElementById('creditAvailable');
        
        // Use the remaining balances instead of initial balances
        if (cashBalance) cashBalance.textContent = `${this.settings.currency}${currentBalances.cashRemaining.toFixed(2)}`;
        if (bankBalance) bankBalance.textContent = `${this.settings.currency}${currentBalances.bankRemaining.toFixed(2)}`;
        if (creditAvailable) creditAvailable.textContent = `${this.settings.currency}${budgetDetails.credit_card_remaining.toFixed(2)}`;
        
        // Update used amounts
        const cashUsed = document.getElementById('cashUsed');
        const bankUsed = document.getElementById('bankUsed');
        const creditUsed = document.getElementById('creditUsed');
        
        if (cashUsed) cashUsed.textContent = `${this.settings.currency}${currentBalances.cashUsed.toFixed(2)}`;
        if (bankUsed) bankUsed.textContent = `${this.settings.currency}${currentBalances.bankUsed.toFixed(2)}`;
        if (creditUsed) creditUsed.textContent = `${this.settings.currency}${currentBalances.creditUsed.toFixed(2)}`;
        
        // Update progress bar
        const progressBar = document.getElementById('budgetProgressBar');
        if (progressBar) {
            progressBar.style.width = `${Math.min(100, budgetDetails.budget_used_pct)}%`;
            
            // Change progress bar color based on percentage used
            if (budgetDetails.budget_used_pct > 90) {
                progressBar.className = 'progress-bar bg-danger';
            } else if (budgetDetails.budget_used_pct > 75) {
                progressBar.className = 'progress-bar bg-warning';
            } else {
                progressBar.className = 'progress-bar bg-success';
            }
        }
        
        // Add savings warning alert when needed
        const alertsContainer = document.getElementById('alertsContainer');
        const savingsWarningAlert = document.getElementById('savingsWarningAlert');
        const savingsInfoAlert = document.getElementById('savingsInfoAlert');
        
        if (alertsContainer && savingsWarningAlert && savingsInfoAlert) {
            // Hide both alerts by default
            savingsWarningAlert.classList.add('d-none');
            savingsInfoAlert.classList.add('d-none');
            
            // Check if savings is being used (when remaining budget is negative or zero)
            if (budgetDetails.remaining_budget <= 0 && budgetDetails.has_savings_goal && budgetDetails.savings_goal > 0) {
                const savingsBeingUsed = Math.min(budgetDetails.savings_goal, Math.abs(budgetDetails.remaining_budget));
                const savingsRemaining = Math.max(0, budgetDetails.savings_goal - Math.abs(budgetDetails.remaining_budget));
                
                // Update the warning text
                const savingsWarningText = document.getElementById('savingsWarningText');
                if (savingsWarningText) {
                    savingsWarningText.innerHTML = `You've exceeded your budget by ${this.settings.currency}${Math.abs(budgetDetails.remaining_budget).toFixed(2)} and are now using your savings. 
                    ${this.settings.currency}${savingsBeingUsed.toFixed(2)} from your savings goal of ${this.settings.currency}${budgetDetails.savings_goal.toFixed(2)} is being used.
                    Remaining savings: ${this.settings.currency}${savingsRemaining.toFixed(2)}`;
                }
                
                // Show the warning alert
                savingsWarningAlert.classList.remove('d-none');
            } 
            // Show info about savings goal if it exists but isn't being used yet
            else if (budgetDetails.has_savings_goal && budgetDetails.savings_goal > 0) {
                // Update the info text
                const savingsInfoText = document.getElementById('savingsInfoText');
                if (savingsInfoText) {
                    savingsInfoText.innerHTML = `You have a savings goal of ${this.settings.currency}${budgetDetails.savings_goal.toFixed(2)} for this month. 
                    This amount is reserved from your total budget.`;
                }
                
                // Show the info alert
                savingsInfoAlert.classList.remove('d-none');
            }
        }
        
        // NEW: Calculate and display today's expenses
        this.updateTodayExpenses();
        
        // Update recent transactions
        this.updateRecentTransactions();
        
        // Update charts
        this.updateDashboardCharts();
        
    } catch (error) {
        console.error('Error updating dashboard:', error);
        this.showToast('Error updating dashboard.', 'error');
    }
};

ExpenseTracker.prototype.updateDashboardCharts = function() {
    try {
        // Filter expenses for current month
        const currentMonthExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.Date);
            return expenseDate.getMonth() === this.currentDate.getMonth() &&
                   expenseDate.getFullYear() === this.currentDate.getFullYear();
        });
        
        // Destroy existing charts
        if (this.chartInstances.expenseCategoryChart) {
            this.chartInstances.expenseCategoryChart.destroy();
        }
        
        if (this.chartInstances.expenseTrendChart) {
            this.chartInstances.expenseTrendChart.destroy();
        }
        
        // Create category pie chart
        this.createCategoryChart(currentMonthExpenses, 'expenseCategoryChart');
        
        // Create daily expense trend chart
        this.createTrendChart(currentMonthExpenses, 'expenseTrendChart');
    } catch (error) {
        console.error('Error updating dashboard charts:', error);
    }
};

ExpenseTracker.prototype.updateTodayExpenses = function() {
    try {
        const today = new Date();
        const todayDateString = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD
        
        // Filter expenses for today
        const todayExpenses = this.expenses.filter(expense => {
            const expenseDate = new Date(expense.Date);
            return expenseDate.toISOString().split('T')[0] === todayDateString;
        });
        
        // Calculate total amount spent today
        const totalToday = todayExpenses.reduce((total, expense) => total + expense.Amount, 0);
        
        // Update the metric on the dashboard
        const todaySpendElement = document.getElementById('todayExpenses');
        if (todaySpendElement) {
            todaySpendElement.textContent = `${this.settings.currency}${totalToday.toFixed(2)}`;
        }
        
        // Prepare the detail content for the modal
        let detailsHTML = '';
        
        if (todayExpenses.length > 0) {
            // Category summary
            detailsHTML += '<h5>Summary by Category</h5>';
            detailsHTML += '<div class="table-responsive"><table class="table table-sm">';
            detailsHTML += '<thead><tr><th>Category</th><th>Amount</th><th>Percentage</th></tr></thead><tbody>';
            
            // Group by category
            const categoryTotals = {};
            todayExpenses.forEach(expense => {
                if (!categoryTotals[expense.Category]) {
                    categoryTotals[expense.Category] = 0;
                }
                categoryTotals[expense.Category] += expense.Amount;
            });
            
            // Add categories to table
            Object.entries(categoryTotals).forEach(([category, amount]) => {
                const percentage = ((amount / totalToday) * 100).toFixed(1);
                detailsHTML += `<tr>
                    <td><span class="category-tag category-${category.toLowerCase()}">${category}</span></td>
                    <td>${this.settings.currency}${amount.toFixed(2)}</td>
                    <td>${percentage}%</td>
                </tr>`;
            });
            
            detailsHTML += '</tbody></table></div>';
            
            // Add chart container
            detailsHTML += '<div class="mt-4 mb-4"><h5>Category Distribution</h5><div style="height: 250px;"><canvas id="todayCategoryChart"></canvas></div></div>';
            
            // Individual transactions
            detailsHTML += '<h5 class="mt-3">All Transactions</h5>';
            detailsHTML += '<div class="table-responsive"><table class="table table-sm">';
            detailsHTML += '<thead><tr><th>Category</th><th>Description</th><th>Amount</th><th>Payment</th></tr></thead><tbody>';
            
            todayExpenses.forEach(expense => {
                detailsHTML += `<tr>
                    <td><span class="category-tag category-${expense.Category.toLowerCase()}">${expense.Subcategory}</span></td>
                    <td>${expense.Description}</td>
                    <td>${this.settings.currency}${expense.Amount.toFixed(2)}</td>
                    <td>${expense.PaymentMethod}</td>
                </tr>`;
            });
            
            detailsHTML += '</tbody></table></div>';
        } else {
            detailsHTML = '<p class="text-center">No expenses recorded for today.</p>';
        }
        
        // Update the modal content
        const todayExpensesModalBody = document.getElementById('todayExpensesModalBody');
        if (todayExpensesModalBody) {
            todayExpensesModalBody.innerHTML = detailsHTML;
            
            // Initialize the pie chart if there are expenses
            if (todayExpenses.length > 0) {
                setTimeout(() => {
                    const chartCanvas = document.getElementById('todayCategoryChart');
                    if (chartCanvas) {
                        // Group by category for the chart
                        const categoryTotals = {};
                        todayExpenses.forEach(expense => {
                            if (!categoryTotals[expense.Category]) {
                                categoryTotals[expense.Category] = 0;
                            }
                            categoryTotals[expense.Category] += expense.Amount;
                        });
                        
                        // Prepare data for chart
                        const categories = Object.keys(categoryTotals);
                        const values = Object.values(categoryTotals);
                        
                        // Color mapping for categories
                        const colorMap = {
                            Food: 'rgba(54, 162, 235, 0.8)',
                            Transportation: 'rgba(255, 99, 132, 0.8)',
                            Bills: 'rgba(75, 192, 192, 0.8)',
                            Services: 'rgba(0, 204, 204, 0.8)',
                            Entertainment: 'rgba(255, 159, 64, 0.8)',
                            Miscellaneous: 'rgba(153, 102, 255, 0.8)'
                        };
                        
                        const colors = categories.map(category => colorMap[category] || 'rgba(201, 203, 207, 0.8)');
                        
                        // Create chart
                        const ctx = chartCanvas.getContext('2d');
                        if (this.chartInstances.todayCategoryChart) {
                            this.chartInstances.todayCategoryChart.destroy();
                        }
                        
                        this.chartInstances.todayCategoryChart = new Chart(ctx, {
                            type: 'doughnut',
                            data: {
                                labels: categories,
                                datasets: [{
                                    data: values,
                                    backgroundColor: colors,
                                    borderColor: 'white',
                                    borderWidth: 1
                                }]
                            },
                            options: {
                                responsive: true,
                                maintainAspectRatio: false,
                                plugins: {
                                    legend: {
                                        position: 'right',
                                        labels: {
                                            font: {
                                                size: 12
                                            },
                                            padding: 20
                                        }
                                    },
                                    tooltip: {
                                        callbacks: {
                                            label: (context) => {
                                                const value = context.raw;
                                                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                                const percentage = Math.round((value / total) * 100);
                                                return `${context.label}: ${this.settings.currency}${value.toFixed(2)} (${percentage}%)`;
                                            }
                                        }
                                    }
                                }
                            }
                        });
                    }
                }, 100); // Small delay to ensure the canvas is in the DOM
            }
        }
    } catch (error) {
        console.error('Error updating today\'s expenses:', error);
    }
};

ExpenseTracker.prototype.updateRecentTransactions = function() {
    try {
        const table = document.getElementById('recentTransactionsTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;
        
        table.innerHTML = '';
        
        // Get 5 most recent transactions
        const recentExpenses = this.expenses
            .sort((a, b) => new Date(b.Date) - new Date(a.Date))
            .slice(0, 5);
        
        if (recentExpenses.length === 0) {
            const row = table.insertRow();
            const cell = row.insertCell(0);
            cell.colSpan = 3;
            cell.textContent = 'No recent transactions';
            cell.className = 'text-center text-muted';
            return;
        }
        
        recentExpenses.forEach(expense => {
            const row = table.insertRow();
            
            // Date cell
            const dateCell = row.insertCell(0);
            dateCell.textContent = this.formatDate(expense.Date);
            
            // Category cell with tag styling
            const categoryCell = row.insertCell(1);
            const categorySpan = document.createElement('span');
            categorySpan.className = `category-tag category-${expense.Category.toLowerCase()}`;
            categorySpan.textContent = expense.Subcategory;
            categoryCell.appendChild(categorySpan);
            
            // Amount cell
            const amountCell = row.insertCell(2);
            amountCell.textContent = `${this.settings.currency}${expense.Amount.toFixed(2)}`;
            amountCell.className = 'text-end';
        });
    } catch (error) {
        console.error('Error updating recent transactions:', error);
    }
};
// Analysis Management Functions

ExpenseTracker.prototype.updateAnalysisPage = function() {
    try {
        // Get date range
        const dateRangeFilter = document.getElementById('dateRangeFilter').value;
        let startDate, endDate;
        
        const today = new Date();
        
        switch(dateRangeFilter) {
            case 'thisMonth':
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = today;
                break;
            case 'lastMonth':
                const lastMonth = today.getMonth() - 1;
                const lastMonthYear = lastMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
                const lastMonthIndex = lastMonth < 0 ? 11 : lastMonth;
                const lastMonthDays = new Date(lastMonthYear, lastMonthIndex + 1, 0).getDate();
                startDate = new Date(lastMonthYear, lastMonthIndex, 1);
                endDate = new Date(lastMonthYear, lastMonthIndex, lastMonthDays);
                break;
            case 'last30Days':
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 30);
                endDate = today;
                break;
            case 'last7Days':
                startDate = new Date(today);
                startDate.setDate(startDate.getDate() - 7);
                endDate = today;
                break;
            case 'thisYear':
                startDate = new Date(today.getFullYear(), 0, 1);
                endDate = today;
                break;
            case 'custom':
                const startDateInput = document.getElementById('startDate');
                const endDateInput = document.getElementById('endDate');
                
                if (startDateInput && endDateInput) {
                    startDate = new Date(startDateInput.value);
                    endDate = new Date(endDateInput.value);
                    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                        this.showToast('Please select valid start and end dates.', 'warning');
                        return;
                    }
                } else {
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    endDate = today;
                }
                break;
            default:
                startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                endDate = today;
        }
        
        // Get selected categories - if none are selected, include all
        const selectedCategories = [];
        document.querySelectorAll('.category-filter:checked').forEach(checkbox => {
            selectedCategories.push(checkbox.value);
        });
        
        // Get selected payment methods - if none are selected, include all
        const selectedPaymentMethods = [];
        document.querySelectorAll('.payment-filter:checked').forEach(checkbox => {
            selectedPaymentMethods.push(checkbox.value);
        });
        
        // Get selected subcategories - if none are selected, include all
        const selectedSubcategories = [];
        document.querySelectorAll('.subcategory-filter:checked').forEach(checkbox => {
            selectedSubcategories.push(checkbox.value);
        });
        
        // Get description search term
        const descriptionSearch = document.getElementById('descriptionSearch')?.value.toLowerCase() || '';
        
        // Get amount range values
        const minAmountEl = document.getElementById('minAmountInput');
        const maxAmountEl = document.getElementById('maxAmountInput');
        let minAmount = 0;
        let maxAmount = Number.MAX_SAFE_INTEGER;
        
        if (minAmountEl && maxAmountEl) {
            minAmount = parseFloat(minAmountEl.value) || 0;
            maxAmount = parseFloat(maxAmountEl.value) || Number.MAX_SAFE_INTEGER;
        }
        
        // Filter expenses - fix the filter to properly check if arrays are empty
        let filteredExpenses = this.expenses.filter(expense => {
            try {
                const expenseDate = new Date(expense.Date);
                
                return (
                    // Date range check
                    expenseDate >= startDate && 
                    expenseDate <= endDate &&
                    // Category check - if no categories selected, include all
                    (selectedCategories.length === 0 || selectedCategories.includes(expense.Category)) &&
                    // Payment method check - if no methods selected, include all
                    (selectedPaymentMethods.length === 0 || selectedPaymentMethods.includes(expense.PaymentMethod)) &&
                    // Subcategory check - if no subcategories selected, include all
                    (selectedSubcategories.length === 0 || selectedSubcategories.includes(expense.Subcategory)) &&
                    // Description search
                    (descriptionSearch === '' || expense.Description.toLowerCase().includes(descriptionSearch)) &&
                    // Amount range
                    expense.Amount >= minAmount && expense.Amount <= maxAmount
                );
            } catch (error) {
                console.error('Error filtering expense:', expense, error);
                return false;
            }
        });
        
        // Save filtered expenses for use in other methods
        this.filteredExpenses = filteredExpenses;
        
        // Update summary statistics
        const analysisTotalExpenses = document.getElementById('analysisTotalExpenses');
        const analysisAvgDailyExpense = document.getElementById('analysisAvgDailyExpense');
        const analysisHighestExpense = document.getElementById('analysisHighestExpense');
        const highestExpenseCategory = document.getElementById('highestExpenseCategory');
        const analysisNumTransactions = document.getElementById('analysisNumTransactions');
        
        if (!analysisTotalExpenses || !analysisAvgDailyExpense || !analysisHighestExpense || 
            !highestExpenseCategory || !analysisNumTransactions) {
            this.showToast('Analysis page elements are missing.', 'error');
            return;
        }
        
        if (filteredExpenses.length === 0) {
            analysisTotalExpenses.textContent = `${this.settings.currency}0.00`;
            analysisAvgDailyExpense.textContent = `${this.settings.currency}0.00`;
            analysisHighestExpense.textContent = `${this.settings.currency}0.00`;
            highestExpenseCategory.textContent = '-';
            analysisNumTransactions.textContent = '0';
            
            // Clear charts
            this.clearAnalysisCharts();
            
            // Hide food analysis section
            const foodAnalysisSection = document.getElementById('foodAnalysisSection');
            if (foodAnalysisSection) {
                foodAnalysisSection.classList.add('d-none');
            }
            
            this.showToast('No expenses found for the selected filters.', 'info');
            return;
        }
        
        // Calculate summary statistics
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.Amount, 0);
        const daysDiff = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
        const avgDailyExpense = totalExpenses / daysDiff;
        
        // Find highest expense
        const highestExpense = filteredExpenses.reduce((max, expense) => 
            expense.Amount > max.amount ? { amount: expense.Amount, category: expense.Subcategory } : max, 
            { amount: 0, category: '' }
        );
        
        // Update UI
        analysisTotalExpenses.textContent = `${this.settings.currency}${totalExpenses.toFixed(2)}`;
        analysisAvgDailyExpense.textContent = `${this.settings.currency}${avgDailyExpense.toFixed(2)}`;
        analysisHighestExpense.textContent = `${this.settings.currency}${highestExpense.amount.toFixed(2)}`;
        highestExpenseCategory.textContent = highestExpense.category;
        analysisNumTransactions.textContent = filteredExpenses.length.toString();
        
        // Update charts - make sure to destroy old charts first
        this.clearAnalysisCharts();
        this.updateAnalysisCharts(filteredExpenses, startDate, endDate);
        
        // Check for food expenses and update food analysis section if needed
        const foodExpenses = filteredExpenses.filter(expense => expense.Category === 'Food');
        const foodAnalysisSection = document.getElementById('foodAnalysisSection');
        if (foodAnalysisSection) {
            if (foodExpenses.length > 0) {
                this.updateFoodAnalysis(foodExpenses, totalExpenses);
                foodAnalysisSection.classList.remove('d-none');
            } else {
                foodAnalysisSection.classList.add('d-none');
            }
        }
        
        // Update payment method analysis
        this.updatePaymentMethodAnalysis(filteredExpenses, totalExpenses);
        
    } catch (error) {
        console.error('Error updating analysis page:', error);
        this.showToast('Error updating analysis. Please try again.', 'error');
    }
};

ExpenseTracker.prototype.updateAnalysisCharts = function(expenses, startDate, endDate) {
    try {
        // Clear existing charts
        this.clearAnalysisCharts();
        
        // Category chart
        this.createAnalysisCategoryChart(expenses);
        
        // Subcategory chart
        this.createAnalysisSubcategoryChart(expenses);
        
        // Trend chart
        this.createAnalysisTrendChart(expenses, startDate, endDate);
        
        // Weekly pattern chart
        this.createAnalysisWeeklyChart(expenses);
    } catch (error) {
        console.error('Error updating analysis charts:', error);
    }
};

ExpenseTracker.prototype.clearAnalysisCharts = function() {
    try {
        // Destroy existing charts
        if (this.chartInstances.analysisCategoryChart) {
            this.chartInstances.analysisCategoryChart.destroy();
        }
        
        if (this.chartInstances.analysisSubcategoryChart) {
            this.chartInstances.analysisSubcategoryChart.destroy();
        }
        
        if (this.chartInstances.analysisTrendChart) {
            this.chartInstances.analysisTrendChart.destroy();
        }
        
        if (this.chartInstances.analysisWeeklyChart) {
            this.chartInstances.analysisWeeklyChart.destroy();
        }
        
        if (this.chartInstances.foodSourceChart) {
            this.chartInstances.foodSourceChart.destroy();
        }
        
        if (this.chartInstances.paymentMethodChart) {
            this.chartInstances.paymentMethodChart.destroy();
        }
    } catch (error) {
        console.error('Error clearing analysis charts:', error);
    }
};

ExpenseTracker.prototype.updateFoodAnalysis = function(foodExpenses, totalExpenses) {
    try {
        const foodSection = document.getElementById('foodAnalysisSection');
        if (!foodSection) return;
        
        foodSection.classList.remove('d-none');
        
        // Calculate food metrics
        const foodTotal = foodExpenses.reduce((sum, expense) => sum + expense.Amount, 0);
        const foodCount = foodExpenses.length;
        const foodAvg = foodCount > 0 ? foodTotal / foodCount : 0;
        const foodPercentage = totalExpenses > 0 ? (foodTotal / totalExpenses * 100) : 0;
        
        // Update metrics
        document.getElementById('foodTotalExpenses').textContent = `${this.settings.currency}${foodTotal.toFixed(2)}`;
        document.getElementById('foodBudgetPercentage').textContent = `${foodPercentage.toFixed(1)}%`;
        document.getElementById('foodAvgExpense').textContent = `${this.settings.currency}${foodAvg.toFixed(2)}`;
        
        // Group by food source (subcategory)
        const foodSources = {};
        foodExpenses.forEach(expense => {
            if (!foodSources[expense.Subcategory]) {
                foodSources[expense.Subcategory] = 0;
            }
            foodSources[expense.Subcategory] += expense.Amount;
        });
        
        // Sort food sources by amount
        const sortedSources = Object.entries(foodSources)
            .sort((a, b) => b[1] - a[1]);
        
        // Update food sources table
        const table = document.getElementById('foodSourceTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;
        
        table.innerHTML = '';
        
        sortedSources.forEach(([source, amount]) => {
            const percentage = (amount / foodTotal * 100);
            
            const row = table.insertRow();
            
            // Source cell
            const sourceCell = row.insertCell(0);
            sourceCell.textContent = source;
            
            // Amount cell
            const amountCell = row.insertCell(1);
            amountCell.textContent = `${this.settings.currency}${amount.toFixed(2)}`;
            amountCell.className = 'text-end';
            
            // Percentage cell
            const percentageCell = row.insertCell(2);
            percentageCell.textContent = `${percentage.toFixed(1)}%`;
            percentageCell.className = 'text-end';
        });
        
        // Create food sources chart
        this.createFoodSourceChart(sortedSources);
    } catch (error) {
        console.error('Error updating food analysis:', error);
    }
};

ExpenseTracker.prototype.updatePaymentMethodAnalysis = function(expenses, totalExpenses) {
    try {
        // Group by payment method
        const paymentMethods = {};
        const paymentCounts = {};
        
        expenses.forEach(expense => {
            const method = expense.PaymentMethod;
            if (!paymentMethods[method]) {
                paymentMethods[method] = 0;
                paymentCounts[method] = 0;
            }
            paymentMethods[method] += expense.Amount;
            paymentCounts[method]++;
        });
        
        // Update payment method table
        const table = document.getElementById('paymentMethodTable')?.getElementsByTagName('tbody')[0];
        if (!table) return;
        
        table.innerHTML = '';
        
        Object.keys(paymentMethods).forEach(method => {
            const amount = paymentMethods[method];
            const percentage = (amount / totalExpenses * 100);
            const count = paymentCounts[method];
            
            const row = table.insertRow();
            
            // Method cell
            const methodCell = row.insertCell(0);
            methodCell.textContent = method;
            
            // Amount cell
            const amountCell = row.insertCell(1);
            amountCell.textContent = `${this.settings.currency}${amount.toFixed(2)}`;
            amountCell.className = 'text-end';
            
            // Percentage cell
            const percentageCell = row.insertCell(2);
            percentageCell.textContent = `${percentage.toFixed(1)}%`;
            percentageCell.className = 'text-end';
            
            // Count cell
            const countCell = row.insertCell(3);
            countCell.textContent = count;
            countCell.className = 'text-end';
        });
        
        // Create payment method chart
        this.createPaymentMethodChart(paymentMethods);
    } catch (error) {
        console.error('Error updating payment method analysis:', error);
    }
};

ExpenseTracker.prototype.updateCategoryAnalysis = function(expenses, totalExpenses) {
    try {
        // Group by category
        const categoryData = {};
        
        expenses.forEach(expense => {
            const category = expense.Category;
            if (!categoryData[category]) {
                categoryData[category] = {
                    total: 0,
                    count: 0,
                    subcategories: {}
                };
            }
            
            categoryData[category].total += expense.Amount;
            categoryData[category].count++;
            
            // Track subcategories
            const subcategory = expense.Subcategory;
            if (!categoryData[category].subcategories[subcategory]) {
                categoryData[category].subcategories[subcategory] = {
                    total: 0,
                    count: 0
                };
            }
            
            categoryData[category].subcategories[subcategory].total += expense.Amount;
            categoryData[category].subcategories[subcategory].count++;
        });
        
        // Update UI elements for each category
        Object.entries(categoryData).forEach(([category, data]) => {
            const categorySection = document.getElementById(`${category.toLowerCase()}AnalysisSection`);
            if (categorySection) {
                categorySection.classList.remove('d-none');
                
                // Update category metrics if they exist
                const totalElement = document.getElementById(`${category.toLowerCase()}TotalExpenses`);
                if (totalElement) {
                    totalElement.textContent = `${this.settings.currency}${data.total.toFixed(2)}`;
                }
                
                const percentageElement = document.getElementById(`${category.toLowerCase()}BudgetPercentage`);
                if (percentageElement) {
                    const percentage = (data.total / totalExpenses * 100);
                    percentageElement.textContent = `${percentage.toFixed(1)}%`;
                }
                
                const avgElement = document.getElementById(`${category.toLowerCase()}AvgExpense`);
                if (avgElement) {
                    const avg = data.count > 0 ? data.total / data.count : 0;
                    avgElement.textContent = `${this.settings.currency}${avg.toFixed(2)}`;
                }
                
                // Update subcategory table if it exists
                const tableBody = document.getElementById(`${category.toLowerCase()}SourceTable`)?.getElementsByTagName('tbody')[0];
                if (tableBody) {
                    tableBody.innerHTML = '';
                    
                    Object.entries(data.subcategories)
                        .sort((a, b) => b[1].total - a[1].total)
                        .forEach(([subcategory, subData]) => {
                            const percentage = (subData.total / data.total * 100);
                            
                            const row = tableBody.insertRow();
                            const subcategoryCell = row.insertCell(0);
                            subcategoryCell.textContent = subcategory;
                            
                            const amountCell = row.insertCell(1);
                            amountCell.textContent = `${this.settings.currency}${subData.total.toFixed(2)}`;
                            amountCell.className = 'text-end';
                            
                            const percentageCell = row.insertCell(2);
                            percentageCell.textContent = `${percentage.toFixed(1)}%`;
                            percentageCell.className = 'text-end';
                        });
                }
            }
        });
    } catch (error) {
        console.error('Error updating category analysis:', error);
    }
};

ExpenseTracker.prototype.downloadAnalysisCSV = function() {
    try {
        // Check if PDF is selected
        const downloadFormat = document.querySelector('input[name="downloadFormat"]:checked')?.value || 'csv';
        
        if (downloadFormat === 'pdf') {
            this.downloadAnalysisPDF(); // Call PDF download instead
            return;
        }
        
        // Get date range information
        const dateRangeFilter = document.getElementById('dateRangeFilter')?.value || 'thisMonth';
        
        // Get filtered expenses from current analysis (or filter again if needed)
        let filteredExpenses = this.filteredExpenses;
        if (!filteredExpenses || filteredExpenses.length === 0) {
            // If no filtered expenses exist, we need to get the date range and filter again
            let startDate, endDate;
            const today = new Date();
            
            switch(dateRangeFilter) {
                case 'thisMonth':
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    endDate = today;
                    break;
                case 'lastMonth':
                    const lastMonth = today.getMonth() - 1;
                    const lastMonthYear = lastMonth < 0 ? today.getFullYear() - 1 : today.getFullYear();
                    const lastMonthIndex = lastMonth < 0 ? 11 : lastMonth;
                    const lastMonthDays = new Date(lastMonthYear, lastMonthIndex + 1, 0).getDate();
                    startDate = new Date(lastMonthYear, lastMonthIndex, 1);
                    endDate = new Date(lastMonthYear, lastMonthIndex, lastMonthDays);
                    break;
                case 'last30Days':
                    startDate = new Date(today);
                    startDate.setDate(startDate.getDate() - 30);
                    endDate = today;
                    break;
                case 'last7Days':
                    startDate = new Date(today);
                    startDate.setDate(startDate.getDate() - 7);
                    endDate = today;
                    break;
                case 'thisYear':
                    startDate = new Date(today.getFullYear(), 0, 1);
                    endDate = today;
                    break;
                case 'custom':
                    const startDateInput = document.getElementById('startDate');
                    const endDateInput = document.getElementById('endDate');
                    
                    if (startDateInput && endDateInput) {
                        startDate = new Date(startDateInput.value);
                        endDate = new Date(endDateInput.value);
                        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                            this.showToast('Please select valid start and end dates.', 'warning');
                            return;
                        }
                    } else {
                        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                        endDate = today;
                    }
                    break;
                default:
                    startDate = new Date(today.getFullYear(), today.getMonth(), 1);
                    endDate = today;
            }
            
            // Get all selected filters
            const selectedCategories = [];
            document.querySelectorAll('.category-filter:checked').forEach(checkbox => {
                selectedCategories.push(checkbox.value);
            });
            
            const selectedPaymentMethods = [];
            document.querySelectorAll('.payment-filter:checked').forEach(checkbox => {
                selectedPaymentMethods.push(checkbox.value);
            });
            
            const selectedSubcategories = [];
            document.querySelectorAll('.subcategory-filter:checked').forEach(checkbox => {
                selectedSubcategories.push(checkbox.value);
            });
            
            const descriptionSearch = document.getElementById('descriptionSearch')?.value.toLowerCase() || '';
            
            // Filter expenses
            filteredExpenses = this.expenses.filter(expense => {
                const expenseDate = new Date(expense.Date);
                return expenseDate >= startDate && expenseDate <= endDate &&
                       (selectedCategories.length === 0 || selectedCategories.includes(expense.Category)) &&
                       (selectedPaymentMethods.length === 0 || selectedPaymentMethods.includes(expense.PaymentMethod)) &&
                       (selectedSubcategories.length === 0 || selectedSubcategories.includes(expense.Subcategory)) &&
                       (descriptionSearch === '' || expense.Description.toLowerCase().includes(descriptionSearch));
            });
        }
        
        if (filteredExpenses.length === 0) {
            this.showToast('No expenses found for the selected date range.', 'warning');
            return;
        }
        
        // Create CSV content
        let csvContent = '';
        
        // Determine date range from filtered expenses
        const dates = filteredExpenses.map(expense => new Date(expense.Date));
        const startDate = new Date(Math.min(...dates));
        const endDate = new Date(Math.max(...dates));
        
        // SECTION 1: OVERALL SUMMARY
        csvContent += 'EXPENSE ANALYSIS SUMMARY\n';
        csvContent += 'Metric,Value\n';
        
        // Calculate overall totals
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.Amount, 0);
        const daysDiff = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
        const avgDailyExpense = totalExpenses / daysDiff;
        
        csvContent += `Total Expenses,${this.settings.currency}${totalExpenses.toFixed(2)}\n`;
        csvContent += `Average Daily Expense,${this.settings.currency}${avgDailyExpense.toFixed(2)}\n`;
        csvContent += `Number of Transactions,${filteredExpenses.length}\n`;
        csvContent += `Date Range,${this.formatDate(startDate)} to ${this.formatDate(endDate)}\n`;
        csvContent += `Generated On,${this.formatDate(new Date())}\n\n`;
        
        // SECTION 2: CATEGORY SUMMARY
        csvContent += 'CATEGORY SUMMARY\n';
        csvContent += 'Category,Total Amount,Average Amount,Count,Percentage of Total\n';
        
        // Calculate category totals
        const categoryTotals = {};
        filteredExpenses.forEach(expense => {
            if (!categoryTotals[expense.Category]) {
                categoryTotals[expense.Category] = {
                    totalAmount: 0,
                    count: 0
                };
            }
            categoryTotals[expense.Category].totalAmount += expense.Amount;
            categoryTotals[expense.Category].count++;
        });
        
        // Add category data
        Object.entries(categoryTotals)
            .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
            .forEach(([category, data]) => {
                const avgAmount = data.totalAmount / data.count;
                const percentage = (data.totalAmount / totalExpenses * 100).toFixed(2);
                csvContent += `${category},${this.settings.currency}${data.totalAmount.toFixed(2)},${this.settings.currency}${avgAmount.toFixed(2)},${data.count},${percentage}%\n`;
            });
        
        csvContent += '\n';
        
        // SECTION 3: SUBCATEGORY SUMMARY
        csvContent += 'SUBCATEGORY SUMMARY\n';
        csvContent += 'Subcategory,Category,Total Amount,Average Amount,Count,Percentage of Total\n';
        
        // Calculate subcategory totals
        const subcategoryTotals = {};
        filteredExpenses.forEach(expense => {
            const key = expense.Subcategory;
            if (!subcategoryTotals[key]) {
                subcategoryTotals[key] = {
                    category: expense.Category,
                    totalAmount: 0,
                    count: 0
                };
            }
            subcategoryTotals[key].totalAmount += expense.Amount;
            subcategoryTotals[key].count++;
        });
        
        // Add subcategory data
        Object.entries(subcategoryTotals)
            .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
            .forEach(([subcategory, data]) => {
                const avgAmount = data.totalAmount / data.count;
                const percentage = (data.totalAmount / totalExpenses * 100).toFixed(2);
                csvContent += `${subcategory},${data.category},${this.settings.currency}${data.totalAmount.toFixed(2)},${this.settings.currency}${avgAmount.toFixed(2)},${data.count},${percentage}%\n`;
            });
        
        csvContent += '\n';
        
        // SECTION 4: PAYMENT METHOD SUMMARY
        csvContent += 'PAYMENT METHOD SUMMARY\n';
        csvContent += 'Payment Method,Total Amount,Count,Percentage of Total\n';
        
        // Calculate payment method totals
        const paymentMethodTotals = {};
        filteredExpenses.forEach(expense => {
            if (!paymentMethodTotals[expense.PaymentMethod]) {
                paymentMethodTotals[expense.PaymentMethod] = {
                    totalAmount: 0,
                    count: 0
                };
            }
            paymentMethodTotals[expense.PaymentMethod].totalAmount += expense.Amount;
            paymentMethodTotals[expense.PaymentMethod].count++;
        });
        
        // Add payment method data
        Object.entries(paymentMethodTotals)
            .sort((a, b) => b[1].totalAmount - a[1].totalAmount)
            .forEach(([method, data]) => {
                const percentage = (data.totalAmount / totalExpenses * 100).toFixed(2);
                csvContent += `${method},${this.settings.currency}${data.totalAmount.toFixed(2)},${data.count},${percentage}%\n`;
            });
        
        csvContent += '\n';
        
        // SECTION 5: DAILY BREAKDOWN
        csvContent += 'DAILY EXPENSE BREAKDOWN\n';
        
        // Group expenses by date
        const expensesByDate = {};
        filteredExpenses.forEach(expense => {
            const dateStr = this.formatDate(expense.Date);
            if (!expensesByDate[dateStr]) {
                expensesByDate[dateStr] = [];
            }
            expensesByDate[dateStr].push(expense);
        });
        
        // Sort dates chronologically
        const sortedDates = Object.keys(expensesByDate).sort((a, b) => {
            const dateA = this.parseDate(a);
            const dateB = this.parseDate(b);
            return dateA - dateB;
        });
        
        // For each date, list all expenses and category totals
        sortedDates.forEach(dateStr => {
            const dayExpenses = expensesByDate[dateStr];
            const dayTotal = dayExpenses.reduce((sum, expense) => sum + expense.Amount, 0);
            
            csvContent += `\nDate: ${dateStr}\n`;
            csvContent += `Daily Total: ${this.settings.currency}${dayTotal.toFixed(2)}\n`;
            
            // Calculate category totals for the day
            const dayCategoryTotals = {};
            dayExpenses.forEach(expense => {
                if (!dayCategoryTotals[expense.Category]) {
                    dayCategoryTotals[expense.Category] = 0;
                }
                dayCategoryTotals[expense.Category] += expense.Amount;
            });
            
            // Add category breakdown for the day
            csvContent += 'Category Breakdown:\n';
            Object.entries(dayCategoryTotals)
                .sort((a, b) => b[1] - a[1])
                .forEach(([category, amount]) => {
                    const percentage = (amount / dayTotal * 100).toFixed(2);
                    csvContent += `${category},${this.settings.currency}${amount.toFixed(2)},${percentage}%\n`;
                });
            
            // List all transactions for the day
            csvContent += 'Transactions:\n';
            csvContent += 'Category,Subcategory,Amount,Description,Payment Method\n';
            
            dayExpenses.forEach(expense => {
                csvContent += `${expense.Category},${expense.Subcategory},${this.settings.currency}${expense.Amount.toFixed(2)},"${expense.Description}",${expense.PaymentMethod}\n`;
            });
        });
        
        // SECTION 6: RAW DATA (ALL EXPENSES)
        csvContent += '\nALL EXPENSES (RAW DATA)\n';
        csvContent += 'Date,Category,Subcategory,Amount,Description,PaymentMethod\n';
        
        filteredExpenses
            .sort((a, b) => new Date(a.Date) - new Date(b.Date))
            .forEach(expense => {
                csvContent += `${this.formatDate(expense.Date)},${expense.Category},${expense.Subcategory},`;
                csvContent += `${this.settings.currency}${expense.Amount.toFixed(2)},"${expense.Description}",${expense.PaymentMethod}\n`;
            });
        
        // Helper method to parse date if needed
        if (!this.parseDate) {
            this.parseDate = (dateStr) => {
                // Assuming the format is dd/mm/yyyy or similar
                const parts = dateStr.split(/[\/\-\.]/);
                if (parts.length === 3) {
                    // Check format based on settings
                    if (this.settings.dateFormat === 'mm/dd/yyyy') {
                        return new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
                    } else if (this.settings.dateFormat === 'yyyy-mm-dd') {
                        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                    } else { // Default to dd/mm/yyyy
                        return new Date(parseInt(parts[2]), parseInt(parts[1]) - 1, parseInt(parts[0]));
                    }
                }
                return new Date(dateStr); // Fallback
            };
        }
        
        // Create download link
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `expense_analysis_${this.formatDateForFilename(startDate)}_to_${this.formatDateForFilename(endDate)}.csv`);
        link.style.visibility = 'hidden';
        
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Release the object URL to free up memory
        setTimeout(() => URL.revokeObjectURL(url), 100);
        
        this.showToast('Detailed expense analysis CSV downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error downloading analysis CSV:', error);
        this.showToast('Error downloading analysis CSV.', 'error');
    }
};

ExpenseTracker.prototype.downloadAnalysisPDF = async function() {
    try {
        this.showToast('Generating PDF, please wait...', 'info');
        
        // Check if jsPDF is available
        if (!window.jspdf) {
            throw new Error('jsPDF library not found. Make sure to include it in your HTML.');
        }
        
        // Create a new jsPDF instance
        const { jsPDF } = window.jspdf;
        const pdf = new jsPDF('p', 'mm', 'a4');
        
        // Set title
        pdf.setFontSize(18);
        pdf.text('Expense Analysis Report', 15, 15);
        
        // Add date range and generation info
        pdf.setFontSize(11);
        
        // Get filtered expenses
        let filteredExpenses = this.filteredExpenses;
        if (!filteredExpenses || filteredExpenses.length === 0) {
            // If no expenses are filtered yet, use all expenses
            filteredExpenses = this.expenses;
        }
        
        if (filteredExpenses.length === 0) {
            this.showToast('No expenses to include in PDF.', 'warning');
            return;
        }
        
        // Calculate date range
        const dates = filteredExpenses.map(expense => new Date(expense.Date));
        const startDate = new Date(Math.min(...dates));
        const endDate = new Date(Math.max(...dates));
        
        pdf.text(`Date Range: ${this.formatDate(startDate)} to ${this.formatDate(endDate)}`, 15, 25);
        pdf.text(`Generated On: ${this.formatDate(new Date())}`, 15, 30);
        
        // Add summary section
        let yPosition = 40;
        
        pdf.setFontSize(14);
        pdf.text('Summary Statistics', 15, yPosition);
        yPosition += 8;
        
        pdf.setFontSize(10);
        const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.Amount, 0);
        pdf.text(`Total Expenses: ${this.settings.currency}${totalExpenses.toFixed(2)}`, 15, yPosition);
        yPosition += 6;
        
        const transactionCount = filteredExpenses.length;
        pdf.text(`Number of Transactions: ${transactionCount}`, 15, yPosition);
        yPosition += 6;
        
        const daysDiff = Math.max(1, Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1);
        const avgDailyExpense = totalExpenses / daysDiff;
        pdf.text(`Average Daily Expense: ${this.settings.currency}${avgDailyExpense.toFixed(2)}`, 15, yPosition);
        yPosition += 10;
        
        // Add category data
        pdf.setFontSize(14);
        pdf.text('Expense Categories', 15, yPosition);
        yPosition += 8;
        
        // Table headers
        pdf.setFontSize(10);
        pdf.text('Category', 15, yPosition);
        pdf.text('Amount', 60, yPosition);
        pdf.text('Percentage', 90, yPosition);
        pdf.text('Count', 130, yPosition);
        yPosition += 4;
        
        // Add a line
        pdf.line(15, yPosition, 180, yPosition);
        yPosition += 6;
        
        // Calculate category data
        const categoryTotals = {};
        filteredExpenses.forEach(expense => {
            if (!categoryTotals[expense.Category]) {
                categoryTotals[expense.Category] = {
                    totalAmount: 0,
                    count: 0
                };
            }
            categoryTotals[expense.Category].totalAmount += expense.Amount;
            categoryTotals[expense.Category].count++;
        });
        
        // Add category rows
        Object.entries(categoryTotals).forEach(([category, data]) => {
            const percentage = (data.totalAmount / totalExpenses * 100).toFixed(1);
            pdf.text(category, 15, yPosition);
            pdf.text(`${this.settings.currency}${data.totalAmount.toFixed(2)}`, 60, yPosition);
            pdf.text(`${percentage}%`, 90, yPosition);
            pdf.text(data.count.toString(), 130, yPosition);
            yPosition += 6;
            
            // Check if we need a new page
            if (yPosition > 280) {
                pdf.addPage();
                yPosition = 20;
            }
        });
        
        yPosition += 10;
        
        // Save PDF with date range in filename
        pdf.save(`expense_analysis_${this.formatDateForFilename(startDate)}_to_${this.formatDateForFilename(endDate)}.pdf`);
        
        this.showToast('PDF downloaded successfully!', 'success');
    } catch (error) {
        console.error('Error generating PDF:', error);
        this.showToast('Error generating PDF. Falling back to CSV format.', 'error');
        
        // Fall back to CSV in case of error
        setTimeout(() => {
            // Set CSV radio button as checked
            const csvOption = document.getElementById('downloadCsv');
            if (csvOption) csvOption.checked = true;
            this.downloadAnalysisCSV();
        }, 1000);
    }
};
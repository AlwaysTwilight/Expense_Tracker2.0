// Chart Creation Functions

// Category chart creation
ExpenseTracker.prototype.createCategoryChart = function(expenses, chartId) {
    try {
        if (expenses.length === 0) return;
        
        const chartCanvas = document.getElementById(chartId);
        if (!chartCanvas) return;
        
        // Group expenses by category
        const categoryTotals = {};
        expenses.forEach(expense => {
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
        this.chartInstances[chartId] = new Chart(ctx, {
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
    } catch (error) {
        console.error('Error creating category chart:', error);
    }
};

// Trend chart creation
ExpenseTracker.prototype.createTrendChart = function(expenses, chartId) {
    try {
        if (expenses.length === 0) return;
        
        const chartCanvas = document.getElementById(chartId);
        if (!chartCanvas) return;
        
        // Group expenses by date
        const dateExpenses = {};
        expenses.forEach(expense => {
            const dateStr = this.formatDate(expense.Date);
            if (!dateExpenses[dateStr]) {
                dateExpenses[dateStr] = 0;
            }
            dateExpenses[dateStr] += expense.Amount;
        });
        
        // Create an array of all dates in the month
        const currentYear = this.currentDate.getFullYear();
        const currentMonth = this.currentDate.getMonth();
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        
        const allDates = [];
        const allValues = [];
        
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(currentYear, currentMonth, day);
            if (date > this.currentDate) break; // Don't show future dates
            
            const dateStr = this.formatDate(date);
            allDates.push(dateStr);
            allValues.push(dateExpenses[dateStr] || 0);
        }
        
        // Create chart
        const ctx = chartCanvas.getContext('2d');
        this.chartInstances[chartId] = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allDates,
                datasets: [{
                    label: 'Daily Expenses',
                    data: allValues,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.1,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return this.settings.currency + value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${this.settings.currency}${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating trend chart:', error);
    }
};

// Budget history chart
ExpenseTracker.prototype.createBudgetHistoryChart = function(months, budgetData, expenseData, savingsData) {
    try {
        // Destroy existing chart
        if (this.chartInstances.budgetHistoryChart) {
            this.chartInstances.budgetHistoryChart.destroy();
        }
        
        if (months.length === 0) return;
        
        const chartCanvas = document.getElementById('budgetHistoryChart');
        if (!chartCanvas) return;
        
        const ctx = chartCanvas.getContext('2d');
        this.chartInstances.budgetHistoryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Total Budget',
                        data: budgetData,
                        backgroundColor: 'rgba(54, 162, 235, 0.5)',
                        borderColor: 'rgba(54, 162, 235, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Expenses',
                        data: expenseData,
                        backgroundColor: 'rgba(255, 99, 132, 0.5)',
                        borderColor: 'rgba(255, 99, 132, 1)',
                        borderWidth: 1
                    },
                    {
                        label: 'Savings',
                        data: savingsData,
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return this.settings.currency + value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${context.dataset.label}: ${this.settings.currency}${context.raw.toFixed(2)}`;
                            }
                        }
                    },
                    legend: {
                        position: 'top'
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating budget history chart:', error);
    }
};

ExpenseTracker.prototype.createAnalysisCategoryChart = function(expenses) {
    try {
        if (expenses.length === 0) return;
        
        const chartCanvas = document.getElementById('analysisCategoryChart');
        if (!chartCanvas) return;
        
        // Group expenses by category
        const categoryTotals = {};
        expenses.forEach(expense => {
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
        this.chartInstances.analysisCategoryChart = new Chart(ctx, {
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
    } catch (error) {
        console.error('Error creating analysis category chart:', error);
    }
};

ExpenseTracker.prototype.createAnalysisSubcategoryChart = function(expenses) {
    try {
        if (expenses.length === 0) return;
        
        const chartCanvas = document.getElementById('analysisSubcategoryChart');
        if (!chartCanvas) return;
        
        // Group expenses by subcategory
        const subcategoryTotals = {};
        expenses.forEach(expense => {
            if (!subcategoryTotals[expense.Subcategory]) {
                subcategoryTotals[expense.Subcategory] = 0;
            }
            subcategoryTotals[expense.Subcategory] += expense.Amount;
        });
        
        // Sort subcategories by total and get top 10
        const sortedSubcategories = Object.entries(subcategoryTotals)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10);
        
        // Prepare data for chart
        const subcategories = sortedSubcategories.map(item => item[0]);
        const values = sortedSubcategories.map(item => item[1]);
        
        // Create chart
        const ctx = chartCanvas.getContext('2d');
        this.chartInstances.analysisSubcategoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: subcategories,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(199, 199, 199, 0.8)',
                        'rgba(83, 102, 255, 0.8)',
                        'rgba(40, 159, 64, 0.8)',
                        'rgba(240, 120, 120, 0.8)'
                    ],
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
    } catch (error) {
        console.error('Error creating analysis subcategory chart:', error);
    }
};

ExpenseTracker.prototype.createAnalysisTrendChart = function(expenses, startDate, endDate) {
    try {
        if (expenses.length === 0) return;
        
        const chartCanvas = document.getElementById('analysisTrendChart');
        if (!chartCanvas) return;
        
        // Group expenses by date
        const dateExpenses = {};
        expenses.forEach(expense => {
            const dateStr = this.formatDate(expense.Date);
            if (!dateExpenses[dateStr]) {
                dateExpenses[dateStr] = 0;
            }
            dateExpenses[dateStr] += expense.Amount;
        });
        
        // Create an array of all dates in the range
        const allDates = [];
        const allValues = [];
        
        const currentDate = new Date(startDate);
        while (currentDate <= endDate) {
            const dateStr = this.formatDate(currentDate);
            allDates.push(dateStr);
            allValues.push(dateExpenses[dateStr] || 0);
            
            currentDate.setDate(currentDate.getDate() + 1);
        }
        
        // Create chart
        const ctx = chartCanvas.getContext('2d');
        this.chartInstances.analysisTrendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: allDates,
                datasets: [{
                    label: 'Daily Expenses',
                    data: allValues,
                    borderColor: 'rgba(75, 192, 192, 1)',
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    fill: true,
                    tension: 0.1,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return this.settings.currency + value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `${this.settings.currency}${context.raw.toFixed(2)}`;
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating analysis trend chart:', error);
    }
};

ExpenseTracker.prototype.createAnalysisWeeklyChart = function(expenses) {
    try {
        if (expenses.length === 0) return;
        
        const chartCanvas = document.getElementById('analysisWeeklyChart');
        if (!chartCanvas) return;
        
        // Add day of week
        const dayTotals = {
            'Monday': 0,
            'Tuesday': 0,
            'Wednesday': 0,
            'Thursday': 0,
            'Friday': 0,
            'Saturday': 0,
            'Sunday': 0
        };
        
        const dayCounts = {
            'Monday': 0,
            'Tuesday': 0,
            'Wednesday': 0,
            'Thursday': 0,
            'Friday': 0,
            'Saturday': 0,
            'Sunday': 0
        };
        
        expenses.forEach(expense => {
            const date = new Date(expense.Date);
            const dayName = date.toLocaleString('en-US', { weekday: 'long' });
            dayTotals[dayName] += expense.Amount;
            dayCounts[dayName]++;
        });
        
        // Prepare data for chart
        const days = Object.keys(dayTotals);
        const values = Object.values(dayTotals);
        
        // Create chart
        const ctx = chartCanvas.getContext('2d');
        this.chartInstances.analysisWeeklyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: days,
                datasets: [{
                    label: 'Total Expense',
                    data: values,
                    backgroundColor: 'rgba(255, 99, 132, 0.8)'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => {
                                return this.settings.currency + value;
                            }
                        }
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const day = context.label;
                                return [
                                    `Total: ${this.settings.currency}${context.raw.toFixed(2)}`,
                                    `Transactions: ${dayCounts[day]}`
                                ];
                            }
                        }
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error creating analysis weekly chart:', error);
    }
};

ExpenseTracker.prototype.createPaymentMethodChart = function(paymentMethods) {
    try {
        if (this.chartInstances.paymentMethodChart) {
            this.chartInstances.paymentMethodChart.destroy();
        }
        
        const chartCanvas = document.getElementById('paymentMethodChart');
        if (!chartCanvas) return;
        
        const methods = Object.keys(paymentMethods);
        const values = Object.values(paymentMethods);
        
        // Create chart
        const ctx = chartCanvas.getContext('2d');
        this.chartInstances.paymentMethodChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: methods,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 99, 132, 0.8)'
                    ],
                    borderColor: 'white',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
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
    } catch (error) {
        console.error('Error creating payment method chart:', error);
    }
};

ExpenseTracker.prototype.createFoodSourceChart = function(sources) {
    try {
        // Destroy existing chart
        if (this.chartInstances.foodSourceChart) {
            this.chartInstances.foodSourceChart.destroy();
        }
        
        const chartCanvas = document.getElementById('foodSourceChart');
        if (!chartCanvas || sources.length === 0) return;
        
        // Prepare data for chart
        const labels = sources.map(s => s[0]);
        const values = sources.map(s => s[1]);
        
        // Create chart
        const ctx = chartCanvas.getContext('2d');
        this.chartInstances.foodSourceChart = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.8)',
                        'rgba(54, 162, 235, 0.8)',
                        'rgba(255, 206, 86, 0.8)',
                        'rgba(75, 192, 192, 0.8)',
                        'rgba(153, 102, 255, 0.8)',
                        'rgba(255, 159, 64, 0.8)',
                        'rgba(199, 199, 199, 0.8)'
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
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
    } catch (error) {
        console.error('Error creating food source chart:', error);
    }
};
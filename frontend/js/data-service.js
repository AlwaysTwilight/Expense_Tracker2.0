// Data management and service functions

ExpenseTracker.prototype.loadSettings = async function() {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/settings`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      this.settings = await response.json();
      
      // Calculate default budget based on cash and bank balance
      this.settings.defaultBudget = this.settings.defaultCashBalance + this.settings.defaultBankBalance;
      
      return this.settings;
    } catch (error) {
      console.error('Error loading settings:', error);
      
      // Initialize with default settings if there's an error
      this.settings = {
        theme: 'light',
        currency: '₹',
        dateFormat: 'dd/mm/yyyy',
        itemsPerPage: 25,
        defaultSIP: 2000,
        defaultRent: 1900,
        defaultCreditLimit: 10000,
        defaultPaymentMethod: 'UPI',
        defaultCashBalance: 2000,
        defaultBankBalance: 8000,
        defaultSavingsGoal: 1000,
        creditCardEnabled: true,
        sipEnabled: true
      };
      
      // Calculate default budget based on cash and bank balance
      this.settings.defaultBudget = this.settings.defaultCashBalance + this.settings.defaultBankBalance;
      
      return this.settings;
    }
  };
  
  ExpenseTracker.prototype.saveSettings = async function() {
    try {
      console.log('Saving settings:', JSON.stringify(this.settings));
      
      const response = await this.fetchWithAuth(`${API_URL}/settings`, {
        method: 'PUT',
        body: JSON.stringify(this.settings)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      console.log('Settings saved successfully');
      
      // Update UI elements based on new settings
      if (this.currentPage === 'budget') {
        const month = document.getElementById('budgetMonth')?.value;
        const year = parseInt(document.getElementById('budgetYear')?.value);
        if (month && year) {
          this.loadBudgetForm(month, year);
        }
      }
      
      // Update bill values with new defaults
      this.setDefaultBillValues();
      
      // Update any existing budget for the current month with new default values
      const currentMonth = this.currentMonth;
      const currentYear = this.currentYear;
      let monthBudget = this.getMonthBudget(currentMonth, currentYear);
      
      if (monthBudget) {
        // Only update SIP value if it hasn't been paid yet
        if (!monthBudget.SIPPaid) {
          monthBudget.SIP = this.settings.defaultSIP;
        }
        
        // Only update Rent value if it hasn't been paid yet
        if (!monthBudget.RentPaid) {
          monthBudget.Rent = this.settings.defaultRent;
        }
        
        // If SIP is disabled, mark it as paid
        if (!this.settings.sipEnabled) {
          monthBudget.SIPPaid = true;
        }
        
        this.saveData();
      }
      
      // Update credit card and SIP visibility
      this.updateCreditCardVisibility();
      this.updateSIPVisibility();
      
    } catch (error) {
      console.error('Error saving settings:', error);
      this.showToast('Error saving settings.', 'error');
    }
  };
  
  ExpenseTracker.prototype.loadData = async function() {
    try {
      // Load expenses from MongoDB
      const expensesResponse = await this.fetchWithAuth(`${API_URL}/expenses`);
      if (!expensesResponse.ok) {
        throw new Error(`HTTP error! status: ${expensesResponse.status}`);
      }
      
      this.expenses = await expensesResponse.json();
      
      // Convert string dates back to Date objects
      this.expenses.forEach(expense => {
        expense.Date = new Date(expense.Date);
      });
      
      // Load budgets from MongoDB
      const budgetsResponse = await this.fetchWithAuth(`${API_URL}/budgets`);
      if (!budgetsResponse.ok) {
        throw new Error(`HTTP error! status: ${budgetsResponse.status}`);
      }
      
      this.budgets = await budgetsResponse.json();
      
      return {
        expenses: this.expenses,
        budgets: this.budgets
      };
    } catch (error) {
      console.error('Error loading data:', error);
      this.showToast('Error loading data. Initializing with empty data.', 'error');
      
      // Initialize with empty arrays if there's an error
      this.expenses = [];
      this.budgets = [];
      
      // Save the empty data to override any corrupted data
      await this.saveData();
      
      return {
        expenses: [],
        budgets: []
      };
    }
  };
  
  ExpenseTracker.prototype.saveData = async function() {
    try {
      // For adding new expenses, we don't need to do anything extra as they're added via addExpense
      
      // For budget updates, check each budget to see if it needs to be updated/created in MongoDB
      for (const budget of this.budgets) {
        // Clone the budget object to avoid MongoDB-specific fields from interfering
        const budgetData = { ...budget };
        
        // Remove MongoDB _id if it exists - this will be handled by the backend
        if (budgetData._id) {
          delete budgetData._id;
        }
        
        await this.fetchWithAuth(`${API_URL}/budgets`, {
          method: 'POST',
          body: JSON.stringify(budgetData)
        });
      }
    } catch (error) {
      console.error('Error saving data:', error);
      this.showToast('Error saving data. Please export your data for backup.', 'error');
    }
  };
  
  ExpenseTracker.prototype.exportData = async function() {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/export`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `expense_tracker_export_${this.formatDateForFilename(new Date())}.json`);
      link.style.visibility = 'hidden';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Release the object URL to free up memory
      setTimeout(() => URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error exporting data:', error);
      this.showToast('Error exporting data. Please try again later.', 'error');
    }
  };
  
  ExpenseTracker.prototype.importData = async function(file) {
    const reader = new FileReader();
    
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);
        
        // Validate data structure
        if (!data.expenses || !data.budgets) {
          throw new Error('Invalid data format');
        }
        
        // Save current data to variables as backup
        const currentData = {
          expenses: this.expenses,
          budgets: this.budgets,
          settings: this.settings
        };
        
        try {
          // Send data to the API for import
          const response = await this.fetchWithAuth(`${API_URL}/import`, {
            method: 'POST',
            body: JSON.stringify(data)
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          // Update local data after successful import
          this.expenses = data.expenses.map(expense => ({
            ...expense,
            Date: new Date(expense.Date)
          }));
          
          this.budgets = data.budgets;
          
          // Optionally update settings if available
          if (data.settings) {
            this.settings = data.settings;
            await this.saveSettings();
          }
          
          this.showToast('Data imported successfully!', 'success');
          
          // Refresh UI
          this.updateDashboard();
          this.updateExpensesTable();
          if (this.currentPage === 'analysis') {
            this.updateAnalysisPage();
          } else if (this.currentPage === 'budget') {
            this.updateBudgetHistory();
          }
          
          // Apply theme
          this.applyTheme(this.settings.theme || 'light');
        } catch (error) {
          // Restore backup on error
          console.error('Error importing data:', error);
          this.showToast('Error importing data. Restoring previous data.', 'error');
          
          this.expenses = currentData.expenses;
          this.budgets = currentData.budgets;
          this.settings = currentData.settings;
        }
      } catch (error) {
        console.error('Error parsing import data:', error);
        this.showToast('Error importing data. Please check the file format.', 'error');
      }
    };
    
    reader.readAsText(file);
  };
  
  ExpenseTracker.prototype.resetApplication = async function() {
    try {
      // Call the reset API endpoint
      const response = await this.fetchWithAuth(`${API_URL}/reset`, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Clear local data
      this.expenses = [];
      this.budgets = [];
      
      // Reset to default settings
      this.settings = {
        theme: 'light',
        currency: '₹',
        dateFormat: 'dd/mm/yyyy',
        itemsPerPage: 25,
        defaultSIP: 2000,
        defaultRent: 1900,
        defaultCreditLimit: 10000,
        defaultPaymentMethod: 'UPI',
        defaultCashBalance: 2000,
        defaultBankBalance: 8000,
        defaultSavingsGoal: 1000
      };
  
      this.settings.defaultBudget = this.settings.defaultCashBalance + this.settings.defaultBankBalance;
  
      // Apply theme
      this.applyTheme('light');
      
      // Update UI
      this.updateDashboard();
      this.updateExpensesTable();
      
      this.showToast('Application has been reset to initial state.', 'success');
    } catch (error) {
      console.error('Error resetting application:', error);
      this.showToast('Error resetting application. Please try again later.', 'error');
    }
  };
  
  ExpenseTracker.prototype.updateBalanceForExpense = async function(amount, paymentMethod, date) {
    try {
        const month = date.toLocaleString('default', { month: 'long' });
        const year = date.getFullYear();
        let monthBudget = this.getMonthBudget(month, year);
        
        if (!monthBudget) {
            // Create new budget entry if it doesn't exist
            monthBudget = {
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
                SIPPaid: false,
                RentPaid: false,
                SavingsGoal: 0,
                HasSavingsGoal: false,
                CreditCardBalance: this.settings.defaultCreditLimit,
                CreditCardUsed: 0,
                PreviousMonthCredit: 0
            };
            this.budgets.push(monthBudget);
        }
        
        // Update the appropriate balance based on payment method
        if (paymentMethod === 'Credit Card') {
            // Add to credit card usage
            monthBudget.CreditCardUsed = (monthBudget.CreditCardUsed || 0) + amount;
        }
        
        await this.saveData();
    } catch (error) {
        console.error('Error updating balance for expense:', error);
    }
  };
  
  ExpenseTracker.prototype.addExpenseToMongoDB = async function(expense) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/expenses`, {
        method: 'POST',
        body: JSON.stringify(expense)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const savedExpense = await response.json();
      
      // Update the local expenses array with the saved expense
      // Convert the date back to a Date object
      savedExpense.Date = new Date(savedExpense.Date);
      
      // Add to the beginning of the array to keep newest expenses first
      this.expenses.push(savedExpense);
      
      return savedExpense;
    } catch (error) {
      console.error('Error adding expense to MongoDB:', error);
      throw error;
    }
  };
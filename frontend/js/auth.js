// Authentication related functionality

ExpenseTracker.prototype.checkAuthentication = function() {
    // Get the token from localStorage or sessionStorage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      // Redirect to login page if no token exists
      window.location.href = 'login.html';
      return false;
    }
    
    // Store the token for API requests
    this.authToken = token;
    
    // Get user info from storage
    const userJson = localStorage.getItem('user') || sessionStorage.getItem('user');
    if (userJson) {
      this.currentUser = JSON.parse(userJson);
    }
    
    return true;
  };
  
  ExpenseTracker.prototype.fetchWithAuth = async function(url, options = {}) {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }
    
    // Add authorization header
    const headers = {
      ...options.headers || {},
      'Authorization': `Bearer ${this.authToken}`
    };
    
    // Add Content-Type header for POST/PUT requests if not already set
    if ((options.method === 'POST' || options.method === 'PUT') && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }
    
    // Make the request with auth headers
    const response = await fetch(url, {
      ...options,
      headers
    });
    
    // Check if token is invalid (401 Unauthorized)
    if (response.status === 401 || response.status === 403) {
      // Clear tokens and redirect to login
      localStorage.removeItem('token');
      sessionStorage.removeItem('token');
      localStorage.removeItem('user');
      sessionStorage.removeItem('user');
      window.location.href = 'login.html';
      throw new Error('Session expired. Please login again.');
    }
    
    return response;
  };
  
  ExpenseTracker.prototype.logout = function() {
    // Clear authentication data
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('user');
    sessionStorage.removeItem('user');
    
    // Redirect to login page
    window.location.href = 'login.html';
  };
  
  ExpenseTracker.prototype.changePassword = async function(password) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/auth/password`, {
        method: 'PUT',
        body: JSON.stringify({ password })
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to change password');
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error changing password:', error);
      throw error;
    }
  };
  
  ExpenseTracker.prototype.updateUserProfile = async function(updates) {
    try {
      const response = await this.fetchWithAuth(`${API_URL}/auth/profile`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to update profile');
      }
      
      const data = await response.json();
      
      // Update stored user data
      this.currentUser = data.user;
      localStorage.setItem('user', JSON.stringify(data.user));
      sessionStorage.setItem('user', JSON.stringify(data.user));
      
      // If token was refreshed due to username change, update it
      if (data.token) {
        this.authToken = data.token;
        localStorage.setItem('token', data.token);
        sessionStorage.setItem('token', data.token);
      }
      
      return data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  };
  
  ExpenseTracker.prototype.displayUserInfo = function() {
    try {
        if (!this.currentUser) return;
        
        const userNameDisplay = document.getElementById('userNameDisplay');
        const profileName = document.getElementById('profileName');
        const profileEmail = document.getElementById('profileEmail');
        const profileUsername = document.getElementById('profileUsername');
        const profilePhone = document.getElementById('profilePhone');
        
        if (userNameDisplay) userNameDisplay.textContent = this.currentUser.name;
        if (profileName) profileName.value = this.currentUser.name;
        if (profileEmail) {
            profileEmail.value = this.currentUser.email;
            profileEmail.readOnly = true; // Email cannot be changed
        }
        if (profileUsername) {
            profileUsername.value = this.currentUser.username;
            profileUsername.readOnly = true; // Username cannot be changed
        }
        if (profilePhone) profilePhone.value = this.currentUser.phoneNumber;
        
    } catch (error) {
        console.error('Error displaying user info:', error);
    }
  };
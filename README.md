# Expense Tracker

A comprehensive web-based expense tracking application that helps users manage their personal finances, track expenses, create budgets, and gain insights into their spending habits.

## 📚 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage Guide](#usage-guide)
  - [Getting Started](#getting-started)
  - [Dashboard](#dashboard)
  - [Tracking Expenses](#tracking-expenses)
  - [Budget Management](#budget-management)
  - [Analysis & Reports](#analysis--reports)
  - [Settings & Customization](#settings--customization)
- [API Endpoints](#api-endpoints)
- [Security Features](#security-features)
- [Future Enhancements](#future-enhancements)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- **User Authentication**: Secure login, registration and profile management
- **Dashboard**: Real-time overview of financial status with dynamic metrics
- **Expense Tracking**: Categorized expense entry with multiple payment methods
- **Budget Management**: Monthly budget planning with savings goals
- **Bill Tracking**: Monitor recurring bills and payment status
- **Data Analysis**: Detailed charts and reports on spending patterns
- **Data Export/Import**: CSV/PDF export and data backup/restore functionality
- **Responsive Design**: Works on desktop and mobile devices

## 🛠️ Technology Stack

- **Frontend**: HTML, CSS, JavaScript, Bootstrap 5, Chart.js
- **Backend**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: JWT (JSON Web Tokens)
- **Security**: bcrypt.js for password hashing
- **API**: RESTful architecture

## 🔧 Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (v4 or higher)
- npm or yarn

### Setup Instructions

1. Clone the repository:
   ```bash
   git clone https://github.com/AlwaysTwilight/expense-tracker.git
   cd expense-tracker
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/expense-tracker
   JWT_SECRET=your-secret-key-change-in-production
   ```

4. Start the development server:
   ```bash
   npm start
   ```

5. Access the application at `http://localhost:5000`

## 📖 Usage Guide

### Getting Started

#### Registration and Login

1. Navigate to the login page
2. For new users, click "Register" and fill in your details
3. For existing users, enter your email/username and password
4. Optional: Check "Remember me" to stay logged in

#### Profile Management

- Update your name, email, and phone number in the Profile section
- Change your password securely
- Log out from any device

### Dashboard

The dashboard provides a comprehensive overview of your financial status:

- **Budget Overview**: Remaining budget, daily allowance, and days left in the month
- **Payment Method Balances**: Remaining cash, bank, and credit card balances
- **Today's Expenses**: Quick view of what you've spent today
- **Recent Transactions**: Your most recent expenses
- **Charts**: Visual representation of your spending patterns

### Tracking Expenses

#### Adding Expenses

1. Navigate to the Expenses page
2. Choose the appropriate category tab:
   - **Food**: For all food-related expenses
   - **Bills**: For recurring bills and payments
   - **Miscellaneous**: For other expenses

3. For Food expenses:
   - Select the food source (Restaurant, Groceries, etc.)
   - Enter individual item amounts in the list
   - Choose payment method
   - Add description if needed

4. For Bills:
   - Select the bill type (Rent, Utilities, etc.)
   - Enter the amount
   - Toggle "Already Paid" if applicable
   - Choose payment method

5. For Miscellaneous expenses:
   - Enter amount and description
   - Select or create a category tag
   - Add notes if needed
   - Choose payment method

#### Managing Expenses

- View all expenses in the Expenses table
- Search for specific expenses by any field
- Delete expenses when needed

### Budget Management

#### Setting Monthly Budget

1. Navigate to the Budget page
2. Select month and year
3. Enter your initial cash and bank balances
4. Set monthly savings goal if desired
5. Configure credit card limits as needed

#### Bill Payment Tracking

- Mark bills as paid through the Bills tab
- Track payment status for recurring bills
- Set default values for regular bills like rent and SIP

### Analysis & Reports

#### Viewing Analysis

1. Navigate to the Analysis page
2. Select date range (This month, Last month, Custom, etc.)
3. Apply filters for categories, payment methods, or amounts
4. View detailed charts and statistics

#### Exporting Reports

1. Click "Download Report"
2. Choose format (CSV or PDF)
3. The report will include all charts and data for the selected period

### Settings & Customization

#### General Settings

- Change theme (Light, Dark, Blue)
- Set currency format
- Configure date display format
- Set items per page for tables

#### Default Values

- Set default payment method
- Configure default cash/bank balances
- Set default credit card limit
- Enable/disable features like credit card tracking

#### Data Management

- Export data for backup purposes
- Import previously exported data
- Reset application data (use with caution)

## 🔌 API Endpoints

### Authentication

- `POST /api/auth/register` - Create a new user account
- `POST /api/auth/login` - Authenticate and get JWT token
- `POST /api/auth/forgot-password` - Password recovery
- `POST /api/auth/reset-password` - Reset password with token
- `PUT /api/auth/profile` - Update user profile
- `GET /api/auth/user` - Get current user information

### Expenses

- `GET /api/expenses` - Get all expenses for current user
- `POST /api/expenses` - Add a new expense
- `DELETE /api/expenses/:id` - Delete a specific expense

### Budgets

- `GET /api/budgets` - Get all budgets for current user
- `POST /api/budgets` - Create or update a budget

### Settings

- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Data Management

- `POST /api/import` - Import data from file
- `GET /api/export` - Export all user data
- `POST /api/reset` - Reset application data

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Token expiration and refresh mechanism
- Input validation and sanitization
- User-specific data isolation


## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

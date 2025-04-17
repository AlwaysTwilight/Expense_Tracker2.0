// server.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Middleware
app.use(cors({
  origin: ['https://expense-tracker2-0-1.onrender.com', 'http://localhost:3000'], 
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' }));

// Authentication middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.status(401).json({ message: 'Authentication token required' });
  
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: 'Invalid or expired token' });
    req.user = user;
    next();
  });
};

// MongoDB Connection
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Define Mongoose Schemas
const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  phoneNumber: { type: String, required: true },
  password: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const ExpenseSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Date: { type: Date, required: true },
  Category: { type: String, required: true },
  Subcategory: { type: String, required: true },
  Amount: { type: Number, required: true },
  Description: { type: String },
  Month: { type: String, required: true },
  Year: { type: Number, required: true },
  PaymentMethod: { type: String, required: true }
});

const BudgetSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  Month: { type: String, required: true },
  Year: { type: Number, required: true },
  TotalBudget: { type: Number, default: 0 },
  SIP: { type: Number, default: 0 },
  Rent: { type: Number, default: 0 },
  CreditCard: { type: Number, default: 0 },
  Electricity: { type: Number, default: 0 },
  WaterBill: { type: Number, default: 0 },
  Laundry: { type: Number, default: 0 },
  CreditCardPaid: { type: Boolean, default: false },
  ElectricityPaid: { type: Boolean, default: false },
  WaterBillPaid: { type: Boolean, default: false },
  LaundryPaid: { type: Boolean, default: false },
  SIPPaid: { type: Boolean, default: false },
  RentPaid: { type: Boolean, default: false },
  SavingsGoal: { type: Number, default: 0 },
  HasSavingsGoal: { type: Boolean, default: false },
  CreditCardBalance: { type: Number, default: 0 },
  CreditCardUsed: { type: Number, default: 0 },
  PreviousMonthCredit: { type: Number, default: 0 },
  initialCashBalance: { type: Number },
  initialBankBalance: { type: Number }
});

const SettingsSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  theme: { type: String, default: 'light' },
  currency: { type: String, default: '₹' },
  dateFormat: { type: String, default: 'dd/mm/yyyy' },
  itemsPerPage: { type: Number, default: 25 },
  defaultBudget: { type: Number, default: 15000 },
  defaultSIP: { type: Number, default: 2000 },
  defaultRent: { type: Number, default: 1900 },
  defaultCreditLimit: { type: Number, default: 10000 },
  defaultPaymentMethod: { type: String, default: 'UPI' },
  defaultCashBalance: { type: Number, default: 2000 },
  defaultBankBalance: { type: Number, default: 8000 },
  defaultSavingsGoal: { type: Number, default: 1000 },
  creditCardEnabled: { type: Boolean, default: true },
  sipEnabled: { type: Boolean, default: true }
});

// Create Models
const User = mongoose.model('User', UserSchema);
const Expense = mongoose.model('Expense', ExpenseSchema);
const Budget = mongoose.model('Budget', BudgetSchema);
const Settings = mongoose.model('Settings', SettingsSchema);

// Authentication Routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, username, phoneNumber, password } = req.body;
    
    // Check if email already exists
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email already registered. Please login.' });
    }
    
    // Check if username already exists
    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username already taken. Please choose another.' });
    }
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Create new user
    const user = new User({
      name,
      email,
      username,
      phoneNumber,
      password: hashedPassword
    });
    
    // Save user
    const savedUser = await user.save();
    
    // Create default settings for the user
    const settings = new Settings({
      userId: savedUser._id
    });
    
    await settings.save();
    
    // Generate token
    const token = jwt.sign(
      { id: savedUser._id, username: savedUser.username }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: savedUser._id,
        name: savedUser.name,
        email: savedUser.email,
        username: savedUser.username
      }
    });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { identifier, password } = req.body;
    
    // Check if user exists by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });
    
    if (!user) {
      return res.status(400).json({ message: 'Invalid email/username or password' });
    }
    
    // Validate password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: 'Invalid email/username or password' });
    }
    
    // Generate token
    const token = jwt.sign(
      { id: user._id, username: user.username }, 
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        username: user.username
      }
    });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { identifier } = req.body;
    
    // Find user by email or username
    const user = await User.findOne({
      $or: [
        { email: identifier },
        { username: identifier }
      ]
    });
    
    if (!user) {
      // Always return success for security (don't reveal if account exists)
      return res.json({ 
        message: 'If an account with that email/username exists, password reset instructions will be sent.' 
      });
    }
    
    // Generate reset token (expires in 1 hour)
    const resetToken = jwt.sign(
      { id: user._id }, 
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    
    // In a real application, you would send an email with the reset link
    // For this demo, we'll just return the token directly
    
    // Store the token in the user document (in a production app)
    user.resetToken = resetToken;
    user.resetTokenExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    
    res.json({
      message: 'Password reset instructions sent.',
      // Only include this token in development/demo environment
      // Remove in production
      resetToken: resetToken 
    });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset password using token
app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, password } = req.body;
    
    if (!token || !password) {
      return res.status(400).json({ message: 'Token and password are required' });
    }
    
    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Find user
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Verify token matches stored token (in a production app)
    if (user.resetToken !== token || user.resetTokenExpires < Date.now()) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }
    
    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    // Update password and clear reset token
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();
    
    res.json({ message: 'Password has been reset successfully' });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  try {
    const { name, phoneNumber, username, email } = req.body;
    const updates = {};
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Basic info updates
    if (name) updates.name = name;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    
    // Check if username is being updated and is different
    if (username && username !== user.username) {
      // Check if new username is already taken
      const usernameExists = await User.findOne({ username, _id: { $ne: user._id } });
      if (usernameExists) {
        return res.status(400).json({ message: 'Username already taken. Please choose another.' });
      }
      updates.username = username;
    }
    
    // Check if email is being updated and is different
    if (email && email !== user.email) {
      // Check if new email is already taken
      const emailExists = await User.findOne({ email, _id: { $ne: user._id } });
      if (emailExists) {
        return res.status(400).json({ message: 'Email already registered. Please use another.' });
      }
      updates.email = email;
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select('-password');
    
    // Create new token with updated username if changed
    let token = null;
    if (updates.username) {
      token = jwt.sign(
        { id: updatedUser._id, username: updatedUser.username }, 
        JWT_SECRET,
        { expiresIn: '24h' }
      );
    }
    
    res.json({
      message: 'Profile updated successfully',
      user: updatedUser,
      ...(token && { token }) // Include new token if username was changed
    });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/auth/user', authenticateToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.put('/api/auth/user', authenticateToken, async (req, res) => {
  try {
    const { name, phoneNumber, currentPassword, newPassword } = req.body;
    const updates = {};
    
    // Find user
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Basic info updates
    if (name) updates.name = name;
    if (phoneNumber) updates.phoneNumber = phoneNumber;
    
    // Password update if requested
    if (currentPassword && newPassword) {
      const validPassword = await bcrypt.compare(currentPassword, user.password);
      if (!validPassword) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }
      
      const salt = await bcrypt.genSalt(10);
      updates.password = await bcrypt.hash(newPassword, salt);
    }
    
    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true }
    ).select('-password');
    
    res.json({
      message: 'User profile updated successfully',
      user: updatedUser
    });
    
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Routes (now protected by auth)

// Get all expenses for current user
app.get('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id });
    res.json(expenses);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new expense
app.post('/api/expenses', authenticateToken, async (req, res) => {
  try {
    const expense = new Expense({
      ...req.body,
      userId: req.user.id
    });
    const newExpense = await expense.save();
    res.status(201).json(newExpense);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Delete an expense
app.delete('/api/expenses/:id', authenticateToken, async (req, res) => {
  try {
    const expense = await Expense.findById(req.params.id);
    
    // Check if expense exists and belongs to current user
    if (!expense) {
      return res.status(404).json({ message: 'Expense not found' });
    }
    
    if (expense.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this expense' });
    }
    
    await Expense.findByIdAndDelete(req.params.id);
    res.json({ message: 'Expense deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all budgets for current user
app.get('/api/budgets', authenticateToken, async (req, res) => {
  try {
    const budgets = await Budget.find({ userId: req.user.id });
    res.json(budgets);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Add a new budget or update existing
app.post('/api/budgets', authenticateToken, async (req, res) => {
  try {
    // Check if budget for this month/year already exists
    const existingBudget = await Budget.findOne({ 
      Month: req.body.Month, 
      Year: req.body.Year,
      userId: req.user.id
    });
    
    if (existingBudget) {
      // Update existing budget
      Object.assign(existingBudget, req.body);
      const updatedBudget = await existingBudget.save();
      return res.json(updatedBudget);
    }
    
    // Create new budget
    const budget = new Budget({
      ...req.body,
      userId: req.user.id
    });
    const newBudget = await budget.save();
    res.status(201).json(newBudget);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Get settings for current user
app.get('/api/settings', authenticateToken, async (req, res) => {
  try {
    let settings = await Settings.findOne({ userId: req.user.id });
    if (!settings) {
      // Create default settings if none exist
      settings = new Settings({ userId: req.user.id });
      await settings.save();
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Update settings
app.put('/api/settings', authenticateToken, async (req, res) => {
  try {
    const settings = await Settings.findOneAndUpdate(
      { userId: req.user.id },
      req.body,
      { new: true, upsert: true }
    );
    res.json(settings);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Import data (bulk insert)
app.post('/api/import', authenticateToken, async (req, res) => {
  try {
    // Start a MongoDB session for transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
      // Clear existing data for current user
      await Expense.deleteMany({ userId: req.user.id }, { session });
      await Budget.deleteMany({ userId: req.user.id }, { session });
      
      // Insert new data with user ID
      if (req.body.expenses && req.body.expenses.length > 0) {
        const expenses = req.body.expenses.map(expense => ({
          ...expense,
          userId: req.user.id
        }));
        await Expense.insertMany(expenses, { session });
      }
      
      if (req.body.budgets && req.body.budgets.length > 0) {
        const budgets = req.body.budgets.map(budget => ({
          ...budget,
          userId: req.user.id
        }));
        await Budget.insertMany(budgets, { session });
      }
      
      // Update settings if provided
      if (req.body.settings) {
        await Settings.findOneAndUpdate(
          { userId: req.user.id },
          req.body.settings,
          { upsert: true, new: true, session }
        );
      }
      
      // Commit the transaction
      await session.commitTransaction();
      res.status(201).json({ message: 'Data imported successfully' });
    } catch (err) {
      // Abort transaction on error
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Export data (get all data for current user)
app.get('/api/export', authenticateToken, async (req, res) => {
  try {
    const expenses = await Expense.find({ userId: req.user.id });
    const budgets = await Budget.find({ userId: req.user.id });
    const settings = await Settings.findOne({ userId: req.user.id });
    
    res.json({
      expenses,
      budgets,
      settings,
      exportDate: new Date()
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Reset application data
app.post('/api/reset', authenticateToken, async (req, res) => {
  try {
    // Delete all data for current user
    await Expense.deleteMany({ userId: req.user.id });
    await Budget.deleteMany({ userId: req.user.id });
    
    // Reset settings to default
    await Settings.findOneAndUpdate(
      { userId: req.user.id },
      {
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
        defaultBudget: 10000,
        creditCardEnabled: true,
        sipEnabled: true
      },
      { upsert: true, new: true }
    );
    
    res.json({ message: 'Application reset successfully' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Start server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

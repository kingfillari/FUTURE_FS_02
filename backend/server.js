require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const leadRoutes = require('./routes/leads');
const noteRoutes = require('./routes/notes');
const User = require('./models/User');
const Lead = require('./models/Lead');
const Note = require('./models/Note');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api', noteRoutes); // note routes are under /api/notes and /api/leads/:id/notes

// Root endpoint
app.get('/', (req, res) => {
  res.json({ message: 'CRM Backend API is running', version: '1.0.0' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Database connection and server start
const PORT = process.env.PORT || 5000;

const seedDatabase = async () => {
  try {
    // Seed admin user if none exists
    const adminCount = await User.countDocuments();
    if (adminCount === 0) {
      const defaultEmail = process.env.ADMIN_EMAIL || 'admin@crm.com';
      const defaultPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const admin = new User({
        email: defaultEmail,
        password: defaultPassword,
        role: 'admin',
        isActive: true,
      });
      await admin.save();
      console.log(`✅ Seeded admin user: ${defaultEmail} / ${defaultPassword}`);
    }

    // Seed sample leads (optional, for testing)
    const leadCount = await Lead.countDocuments();
    if (leadCount === 0) {
      const sampleLeads = [
        { name: 'John Doe', email: 'john@example.com', source: 'Portfolio Contact Form', status: 'new' },
        { name: 'Jane Smith', email: 'jane@example.com', source: 'LinkedIn', status: 'contacted' },
        { name: 'Acme Corp', email: 'contact@acme.com', source: 'Website Chat', status: 'converted' },
      ];
      await Lead.insertMany(sampleLeads);
      console.log('✅ Seeded 3 sample leads');
    }
  } catch (err) {
    console.error('Seeding error:', err);
  }
};

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ MongoDB connected');

    await seedDatabase();

    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err.message);
    process.exit(1);
  }
};

startServer();
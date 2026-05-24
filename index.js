const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const aiRoutes = require('./routes/ai');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000'
}));
app.use(express.json());

app.use('/api/ai', aiRoutes);
app.use('/api/auth', authRoutes);

app.get('/', (req, res) => {
  res.send('SmartStudy Backend is running!');
});

// Start server immediately
app.listen(process.env.PORT || 5000, () => {
  console.log(`Server running on port ${process.env.PORT || 5000}`);
});

// Connect MongoDB separately
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));
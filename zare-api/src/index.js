require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');

const app = express();

// PostgreSQL Pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // ssl: { rejectUnauthorized: false } // Uncomment if needed for production
});

// Middleware to parse JSON and URL-encoded data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer setup - memory storage (can be changed to diskStorage if needed)
const storage = multer.memoryStorage();
const upload = multer({ storage });
 

const routes = require('./routes');

app.get('/', (req, res) => {
  res.json({ message: '🚀 Welcome to ZareShop API!' });
});

 

app.use('/api/users', routes.user);
app.use('/api/auth', routes.auth);
app.use('/api/category', routes.category);

// Global error handler
app.use((err, req, res, next) => {
  console.error('🛑 Server Error:', err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server
const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`✅ ZareShop API running on http://localhost:${port}`);
});

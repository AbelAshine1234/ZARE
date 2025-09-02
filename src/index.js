require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const multer = require('multer');
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./swagger");
const cors = require('cors');

// Swagger route


const app = express();

app.use(cors()); // Enable CORS for all routes

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

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
 
app.use('/api/users', routes.user);
app.use('/api/vendors', routes.vendor);
app.use('/api/auth', routes.auth);
app.use('/api/category', routes.category);
app.use('/api/subcategory', routes.subcategory);
app.use('/api/subscription', routes.subscription);
app.use('/api/products', routes.product);
app.use('/api/wallet', routes.wallet);
app.use('/api/cashout-requests', routes.cash_out_request);
app.use('/api/drivers', routes.driver);

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

require("dotenv").config();

const express = require("express");
const cors = require("cors");

const db = require("./config/db");
db();
const authRoutes = require("./routes/authRoutes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Logger
if (process.env.NODE_ENV === "dev") {
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.originalUrl}`);
    next();
  });
}

// Routes
app.use("/api/auth", authRoutes);

// Test
app.get('/', (req, res) => {
  res.json({ 
    message: 'HRM API is running!',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
    }
  });
});

// Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
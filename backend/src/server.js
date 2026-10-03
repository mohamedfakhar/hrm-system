require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const morgan = require('morgan');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const errorHandler = require('./middlewares/errorHandler');

const app = express();
const server = http.createServer(app);

// Connect to Database
connectDB();

// Determine allowed CORS origins
const allowedOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(',').map((u) => u.trim())
  : ['http://localhost:5173', 'http://localhost:5174'];

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  })
);

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again after 15 minutes',
    code: 'RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api', globalLimiter);

// Specific Auth Limiter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: {
    success: false,
    message: 'Too many login attempts, please try again after 15 minutes',
    code: 'AUTH_RATE_LIMIT_EXCEEDED'
  }
});
app.use('/api/auth/login', authLimiter);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, curl, or Postman)
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true
  })
);

// Body Parsers
app.use(express.json());
app.use(cookieParser());

// --- Socket.io Setup with Authentication & Multi-Tab Mapping ---
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

// Map<userIdString, Set<socketId>>
const connectedUsers = new Map();
app.set('io', io);
app.set('connectedUsers', connectedUsers);

// Socket Authentication Middleware
io.use((socket, next) => {
  const token =
    socket.handshake.auth?.token ||
    socket.handshake.headers?.authorization?.split(' ')[1];

  if (!token) {
    return next(new Error('Authentication token required'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.user = decoded;
    next();
  } catch (err) {
    return next(new Error('Invalid or expired authentication token'));
  }
});

io.on('connection', (socket) => {
  const userId = socket.user.id.toString();

  if (!connectedUsers.has(userId)) {
    connectedUsers.set(userId, new Set());
  }
  connectedUsers.get(userId).add(socket.id);

  if (process.env.NODE_ENV !== 'test') {
    console.log(`[Socket] User ${userId} connected on socket ${socket.id} (Active sockets: ${connectedUsers.get(userId).size})`);
  }

  socket.on('disconnect', () => {
    if (connectedUsers.has(userId)) {
      connectedUsers.get(userId).delete(socket.id);
      if (connectedUsers.get(userId).size === 0) {
        connectedUsers.delete(userId);
      }
    }
    if (process.env.NODE_ENV !== 'test') {
      console.log(`[Socket] Socket ${socket.id} disconnected for user ${userId}`);
    }
  });
});

// --- API Routes ---
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/dashboard', require('./routes/dashboardRoutes'));
app.use('/api/performance', require('./routes/performanceRoutes'));
app.use('/api/intelligence', require('./routes/intelligenceRoutes'));

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'HRM API is operational',
    version: '1.0.0'
  });
});

// Centralized Error Handler (must be last middleware)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'test') {
  server.listen(PORT, () => {
    console.log(`[Server] HRM Backend listening on port ${PORT}`);
  });
}

module.exports = { app, server };
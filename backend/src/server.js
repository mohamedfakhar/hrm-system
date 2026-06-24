const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');        
const { Server } = require('socket.io');      
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
const server = http.createServer(app);        

//  Socket.io Setup 
const io = new Server(server, {
  cors: {
    origin: 'http://localhost:5173',
    credentials: true
  }
});

app.set('io', io);


const connectedUsers = new Map();
app.set('connectedUsers', connectedUsers);

io.on('connection', (socket) => {
  console.log(` Socket connected: ${socket.id}`);

  socket.on('register', (userId) => {
    connectedUsers.set(userId.toString(), socket.id);
    console.log(` User ${userId} registered with socket ${socket.id}`);
  });

  socket.on('disconnect', () => {
    for (const [userId, socketId] of connectedUsers.entries()) {
      if (socketId === socket.id) {
        connectedUsers.delete(userId);
        console.log(`User ${userId} disconnected`);
        break;
      }
    }
  });
});

//  Middleware 
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(cookieParser());

//  Routes 
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));

app.get('/', (req, res) => {
  res.json({ message: ' HRM API is running!' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(` Server running on http://localhost:${PORT}`);
});
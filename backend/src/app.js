const express = require('express');
const cors = require('cors');
const http = require('http');                     
const sequelize = require('./config/database');
const imageRoutes = require('./routes/imageRoutes');
const socketService = require('./services/SocketService'); 

const app = express();
const server = http.createServer(app);           

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/images', imageRoutes);

// Socket.io
socketService.init(server);                      /

// Database Sync and Server Start
const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL Connected...');
    await sequelize.sync({ alter: true });
    server.listen(PORT, () => {                   
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
  }
}

startServer();
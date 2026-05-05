const { Server } = require('socket.io');

class SocketService {
  constructor() {
    this.io = null;
  }

  init(server) {
    this.io = new Server(server, {
      cors: { origin: "*" } // Adjust for production
    });

    this.io.on('connection', (socket) => {
      const userId = socket.handshake.query.userId;
      if (userId) {
        socket.join(userId);
        console.log(`User ${userId} connected for real-time updates`);
      }
    });
  }

  notifyUser(userId, event, data) {
    if (this.io) {
      this.io.to(userId).emit(event, data);
    }
  }
}

module.exports = new SocketService();
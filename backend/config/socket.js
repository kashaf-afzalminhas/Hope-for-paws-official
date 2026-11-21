const { Server } = require("socket.io");
const socketHandler = require("../services/socketHandler");
const notificationService = require("../services/notificationService");
const { ALLOWED_ORIGINS } = require("./allowedOrigins");

const initSocket = (server) => {
  // Create a Map to store connection limits per IP
  const connectionLimits = new Map();
  
  const io = new Server(server, {
    cors: {
      origin: ALLOWED_ORIGINS,
      methods: ["GET", "POST"],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    allowEIO3: true,
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e8,
    // Add connection limits to prevent spam
    allowRequest: (req, callback) => {
      // Rate limiting: allow max 3 connections per IP per minute
      const clientIP = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      const now = Date.now();
      
      if (!connectionLimits.has(clientIP)) {
        connectionLimits.set(clientIP, []);
      }
      
      const clientConnections = connectionLimits.get(clientIP);
      const recentConnections = clientConnections.filter(time => now - time < 60000);
      
      if (recentConnections.length >= 3) {
        console.warn(`🚫 Rate limit exceeded for IP: ${clientIP} (${recentConnections.length} connections in last minute)`);
        callback(null, false);
        return;
      }
      
      recentConnections.push(now);
      connectionLimits.set(clientIP, recentConnections);
      callback(null, true);
    }
  });

  // Store socket.io instance globally for use in other parts of the app
  server.set("socketio", io);

  // Track connected users to prevent duplicates
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log("🟢 New Socket Connected:", socket.id);

    // Handle user joining
    socket.on('join', async (userId) => {
      try {
        // Validate userId
        if (!userId || typeof userId !== 'string') {
          console.error('❌ Invalid userId received:', userId);
          return;
        }
        
        // Check if user is already connected
        if (connectedUsers.has(userId)) {
          const existingSocketId = connectedUsers.get(userId);
          console.log(`⚠️ User ${userId} already connected with socket ${existingSocketId}, disconnecting duplicate`);
          
          // Disconnect the existing socket
          const existingSocket = io.sockets.sockets.get(existingSocketId);
          if (existingSocket) {
            existingSocket.disconnect();
            console.log(`🔴 Disconnected duplicate socket ${existingSocketId} for user ${userId}`);
          }
        }
        
        // Store the new connection
        connectedUsers.set(userId, socket.id);
        console.log(`✅ User ${userId} joined with socket ${socket.id}`);
        await notificationService.addUserSocket(userId, socket.id);
      } catch (error) {
        console.error('❌ Error in join event:', error);
      }
    });

    socket.on('disconnect', async () => {
      console.log("🔴 Socket Disconnected:", socket.id);
      
      // Find and remove user from connected users
      for (const [userId, socketId] of connectedUsers.entries()) {
        if (socketId === socket.id) {
          connectedUsers.delete(userId);
          await notificationService.removeUserSocket(userId);
          console.log(`👋 User ${userId} disconnected`);
          break;
        }
      }
    });

    socket.on('connect_error', (err) => {
      console.error('❌ Connection error:', err);
    });

    socketHandler(io, socket);
  });

  // Add error handling for the server
  io.engine.on("connection_error", (err) => {
    console.error("❌ Socket.IO connection error:", err);
  });

  // Cleanup old connection limits every 2 minutes
  setInterval(() => {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [ip, connections] of connectionLimits.entries()) {
      const recentConnections = connections.filter(time => now - time < 60000);
      if (recentConnections.length === 0) {
        connectionLimits.delete(ip);
        cleanedCount++;
      } else {
        connectionLimits.set(ip, recentConnections);
      }
    }
    
    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} old IP connection limits`);
    }
  }, 120000);

  // Log connection statistics every 5 minutes
  setInterval(() => {
    console.log(`📊 Socket.IO Stats: ${io.engine.clientsCount} active connections, ${connectedUsers.size} unique users, ${connectionLimits.size} IPs tracked`);
  }, 300000);

  return io;
};

module.exports = initSocket;


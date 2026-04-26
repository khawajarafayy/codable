import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import ChatMessage from '../models/ChatMessage.js';
import Class from '../instructor/models/Class.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

// Map to store socket connections: classId -> Set of sockets
const classConnections = new Map();
// Map to store user info: socketId -> { userId, userName, classId, role }
const socketUserMap = new Map();

/**
 * Initialize Socket.IO for chat functionality
 * @param {http.Server} server - The HTTP server instance
 * @returns {Server} The Socket.IO server instance
 */
export function initializeChatSocket(server) {
  const io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
      credentials: true,
      methods: ['GET', 'POST'],
    },
    namespace: '/chat',
  });

  // Middleware to verify JWT tokens
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.query.token;

      if (!token) {
        return next(new Error('Authentication failed: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      socket.userName = decoded.name || '';
      socket.userEmail = decoded.email || '';

      // If name is not in token, fetch from User model
      if (!socket.userName) {
        try {
          const user = await User.findById(socket.userId).select('name email');
          socket.userName = user?.name || 'Anonymous';
          if (!socket.userEmail && user?.email) {
            socket.userEmail = user.email;
          }
        } catch (err) {
          console.error('Error fetching user name:', err);
          socket.userName = 'Anonymous';
        }
      }

      next();
    } catch (error) {
      next(new Error('Authentication failed: Invalid token'));
    }
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`🔗 User connected to chat: ${socket.userId} (${socket.id})`);

    /**
     * Join a classroom chat room
     * Emitted by: Frontend when entering a class
     */
    socket.on('joinClass', async (data) => {
      try {
        const { classId } = data;

        if (!mongoose.Types.ObjectId.isValid(classId)) {
          socket.emit('error', { message: 'Invalid class ID' });
          return;
        }

        // Verify user has access to this class
        const classData = await Class.findById(classId);
        if (!classData) {
          socket.emit('error', { message: 'Class not found' });
          return;
        }

        const isInstructor = classData.instructorId.toString() === socket.userId;
        const isStudent = classData.students.some(
          (id) => id.toString() === socket.userId
        );

        if (!isInstructor && !isStudent) {
          socket.emit('error', { message: 'Access denied to this class' });
          return;
        }

        // Join the room
        socket.join(classId);

        // Store socket info
        const userRole = isInstructor ? 'instructor' : 'student';
        socketUserMap.set(socket.id, {
          userId: socket.userId,
          userName: socket.userName,
          userEmail: socket.userEmail,
          classId,
          role: userRole,
        });

        // Track connections per class
        if (!classConnections.has(classId)) {
          classConnections.set(classId, new Set());
        }
        classConnections.get(classId).add(socket.id);

        // Notify others that user joined
        socket.to(classId).emit('userJoined', {
          userId: socket.userId,
          userName: socket.userName,
          classId,
          role: userRole,
          timestamp: new Date(),
        });

        console.log(`✅ ${socket.userName} joined class ${classId}`);
      } catch (error) {
        console.error('Error joining class:', error);
        socket.emit('error', { message: 'Error joining class' });
      }
    });

    /**
     * Send a chat message
     * Emitted by: Frontend when user sends a message
     */
    socket.on('sendMessage', async (data) => {
      try {
        const { classId, message } = data;
        const userInfo = socketUserMap.get(socket.id);

        if (!userInfo) {
          socket.emit('error', { message: 'User not in a class' });
          return;
        }

        if (!message || !message.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Verify user still has access
        const classData = await Class.findById(classId);
        if (!classData) {
          socket.emit('error', { message: 'Class not found' });
          return;
        }

        // Save message to database
        const newMessage = new ChatMessage({
          classId: new mongoose.Types.ObjectId(classId),
          senderId: new mongoose.Types.ObjectId(socket.userId),
          senderName: socket.userName,
          senderEmail: socket.userEmail,
          senderRole: userInfo.role,
          message: message.trim(),
        });

        const savedMessage = await newMessage.save();

        // Broadcast to all users in the class
        io.to(classId).emit('messageReceived', {
          id: savedMessage._id,
          senderId: savedMessage.senderId,
          senderName: savedMessage.senderName,
          senderEmail: savedMessage.senderEmail,
          senderRole: savedMessage.senderRole,
          message: savedMessage.message,
          createdAt: savedMessage.createdAt,
          isEdited: savedMessage.isEdited,
        });

        console.log(`💬 Message from ${socket.userName} in class ${classId}`);
      } catch (error) {
        console.error('Error sending message:', error);
        socket.emit('error', { message: 'Error sending message' });
      }
    });

    /**
     * Delete a message
     * Emitted by: Frontend when user deletes their message
     */
    socket.on('deleteMessage', async (data) => {
      try {
        const { classId, messageId } = data;
        const userInfo = socketUserMap.get(socket.id);

        if (!userInfo) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        // Find the message
        const message = await ChatMessage.findById(messageId);
        if (!message) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Verify user has permission (sender or instructor)
        const classData = await Class.findById(classId);
        const isInstructor = classData.instructorId.toString() === socket.userId;
        const isSender = message.senderId.toString() === socket.userId;

        if (!isInstructor && !isSender) {
          socket.emit('error', { message: 'Permission denied' });
          return;
        }

        // Delete the message
        await ChatMessage.findByIdAndDelete(messageId);

        // Notify all users
        io.to(classId).emit('messageDeleted', {
          messageId,
          classId,
        });

        console.log(`🗑️ Message deleted: ${messageId}`);
      } catch (error) {
        console.error('Error deleting message:', error);
        socket.emit('error', { message: 'Error deleting message' });
      }
    });

    /**
     * Edit a message
     * Emitted by: Frontend when user edits their message
     */
    socket.on('editMessage', async (data) => {
      try {
        const { classId, messageId, message } = data;
        const userInfo = socketUserMap.get(socket.id);

        if (!userInfo) {
          socket.emit('error', { message: 'User not authenticated' });
          return;
        }

        if (!message || !message.trim()) {
          socket.emit('error', { message: 'Message cannot be empty' });
          return;
        }

        // Find the message
        const chatMessage = await ChatMessage.findById(messageId);
        if (!chatMessage) {
          socket.emit('error', { message: 'Message not found' });
          return;
        }

        // Only sender can edit
        if (chatMessage.senderId.toString() !== socket.userId) {
          socket.emit('error', { message: 'You can only edit your own messages' });
          return;
        }

        // Update the message
        chatMessage.message = message.trim();
        chatMessage.isEdited = true;
        chatMessage.editedAt = new Date();
        const updatedMessage = await chatMessage.save();

        // Notify all users
        io.to(classId).emit('messageEdited', {
          id: updatedMessage._id,
          message: updatedMessage.message,
          isEdited: updatedMessage.isEdited,
          editedAt: updatedMessage.editedAt,
        });

        console.log(`✏️ Message edited: ${messageId}`);
      } catch (error) {
        console.error('Error editing message:', error);
        socket.emit('error', { message: 'Error editing message' });
      }
    });



    /**
     * Disconnect handler
     */
    socket.on('disconnect', () => {
      const userInfo = socketUserMap.get(socket.id);

      if (userInfo) {
        const { classId, userName } = userInfo;

        // Remove from class connections
        if (classConnections.has(classId)) {
          classConnections.get(classId).delete(socket.id);
          if (classConnections.get(classId).size === 0) {
            classConnections.delete(classId);
          }
        }

        // Notify others
        socket.to(classId).emit('userLeft', {
          userId: socket.userId,
          userName,
          classId,
        });

        console.log(`❌ ${userName} disconnected from class ${classId}`);
      }

      socketUserMap.delete(socket.id);
    });
  });

  return io;
}

/**
 * Get active users in a class
 * @param {string} classId - The class ID
 * @returns {number} Number of active connections
 */
export function getActiveUserCount(classId) {
  const connections = classConnections.get(classId);
  return connections ? connections.size : 0;
}

/**
 * Broadcast a system message to a class
 * @param {Server} io - Socket.IO server instance
 * @param {string} classId - The class ID
 * @param {string} message - The system message
 */
export function broadcastSystemMessage(io, classId, message) {
  io.to(classId).emit('systemMessage', {
    message,
    timestamp: new Date(),
  });
}

import ChatMessage from "../models/ChatMessage.js";
import Class from "../instructor/models/Class.js";
import User from "../models/User.js";
import mongoose from "mongoose";

/**
 * Get chat history for a specific class
 * GET /api/chat/:classId
 */
export const getChatHistory = async (req, res) => {
  try {
    const { classId } = req.params;
    const userId = req.userId;
    const { limit = 50, skip = 0 } = req.query;

    // Validate classId
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    // Verify user is part of this class (instructor or enrolled student)
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isInstructor = classData.instructorId.toString() === userId;
    const isStudent = classData.students.some(
      (id) => id.toString() === userId
    );

    if (!isInstructor && !isStudent) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this class chat",
      });
    }

    // Fetch messages
    const messages = await ChatMessage.find({ classId })
      .sort({ createdAt: 1 })
      .skip(parseInt(skip))
      .limit(parseInt(limit))
      .select("senderId senderName senderEmail senderRole message isEdited editedAt createdAt");

    // Map _id to id for frontend compatibility
    const formattedMessages = messages.map((msg) => ({
      id: msg._id.toString(),
      senderId: msg.senderId,
      senderName: msg.senderName,
      senderEmail: msg.senderEmail,
      senderRole: msg.senderRole,
      message: msg.message,
      isEdited: msg.isEdited,
      editedAt: msg.editedAt,
      createdAt: msg.createdAt,
    }));

    // Get total count for pagination
    const totalCount = await ChatMessage.countDocuments({ classId });

    res.status(200).json({
      success: true,
      data: formattedMessages,
      pagination: {
        total: totalCount,
        returned: formattedMessages.length,
        skip: parseInt(skip),
        limit: parseInt(limit),
      },
    });
  } catch (error) {
    console.error("Error fetching chat history:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching chat history",
      error: error.message,
    });
  }
};

/**
 * Create a new chat message
 * POST /api/chat/:classId
 */
export const createChatMessage = async (req, res) => {
  try {
    const { classId } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(classId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class ID",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    // Verify user is part of this class
    const classData = await Class.findById(classId);
    if (!classData) {
      return res.status(404).json({
        success: false,
        message: "Class not found",
      });
    }

    const isInstructor = classData.instructorId.toString() === userId;
    const isStudent = classData.students.some(
      (id) => id.toString() === userId
    );

    if (!isInstructor && !isStudent) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this class",
      });
    }

    // Get user details from User model
    const user = await User.findById(userId).select("name email");
    const senderName = user?.name || "Unknown User";
    const senderEmail = user?.email || "";

    // Create message
    const newMessage = new ChatMessage({
      classId: new mongoose.Types.ObjectId(classId),
      senderId: new mongoose.Types.ObjectId(userId),
      senderName,
      senderEmail,
      senderRole,
      message: message.trim(),
    });

    const savedMessage = await newMessage.save();

    res.status(201).json({
      success: true,
      message: "Message sent successfully",
      data: {
        id: savedMessage._id.toString(),
        senderId: savedMessage.senderId,
        senderName: savedMessage.senderName,
        senderEmail: savedMessage.senderEmail,
        senderRole: savedMessage.senderRole,
        message: savedMessage.message,
        isEdited: savedMessage.isEdited,
        editedAt: savedMessage.editedAt,
        createdAt: savedMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error creating chat message:", error);
    res.status(500).json({
      success: false,
      message: "Error sending message",
      error: error.message,
    });
  }
};

/**
 * Delete a chat message (only by sender or instructor)
 * DELETE /api/chat/:classId/messages/:messageId
 */
export const deleteChatMessage = async (req, res) => {
  try {
    const { classId, messageId } = req.params;
    const userId = req.userId;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or message ID",
      });
    }

    // Find message
    const chatMessage = await ChatMessage.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Check permissions (sender or instructor can delete)
    const classData = await Class.findById(classId);
    const isInstructor = classData.instructorId.toString() === userId;
    const isSender = chatMessage.senderId.toString() === userId;

    if (!isInstructor && !isSender) {
      return res.status(403).json({
        success: false,
        message: "You don't have permission to delete this message",
      });
    }

    await ChatMessage.findByIdAndDelete(messageId);

    res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting chat message:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting message",
      error: error.message,
    });
  }
};

/**
 * Edit a chat message (only by sender)
 * PATCH /api/chat/:classId/messages/:messageId
 */
export const editChatMessage = async (req, res) => {
  try {
    const { classId, messageId } = req.params;
    const { message } = req.body;
    const userId = req.userId;

    // Validation
    if (!mongoose.Types.ObjectId.isValid(classId) || !mongoose.Types.ObjectId.isValid(messageId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid class or message ID",
      });
    }

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: "Message cannot be empty",
      });
    }

    // Find message
    const chatMessage = await ChatMessage.findById(messageId);
    if (!chatMessage) {
      return res.status(404).json({
        success: false,
        message: "Message not found",
      });
    }

    // Only sender can edit
    if (chatMessage.senderId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own messages",
      });
    }

    // Update message
    chatMessage.message = message.trim();
    chatMessage.isEdited = true;
    chatMessage.editedAt = new Date();
    const updatedMessage = await chatMessage.save();

    res.status(200).json({
      success: true,
      message: "Message updated successfully",
      data: {
        id: updatedMessage._id.toString(),
        senderId: updatedMessage.senderId,
        senderName: updatedMessage.senderName,
        senderEmail: updatedMessage.senderEmail,
        senderRole: updatedMessage.senderRole,
        message: updatedMessage.message,
        isEdited: updatedMessage.isEdited,
        editedAt: updatedMessage.editedAt,
        createdAt: updatedMessage.createdAt,
      },
    });
  } catch (error) {
    console.error("Error editing chat message:", error);
    res.status(500).json({
      success: false,
      message: "Error editing message",
      error: error.message,
    });
  }
};

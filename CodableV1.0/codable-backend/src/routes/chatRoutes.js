import express from "express";
import * as chatController from "../controllers/chatController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require valid JWT token
router.use(authMiddleware.authorize(["instructor", "student"]));

/**
 * Get chat history for a class
 * GET /api/chat/:classId
 * Query params: limit (default 50), skip (default 0)
 */
router.get("/:classId", chatController.getChatHistory);

/**
 * Send a new chat message
 * POST /api/chat/:classId
 * Body: { message: string }
 */
router.post("/:classId", chatController.createChatMessage);

/**
 * Delete a chat message
 * DELETE /api/chat/:classId/messages/:messageId
 */
router.delete("/:classId/messages/:messageId", chatController.deleteChatMessage);

/**
 * Edit a chat message
 * PATCH /api/chat/:classId/messages/:messageId
 * Body: { message: string }
 */
router.patch("/:classId/messages/:messageId", chatController.editChatMessage);

export default router;

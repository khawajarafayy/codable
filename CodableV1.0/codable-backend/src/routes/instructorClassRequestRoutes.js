import express from "express";
import * as instructorClassRequestController from "../controllers/instructorClassRequestController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// ============= MIDDLEWARE =============
// All routes require instructor authentication
router.use(authMiddleware.authorize(["instructor"]));

// ============= INSTRUCTOR CLASS REQUEST ROUTES =============

/**
 * Get All Pending Requests
 * GET /api/instructor/class-requests/pending
 * Returns all pending class join requests for instructor's classes
 */
router.get("/pending", instructorClassRequestController.getPendingRequests);

/**
 * Get Class-Specific Requests
 * GET /api/instructor/class-requests/:classId?status=pending|approved|rejected
 * Returns all requests for a specific class
 */
router.get("/:classId", instructorClassRequestController.getClassRequests);

/**
 * Approve Request
 * PUT /api/instructor/class-requests/:requestId/approve
 * Approves a student's join request
 */
router.put("/:requestId/approve", instructorClassRequestController.approveRequest);

/**
 * Reject Request
 * PUT /api/instructor/class-requests/:requestId/reject
 * Rejects a student's join request
 */
router.put("/:requestId/reject", instructorClassRequestController.rejectRequest);

export default router;

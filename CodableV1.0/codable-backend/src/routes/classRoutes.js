import express from "express";
import * as classController from "../controllers/classController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// ============= MIDDLEWARE =============
// All routes require valid JWT token and instructor role
router.use(authMiddleware.authorize(["instructor"]));

// ============= CLASS ROUTES =============

/**
 * Create Class
 * POST /api/classes
 * Creates a new class for the logged-in instructor
 */
router.post("/", classController.createClass);

/**
 * Get All Classes (Instructor-specific)
 * GET /api/classes/instructor
 * Returns all classes created by the logged-in instructor
 */
router.get("/instructor", classController.getInstructorClasses);

/**
 * Get Single Class
 * GET /api/classes/:classId
 * Returns a single class (only if instructor is the owner)
 */
router.get("/:classId", classController.getClass);

/**
 * Update Class
 * PUT /api/classes/:classId
 * Updates class details (only if instructor is the owner)
 */
router.put("/:classId", classController.updateClass);

/**
 * Delete Class
 * DELETE /api/classes/:classId
 * Deletes a class (only if instructor is the owner)
 */
router.delete("/:classId", classController.deleteClass);

export default router;

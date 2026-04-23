import express from "express";
import * as instructorController from "../controllers/instructorController.js";
import authMiddleware from "../../middlewares/authMiddleware.js";

const router = express.Router();

// ============= MIDDLEWARE =============
// All routes require valid JWT token and instructor role
router.use(authMiddleware.authorize(["instructor"]));

// ============= ROUTES =============

/**
 * Create Instructor Profile (On First Signup)
 * POST /api/instructor/:userId/create
 * Only callable before profile is created
 */
router.post("/:userId/create", instructorController.createInstructorProfile);

/**
 * Complete Instructor Profile (Lock immutable fields)
 * POST /api/instructor/:userId/complete
 * Locks all fields except bio after profile creation
 */
router.post("/:userId/complete", instructorController.completeInstructorProfile);

/**
 * Get Instructor Profile
 * GET /api/instructor/:userId/profile
 */
router.get("/:userId/profile", instructorController.getInstructorProfile);

/**
 * Get Instructor Profile Status
 * GET /api/instructor/:userId/status
 * Returns isProfileComplete and profileLocked flags
 */
router.get("/:userId/status", instructorController.getProfileStatus);

/**
 * Update Instructor Profile
 * PUT /api/instructor/:userId/profile
 * Before completion: all fields editable
 * After completion (profileLocked=true): only bio editable
 */
router.put("/:userId/profile", instructorController.updateInstructorProfile);

/**
 * Update Instructor Statistics
 * PUT /api/instructor/:userId/statistics
 * System endpoint to update totalClasses, totalStudents, etc.
 */
router.put("/:userId/statistics", instructorController.updateInstructorStatistics);

/**
 * Get All Instructors
 * GET /api/instructor/all
 * Returns all instructors with completed profiles (for admin/listing)
 */
router.get("/all", instructorController.getAllInstructors);

export default router;

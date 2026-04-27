import express from "express";
import * as classController from "../controllers/classController.js";
import * as assignmentController from "../controllers/assignmentController.js";
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
 * All assignments for instructor (any class)
 * GET /api/classes/assignments/all
 */
router.get("/assignments/all", assignmentController.listAllAssignmentsForInstructor);

/**
 * Class assignments (CRUD)
 * NOTE: Must be registered before GET /:classId so paths are not captured as classId.
 */
router.get("/:classId/assignments", assignmentController.listAssignmentsForClass);
router.post("/:classId/assignments", assignmentController.createAssignment);
router.patch("/:classId/assignments/:assignmentId", assignmentController.updateAssignment);
router.delete("/:classId/assignments/:assignmentId", assignmentController.deleteAssignment);
router.get(
	"/:classId/assignments/:assignmentId/submissions",
	assignmentController.getAssignmentSubmissionsForInstructor
);
router.patch(
	"/:classId/assignments/:assignmentId/submissions/:submissionId/accept",
	assignmentController.acceptSubmission
);

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

/**
 * Add Student by Email
 * POST /api/classes/:classId/add-student
 * Adds a student to the class by their email address (instructor only)
 */
router.post("/:classId/add-student", classController.addStudentByEmail);

export default router;

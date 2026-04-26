import express from "express";
import * as studentClassController from "../controllers/studentClassController.js";
import * as assignmentController from "../controllers/assignmentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// ============= MIDDLEWARE =============
// All routes require student authentication
router.use(authMiddleware.authorize(["student"]));

// ============= STUDENT CLASS ROUTES =============

/**
 * Join Class
 * POST /api/student-class/join
 * Submits a class join request using join code
 */
router.post("/join", studentClassController.joinClass);

/**
 * Get Recent Activity
 * GET /api/student-class/recent-activity
 * Returns last submitted assignment and last joined class
 */
router.get("/recent-activity", studentClassController.getRecentActivity);

/**
 * Get Student Classes
 * GET /api/student-class/classes
 * Returns all classes the student has joined
 */
router.get("/classes", studentClassController.getStudentClasses);

/**
 * Get Class Requests
 * GET /api/student-class/requests?status=pending
 * Returns pending or all class join requests
 */
router.get("/requests", studentClassController.getClassRequests);

/**
 * Published assignments for enrolled student
 * GET /api/student-class/classes/:classId/assignments
 */
router.get(
  "/classes/:classId/assignments",
  assignmentController.listPublishedAssignmentsForStudent
);

/**
 * Assignment detail for student attempt view
 * GET /api/student-class/classes/:classId/assignments/:assignmentId
 */
router.get(
  "/classes/:classId/assignments/:assignmentId",
  assignmentController.getPublishedAssignmentForStudent
);

/**
 * Submit assignment answers
 * POST /api/student-class/classes/:classId/assignments/:assignmentId/submit
 */
router.post(
  "/classes/:classId/assignments/:assignmentId/submit",
  assignmentController.submitAssignmentForStudent
);

/**
 * Get Class Details (Student View)
 * GET /api/student-class/classes/:classId
 * Returns detailed info about a specific class
 */
router.get("/classes/:classId", studentClassController.getClassDetails);

export default router;

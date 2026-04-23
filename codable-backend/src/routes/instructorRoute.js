import express from "express";
const router = express.Router();
import authMiddleware from "../middlewares/authMiddleware.js";

// Protect all routes with instructor role authorization
router.use(authMiddleware.authorize(["instructor"]));

// TODO: Add instructor-specific endpoints here
// Examples:
// router.route("/classes").post(instructorController.createClass);
// router.route("/classes").get(instructorController.getClasses);
// router.route("/tasks").post(instructorController.assignTask);
// router.route("/tasks").get(instructorController.getAssignedTasks);
// router.route("/students").get(instructorController.getEnrolledStudents);

export default router;

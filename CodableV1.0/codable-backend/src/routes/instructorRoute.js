import express from "express";
const router = express.Router();
import instructorProfileRoutes from "../instructor/routes/instructorRoutes.js";

// Mount instructor profile routes with auth middleware already applied
router.use("/", instructorProfileRoutes);

// TODO: Add instructor-specific endpoints here
// Examples:
// router.route("/classes").post(instructorController.createClass);
// router.route("/classes").get(instructorController.getClasses);
// router.route("/tasks").post(instructorController.assignTask);
// router.route("/tasks").get(instructorController.getAssignedTasks);
// router.route("/students").get(instructorController.getEnrolledStudents);

export default router;

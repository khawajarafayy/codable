import express from "express";
const router = express.Router();

import studentController from "../controllers/studentController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

// Get student profile (requires authentication)
router.route("/profile")
  .get(authMiddleware.userAuth, studentController.getStudentProfile)
  .post(authMiddleware.userAuth, studentController.createStudentProfile)
  .put(authMiddleware.userAuth, studentController.updateStudentProfile)
  .delete(authMiddleware.userAuth, studentController.deleteStudentProfile);

// Upgrade membership (requires authentication)
router.route("/membership/upgrade")
  .put(authMiddleware.userAuth, studentController.upgradeMembership);

// Analytics event ingestion (tracks practice, quiz, hint usage)
router.route("/metrics/event")
  .post(authMiddleware.userAuth, studentController.updateStudentAnalytics);

export default router;
import express from "express";
import * as adminController from "../controllers/adminController.js";
import authMiddleware from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public admin login (should be protected by strong password in prod)
router.post('/login', adminController.login);

// Metrics - requires admin JWT
router.get('/metrics', authMiddleware.authorize(['admin']), adminController.metrics);

// Get all students with details - requires admin JWT
router.get('/students', authMiddleware.authorize(['admin']), adminController.getStudents);

// Get all instructors with details - requires admin JWT
router.get('/instructors', authMiddleware.authorize(['admin']), adminController.getInstructors);

export default router;

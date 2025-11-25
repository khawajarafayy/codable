import express from "express";
const router = express.Router();

import userController from "../controllers/authController.js";
import signUpSchema from "../validators/signupValidator.js";
import loginSchema from "../validators/loginValidator.js";
import authMiddleware from "../middlewares/authMiddleware.js";


router.route("/signup").post(authMiddleware.validate(signUpSchema), userController.registerUser);
router.route("/login").post(authMiddleware.validate(loginSchema), userController.login);

export default router;
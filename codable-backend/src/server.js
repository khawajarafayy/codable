import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import authRoute from "./routes/authRoute.js";
import pistonRoute from "./routes/pistonRoute.js";
import errorMiddleware from "./middlewares/errorMiddleware.js";

const PORT = process.env.PORT || 3000;
const FRONTEND_ORIGIN = process.env.FRONTEND_ORIGIN || "http://localhost:5173";

const app = express();

// ------------------------
// CORS 
// ------------------------
app.use(cors({
  origin: FRONTEND_ORIGIN,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

// app.use((req, res, next) => {
//   res.setHeader("Access-Control-Allow-Origin", FRONTEND_ORIGIN);
//   res.setHeader("Access-Control-Allow-Credentials", "true");
//   res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS,PATCH");
//   res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept");
//   if (req.method === "OPTIONS") return res.sendStatus(204);
//   next();
// });

// ------------------------
// allow JSON body
// ------------------------
app.use(express.json());

// ------------------------
// ROUTES
// ------------------------
app.use("/auth", authRoute);
app.use("/piston", pistonRoute);

// ------------------------
// ERROR HANDLING
// ------------------------
app.use(errorMiddleware);

// ------------------------
// START SERVER
// ------------------------
app.get("/test", (req, res) => res.json({ ok: true }));

connectDB().then(() => {
  app.listen(PORT, () =>
    console.log(`Server running at http://localhost:${PORT}`)
  );
});
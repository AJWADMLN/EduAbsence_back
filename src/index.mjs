import express from "express";
import cors from "cors";
import AdminRoutes from "./routes/AdminRoutes.mjs";
import DirecteurRoutes from "./routes/DirecteurRoutes.mjs";
import { loginUnified } from "./controllers/AuthController.mjs";

const app = express();

app.use(cors({
  origin: ["http://localhost:5173", "http://127.0.0.1:5173"],
  credentials: true
}));
app.use(express.json());

// -------------------- ROUTES --------------------

//  جميع المسارات ديال Admin تحت /api/admin
app.use("/api/admin", AdminRoutes);

//  جميع المسارات ديال Directeur تحت /api/directeur
app.use("/api/directeur", DirecteurRoutes);

// Unified Auth
app.post("/api/auth/login", loginUnified);

export default app;

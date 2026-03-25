import { AdminModel } from "../models/AdminModel.mjs";
import { DirecteurModel } from "../models/DirecteurModel.mjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const loginUnified = async (req, res) => {
  try {
    const { email, password } = req.body;

    let user = await AdminModel.findOne({ email });
    let userType = "admin"; // internal type: "admin" or "directeur"
    let isMatch = false;

    if (user) {
      isMatch = await bcrypt.compare(password, user.password);
    } else {
      user = await DirecteurModel.findOne({ email });
      if (user) {
        userType = "directeur";
        isMatch = await bcrypt.compare(password, user.password);
      }
    }

    if (!user) return res.status(404).json({ message: "User not found" });
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    // Only regular admins (not admin principal) need validation
    if (userType === "admin" && user.role === "admin" && !user.validate) {
      return res.status(403).json({ message: "Account pending validation" });
    }

    // The actual role stored in DB (e.g. "admin principal")
    const finalRole = userType === "admin" ? user.role : userType;

    const payload = { id: user._id, role: finalRole, nom: user.nom, prenom: user.prenom };
    if (userType === "directeur") {
      payload.etaId = user.etaId;
    }

    const token = jwt.sign(payload, "secret", { expiresIn: "1h" });

    // Return finalRole so frontend knows if it's "admin principal"
    res.status(200).json({ token, role: finalRole });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

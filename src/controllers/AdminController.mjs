import { AdminModel } from "../models/AdminModel.mjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const createConsultant = async (req, res) => {
  try {
    const { nom, prenom, email, password } = req.body;

    const existingUser = await AdminModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const consultant = new AdminModel({
      nom,
      prenom,
      email,
      password: hashedPassword,
      role: "consultant",
      validate: true // Instantly validated when created by admin principal
    });

    await consultant.save();
    res.status(201).json({ message: "Consultant created successfully", consultant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await AdminModel.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

    if (user.role === "consultant" && !user.validate) {
      return res.status(403).json({ message: "Account pending validation" });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      "secret",
      { expiresIn: "1h" }
    );

    res.status(200).json({ token, role: user.role });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getConsultants = async (req, res) => {
  try {
    const consultants = await AdminModel.find({ role: "consultant" }).select("-password");
    res.status(200).json(consultants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteConsultant = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AdminModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ message: "Consultant not found" });
    res.status(200).json({ message: "Consultant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminPrincipal = async (req, res) => {
  try {
    const { nom, prenom, email, oldPassword, newPassword } = req.body;
    
    const admin = await AdminModel.findById(req.user.id);
    if (!admin) return res.status(404).json({ message: "Admin principal not found" });

    const updateData = {};
    if (nom) updateData.nom = nom;
    if (prenom) updateData.prenom = prenom;

    const isEmailChanged = email && email !== admin.email;
    const isPasswordChanged = newPassword && newPassword.trim() !== "";

    if (isEmailChanged || isPasswordChanged) {
      if (!oldPassword) {
        return res.status(400).json({ message: "L'ancien mot de passe est requis pour modifier l'email ou le mot de passe" });
      }

      const isMatch = await bcrypt.compare(oldPassword, admin.password);
      if (!isMatch) {
        return res.status(400).json({ message: "L'ancien mot de passe est incorrect" });
      }

      if (isEmailChanged) {
        const existingEmail = await AdminModel.findOne({ email });
        if (existingEmail) return res.status(400).json({ message: "Cet email est déjà utilisé" });
        updateData.email = email;
      }

      if (isPasswordChanged) {
        updateData.password = await bcrypt.hash(newPassword, 10);
      }
    }

    const adminInfo = await AdminModel.findByIdAndUpdate(req.user.id, updateData, { new: true }).select("-password");
    res.status(200).json({ message: "Admin principal updated successfully", adminInfo });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

import { DirecteurModel } from "../models/DirecteurModel.mjs";
import { EtaModel } from "../models/EtaModel.mjs";
import { EnseignModel } from "../models/EnseignModel.mjs";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

//  إنشاء مدير جديد (خاص بالـ Admin)
export const createDirecteurAccount = async (req, res) => {
  try {
    const { id, nom, prenom, email, password, etaId } = req.body;

    const existingUser = await DirecteurModel.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    let newId = id;
    if (!newId) {
      const highest = await DirecteurModel.findOne().sort("-id");
      newId = highest && highest.id ? highest.id + 1 : 1;
    }

    const directeur = new DirecteurModel({
      id: newId,
      nom,
      prenom,
      email,
      password: hashedPassword,
      role: "directeur",
      etaId
    });

    await directeur.save();
    res.status(201).json({ message: "Directeur account created successfully", directeur });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  جميع المديرين (خاص بالـ Admin)
export const getDirecteurs = async (req, res) => {
  try {
    const directeurs = await DirecteurModel.find();
    res.status(200).json(directeurs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  مدير واحد بالـ id (خاص بالـ Admin)
export const getDirecteurById = async (req, res) => {
  try {
    const directeur = await DirecteurModel.findOne({ id: parseInt(req.params.id) });
    if (!directeur) return res.status(404).json({ message: "Directeur not found" });
    res.status(200).json(directeur);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  تعديل مدير (خاص بالـ Admin)
export const updateDirecteur = async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    const directeur = await DirecteurModel.findOneAndUpdate(
      { id: parseInt(req.params.id) },
      updates,
      { new: true }
    );
    if (!directeur) return res.status(404).json({ message: "Directeur not found" });
    res.status(200).json(directeur);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  حذف مدير (خاص بالـ Admin)
export const deleteDirecteur = async (req, res) => {
  try {
    const directeur = await DirecteurModel.findOneAndDelete({ id: parseInt(req.params.id) });
    if (!directeur) return res.status(404).json({ message: "Directeur not found" });
    res.status(200).json({ message: "Directeur deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//  المدير + المؤسسة + الأساتذة ديال المؤسسة (خاص بالـ Admin)
export const getDirecteurWithEtablissementAndEnseignants = async (req, res) => {
  try {
    const directeur = await DirecteurModel.findOne({ id: parseInt(req.params.id) });
    if (!directeur) return res.status(404).json({ message: "Directeur not found" });

    const etablissement = await EtaModel.findOne({ id: directeur.etaId });
    const enseignants = await EnseignModel.find({ etaId: directeur.etaId });

    res.status(200).json({
      directeur,
      etablissement,
      enseignants
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//login directeur

export const loginDirecteur = async (req, res) => {
  try {
    const { email, password } = req.body;
    const directeur = await DirecteurModel.findOne({ email });
    if (!directeur) {
      return res.status(404).json({ message: "Directeur not found" });
    }

    const isMatch = await bcrypt.compare(password, directeur.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: directeur._id, role: "directeur", etaId: directeur.etaId },
      "secret",
      { expiresIn: "1h" }
    );

    res.status(200).json({ token, role: "directeur" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
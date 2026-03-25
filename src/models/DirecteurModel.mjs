import mongoose from "mongoose";

const DirecteurSchema = mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["directeur"], required: true },
  etaId: { type: Number, required: true }
});

export const DirecteurModel = mongoose.model("Directeur", DirecteurSchema);

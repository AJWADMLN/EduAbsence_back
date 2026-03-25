import mongoose from "mongoose";

const EnseignSchema = mongoose.Schema({
  ppr: { type: Number, required: true, unique: true },
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  sexe: { type: String, enum: ["Masculin", "Féminin"], required: true },
  etaId: { type: Number, ref: "Eta", required: true },
  cycle: {
    type: String,
    enum: ["Primaire", "Collège", "Lycée"]
  },
  matiere: { type: String },
  totalHeureAbsences: {
    type: Number,
    default: 0
  }
});

export const EnseignModel = mongoose.model("Enseignant", EnseignSchema);

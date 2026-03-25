import mongoose from "mongoose";

const AdminSchema = mongoose.Schema({
  nom: { type: String, required: true },
  prenom: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ["consultant", "admin principal"], required: true },
  validate: { type: Boolean, default: false }
}, { suppressReservedKeysWarning: true });

export const AdminModel = mongoose.model("User", AdminSchema);

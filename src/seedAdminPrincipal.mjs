import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { AdminModel } from "./models/AdminModel.mjs";

dotenv.config();

const MONGO_URI = process.env.DB || "mongodb+srv://mlnedu2005:Mln%4023092005@eduabsencecluster.7q2dnns.mongodb.net/GestionAbsenceAPI?appName=EduAbsenceCluster";

async function seedAdminPrincipal() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("Connected to MongoDB.");

    const existingPrincipal = await AdminModel.findOne({ email: "mlnedu2005@gmail.com" });
    if (existingPrincipal) {
      console.log("Admin principal already exists. Updating details just in case...");
      existingPrincipal.nom = "mln";
      existingPrincipal.prenom = "ajwad";
      existingPrincipal.password = await bcrypt.hash("123456", 10);
      existingPrincipal.role = "admin principal";
      // Admin principal doesn't technically need validation, but setting it explicitly to avoid any potential logic holes
      existingPrincipal.validate = true;
      await existingPrincipal.save();
      console.log("Admin principal updated successfully.");
    } else {
      console.log("Creating new Admin principal...");
      const hashedPassword = await bcrypt.hash("123456", 10);
      const adminPrincipal = new AdminModel({
        nom: "mln",
        prenom: "ajwad",
        email: "mlnedu2005@gmail.com",
        password: hashedPassword,
        role: "admin principal",
        validate: true
      });
      await adminPrincipal.save();
      console.log("Admin principal created successfully.");
    }
  } catch (error) {
    console.error("Error seeding admin principal:", error);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB.");
  }
}

seedAdminPrincipal();

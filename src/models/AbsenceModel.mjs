import mongoose from "mongoose";

const AbsenceSchema = mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  dateAbsence: { type: Date, required: true },
  enseignantPpr: { type: Number, required: true },
  etaId: { type: Number, required: true },
  periode: {
    type: Number,
    min: 1,
    max: 4,
    required: true
  },
  heureDebut: { type: String, default: "09:00" },
  quart: { type: String, enum: ["matin", "soir"] }
});
AbsenceSchema.set("toJSON", {
  transform: (doc, ret) => {  
    if (ret.dateAbsence) {
      ret.dateAbsence = new Date(ret.dateAbsence).toISOString().split("T")[0];
    }
    return ret;
  }
});

export const AbsenceModel = mongoose.model("Absence", AbsenceSchema);

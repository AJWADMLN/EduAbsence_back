import express from "express";
import verifyToken from "../middlewares/verifyToken.mjs";
import verifyRole from "../middlewares/verifyRole.mjs";
import {
  getAbsencesByDirecteur,
  createAbsence,
  updateAbsence,
  deleteAbsence,
  getDirecteurStats,
  getAbsencesByEnseignant,
  getStatistiquesParPeriode,
  getAbsencesAujourdhuiDirecteur
} from "../controllers/AbsenceController.mjs";
import { loginDirecteur } from "../controllers/DirecteurController.mjs";
import {
  getEnseignants,
  getEnseignantByPprDirecteur
} from "../controllers/EnseignController.mjs";
import { getEtablissementDirecteur } from "../controllers/EtaController.mjs";

const DirecteurRoutes = express.Router();

DirecteurRoutes.get("/enseignants", verifyToken, verifyRole("directeur"), getEnseignants);
DirecteurRoutes.get("/enseignants/:ppr", verifyToken, verifyRole("directeur"), getEnseignantByPprDirecteur);
DirecteurRoutes.get("/enseignant/:ppr/absences", verifyToken, verifyRole("directeur"), getAbsencesByEnseignant);

DirecteurRoutes.post("/login", loginDirecteur);
DirecteurRoutes.get("/etablissement", verifyToken, verifyRole("directeur"), getEtablissementDirecteur);
DirecteurRoutes.get("/absences", verifyToken, verifyRole("directeur"), getAbsencesByDirecteur);
DirecteurRoutes.post("/absence", verifyToken, verifyRole("directeur"), createAbsence);
DirecteurRoutes.put("/absence/:id", verifyToken, verifyRole("directeur"), updateAbsence);
DirecteurRoutes.delete("/absence/:id", verifyToken, verifyRole("directeur"), deleteAbsence);
DirecteurRoutes.get("/statistiques/par-periode", verifyToken, verifyRole("directeur"), getStatistiquesParPeriode);
DirecteurRoutes.get("/statistiques/absences-aujourd-hui", verifyToken, verifyRole("directeur"), getAbsencesAujourdhuiDirecteur);
DirecteurRoutes.get("/statistiques", verifyToken, verifyRole("directeur"), getDirecteurStats);

export default DirecteurRoutes;

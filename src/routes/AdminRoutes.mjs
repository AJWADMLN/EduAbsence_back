import express from "express";
import { createConsultant, getConsultants, deleteConsultant, updateAdminPrincipal } from "../controllers/AdminController.mjs";
// DIRECTEUR Controllers
import {
  createDirecteurAccount,
  getDirecteurs,
  getDirecteurById,
  updateDirecteur,
  deleteDirecteur,
  getDirecteurWithEtablissementAndEnseignants
} from "../controllers/DirecteurController.mjs";

// ENSEIGNANT Controllers
import {
  getEnseignants,
  getEnseignantById,
  createEnseignant,
  updateEnseignant,
  deleteEnseignant,
  getEnseignantsByEtablissement
} from "../controllers/EnseignController.mjs";

// ETABLISSEMENT Controllers
import {
  getEtablissements,
  getEtablissementById,
  createEtablissement,
  updateEtablissement,
  deleteEtablissement,
  getEtablissementWithEnseignants
} from "../controllers/EtaController.mjs";

// ADMIN Controllers
import verifyToken from "../middlewares/verifyToken.mjs";
import verifyRole from "../middlewares/verifyRole.mjs";

// ABSENCE Controller
import {
  getAdminStats,
  getAllAbsences,
  getTopAbsents,
  getAbsencesAujourdhui,
  getStatistiquesParMois
} from "../controllers/AbsenceController.mjs";

const AdminRoutes = express.Router();

const allAdmins = ["consultant", "admin principal"];
const onlyPrincipal = ["admin principal"];

/* -------------------- CONSULTANT MANAGEMENT -------------------- */
AdminRoutes.post("/consultant", verifyToken, verifyRole(onlyPrincipal), createConsultant);
AdminRoutes.get("/consultants", verifyToken, verifyRole(onlyPrincipal), getConsultants);
AdminRoutes.delete("/consultant/:id", verifyToken, verifyRole(onlyPrincipal), deleteConsultant);

/* -------------------- ADMIN PRINCIPAL -------------------- */
AdminRoutes.put("/principal", verifyToken, verifyRole("admin principal"), updateAdminPrincipal);

/* -------------------- DIRECTEURS CRUD -------------------- */
AdminRoutes.post("/directeur", verifyToken, verifyRole(onlyPrincipal), createDirecteurAccount);
AdminRoutes.get("/directeurs", verifyToken, verifyRole(allAdmins), getDirecteurs);
AdminRoutes.get("/directeur/:id", verifyToken, verifyRole(allAdmins), getDirecteurById);
AdminRoutes.put("/directeur/:id", verifyToken, verifyRole(onlyPrincipal), updateDirecteur);
AdminRoutes.delete("/directeur/:id", verifyToken, verifyRole(onlyPrincipal), deleteDirecteur);
AdminRoutes.get("/directeur/:id/details", verifyToken, verifyRole(allAdmins), getDirecteurWithEtablissementAndEnseignants);
/* -------------------- ENSEIGNANTS CRUD -------------------- */
AdminRoutes.get("/enseignants", verifyToken, verifyRole(allAdmins), getEnseignants);
AdminRoutes.get("/enseignant/:ppr", verifyToken, verifyRole(allAdmins), getEnseignantById);
AdminRoutes.post("/enseignant", verifyToken, verifyRole(onlyPrincipal), createEnseignant);
AdminRoutes.put("/enseignant/:ppr", verifyToken, verifyRole(onlyPrincipal), updateEnseignant);
AdminRoutes.delete("/enseignant/:ppr", verifyToken, verifyRole(onlyPrincipal), deleteEnseignant);
AdminRoutes.get("/enseignants/byEtablissement/:etaId", verifyToken, verifyRole(allAdmins), getEnseignantsByEtablissement);
/* -------------------- ETABLISSEMENTS CRUD -------------------- */
AdminRoutes.get("/etablissements", verifyToken, verifyRole(allAdmins), getEtablissements);
AdminRoutes.get("/etablissement/:id", verifyToken, verifyRole(allAdmins), getEtablissementById);
AdminRoutes.post("/etablissement", verifyToken, verifyRole(onlyPrincipal), createEtablissement);
AdminRoutes.put("/etablissement/:id", verifyToken, verifyRole(onlyPrincipal), updateEtablissement);
AdminRoutes.delete("/etablissement/:id", verifyToken, verifyRole(onlyPrincipal), deleteEtablissement);
AdminRoutes.get("/etablissementWithEnseignants/:etaId", verifyToken, verifyRole(allAdmins), getEtablissementWithEnseignants);
/* -------------------- ABSENCE & STATISTIQUES -------------------- */
AdminRoutes.get("/absences", verifyToken, verifyRole(allAdmins), getAllAbsences);
AdminRoutes.get("/statistiques/top-absents", verifyToken, verifyRole(allAdmins), getTopAbsents);
AdminRoutes.get("/statistiques/absences-aujourd-hui", verifyToken, verifyRole(allAdmins), getAbsencesAujourdhui);
AdminRoutes.get("/statistiques/par-mois", verifyToken, verifyRole(allAdmins), getStatistiquesParMois);
AdminRoutes.get("/statistiques", verifyToken, verifyRole(allAdmins), getAdminStats);

export default AdminRoutes;

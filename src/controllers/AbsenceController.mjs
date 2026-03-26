import { AbsenceModel } from "../models/AbsenceModel.mjs";
import { EnseignModel } from "../models/EnseignModel.mjs";
import { EtaModel } from "../models/EtaModel.mjs";
// -------------------- ADMIN: جميع الغيابات --------------------
export const getAllAbsences = async (req, res) => {
  try {
    const absences = await AbsenceModel.find();

    const formatted = absences.map(abs => ({
      ...abs._doc,
      dateAbsence: abs.dateAbsence.toISOString().split("T")[0]
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DIRECTEUR: الغيابات ديال المؤسسة --------------------
export const getAbsencesByDirecteur = async (req, res) => {
  try {
    const { etaId } = req.user;
    const absences = await AbsenceModel.find({ etaId });

    const formatted = absences.map(abs => ({
      ...abs._doc,
      dateAbsence: abs.dateAbsence.toISOString().split("T")[0]
    }));

    res.status(200).json(formatted);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DIRECTEUR: تصريح بغياب --------------------
export const createAbsence = async (req, res) => {
  try {
    const { id, dateAbsence, enseignantPpr, periode, quart, heureDebut } = req.body;
    const { etaId } = req.user;
    if (periode < 1 || periode > 4) {
      return res.status(400).json({ message: "La période doit être entre 1h et 4h" });
    }

    // تحقق أن الأستاذ ينتمي لنفس المؤسسة
    const ensei = await EnseignModel.findOne({ ppr: enseignantPpr });
    if (!ensei || ensei.etaId !== etaId) {
      return res.status(403).json({ message: "Directeur et enseignant doivent appartenir à la même établissement" });
    }

    // تحقق من عدم وجود غياب مسبق لنفس الأستاذ في نفس اليوم
    const startOfDay = new Date(dateAbsence);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(dateAbsence);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const existingAbsence = await AbsenceModel.findOne({
      enseignantPpr,
      dateAbsence: { $gte: startOfDay, $lte: endOfDay }
    });

    if (existingAbsence) {
      return res.status(400).json({ message: "Cet enseignant a déjà une absence enregistrée pour ce jour." });
    }

    let finalHeureDebut = heureDebut;
    if (!finalHeureDebut) {
      finalHeureDebut = quart === "soir" ? "15:00" : "09:00";
    }

    const absence = new AbsenceModel({
      id: id || Date.now(),
      dateAbsence,
      enseignantPpr,
      etaId,
      periode,
      quart,
      heureDebut: finalHeureDebut
    });
    await absence.save();

    // تحديث مجموع الساعات ديال الأستاذ
    const enseignant = await EnseignModel.findOne({ ppr: enseignantPpr });
    if (enseignant) {
      enseignant.totalHeureAbsences = (enseignant.totalHeureAbsences || 0) + periode;
      await enseignant.save();
    }

    res.status(201).json({
      ...absence._doc,
      dateAbsence: absence.dateAbsence.toISOString().split("T")[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DIRECTEUR: تعديل غياب --------------------
export const updateAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    const { periode } = req.body;
    const { etaId } = req.user;

    if (periode < 1 || periode > 4) {
      return res.status(400).json({ message: "La période doit être entre 1h et 4h" });
    }

    const oldAbsence = await AbsenceModel.findOne({id:parseInt(id)});
    if (!oldAbsence) {
      return res.status(404).json({ message: "Absence not found" });
    }

    // تحقق أن الأستاذ ينتمي لنفس المؤسسة
    const ensei = await EnseignModel.findOne({ ppr: oldAbsence.enseignantPpr });
    if (!ensei || ensei.etaId !== etaId) {
      return res.status(403).json({ message: "Directeur et enseignant doivent appartenir à la même établissement" });
    }

    const updated = await AbsenceModel.findOneAndUpdate({id:parseInt(id)}, req.body, { new: true });

    // تعديل مجموع الساعات ديال الأستاذ
    if(oldAbsence.enseignantPpr===updated.enseignantPpr){
      const enseignant = await EnseignModel.findOne({ ppr: updated.enseignantPpr });
      if (enseignant) {
        enseignant.totalHeureAbsences =
          (enseignant.totalHeureAbsences || 0) - (oldAbsence.periode || 0) + (updated.periode || 0);
        await enseignant.save();
      }
    }else{
      const enseignant_upd = await EnseignModel.findOne({ ppr: updated.enseignantPpr });
      if (enseignant_upd) {
        enseignant_upd.totalHeureAbsences =
          (enseignant_upd.totalHeureAbsences || 0) + (updated.periode || 0);
        await enseignant_upd.save();
      }
      const enseignant_old = await EnseignModel.findOne({ ppr: oldAbsence.enseignantPpr });
      if (enseignant_old) {
        enseignant_old.totalHeureAbsences =
          (enseignant_old.totalHeureAbsences || 0) - (oldAbsence.periode || 0);
        await enseignant_old.save();
      }
    }
    

    res.status(200).json({
      ...updated._doc,
      dateAbsence: updated.dateAbsence.toISOString().split("T")[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DIRECTEUR: حذف غياب --------------------
export const deleteAbsence = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await AbsenceModel.findOneAndDelete({id:parseInt(id)});
    const { etaId } = req.user;
    
    if (!deleted) {
      return res.status(404).json({ message: "Absence not found" });
    }
    
    // تحقق أن الأستاذ ينتمي لنفس المؤسسة
    const ensei = await EnseignModel.findOne({ ppr: deleted.enseignantPpr });
    if (!ensei || ensei.etaId !== etaId) {
      return res.status(403).json({ message: "Directeur et enseignant doivent appartenir à la même établissement" });
    }

    // تعديل مجموع الساعات ديال الأستاذ
    const enseignant = await EnseignModel.findOne({ ppr: deleted.enseignantPpr });
    if (enseignant) {
      enseignant.totalHeureAbsences =
      (enseignant.totalHeureAbsences || 0) - (deleted.periode || 0);
      if (enseignant.totalHeureAbsences < 0) enseignant.totalHeureAbsences = 0;
      await enseignant.save();
    }
    
    res.status(200).json({ message: "Absence deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- ADMIN: STATES --------------------

export const getAdminStats = async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);
    const byCycle={}
    const bySexe={}
    const byEta={}
    const absences = await AbsenceModel.find({
      dateAbsence: { $gte: startDate, $lte: endDate }
    });

    for (const abs of absences) {
      const enseignant = await EnseignModel.findOne({ ppr: abs.enseignantPpr });
      if (enseignant) {
        const cycle = enseignant.cycle;
        byCycle[cycle] = (byCycle[cycle] || 0) + 1;

        const sexe = enseignant.sexe;
        bySexe[sexe] = (bySexe[sexe] || 0) + 1;
      }

      const eta = abs.etaId;
      byEta[eta] = (byEta[eta] || 0) + 1;
    }

    res.status(200).json({ byCycle, bySexe, byEta });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DIRECTEUR: STATES --------------------

export const getDirecteurStats = async (req, res) => {
  try {
    const { start, end } = req.query;
    const startDate = new Date(start);
    const endDate = new Date(end);

    // تنسيق التاريخ باش يكون YYYY-MM-DD
    const formattedStart = startDate.toISOString().split("T")[0];
    const formattedEnd = endDate.toISOString().split("T")[0];

    const { etaId } = req.user;

    // جلب الغيابات داخل الفترة و المؤسسة ديالو
    const absences = await AbsenceModel.find({
      etaId,
      dateAbsence: { $gte: formattedStart, $lte: formattedEnd }
    });
    // console.log(startDate,endDate)
    const bySexe = {};
    const heuresParEnseignant = {};

    // نستعمل Map باش نتأكد أن كل أستاذ كيتجمعو ليه جميع الغيابات
    for (const abs of absences) {
      const enseignant = await EnseignModel.findOne({ ppr: abs.enseignantPpr });
      if (enseignant) {
        // Absences par sexe
        const sexe = enseignant.sexe;
        bySexe[sexe] = (bySexe[sexe] || 0) + 1;

        // Heures d'absence par enseignant
        const ppr = enseignant.ppr;
        heuresParEnseignant[ppr] = (heuresParEnseignant[ppr] || 0) + abs.periode;
      }
    }

    res.status(200).json({ bySexe, heuresParEnseignant });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DIRECTEUR: historique absences d'un enseignant --------------------

// Helper: calcule heureFin à partir de heureDebut (format "HH:MM") + periode (en heures)
const computeHeureFin = (heureDebut, periode) => {
  const [h, m] = heureDebut.split(":").map(Number);
  const totalMinutes = h * 60 + m + periode * 60;
  const finH = Math.floor(totalMinutes / 60);
  const finM = totalMinutes % 60;
  return `${String(finH).padStart(2, "0")}:${String(finM).padStart(2, "0")}`;
};

export const getAbsencesByEnseignant = async (req, res) => {
  try {
    const { etaId } = req.user;
    const ppr = parseInt(req.params.ppr);

    // Vérifie l'existence et l'appartenance à l'établissement
    const enseignant = await EnseignModel.findOne({ ppr });
    if (!enseignant) return res.status(404).json({ message: "Enseignant not found" });

    if (enseignant.etaId !== etaId) {
      return res.status(403).json({ message: "Cet enseignant n'appartient pas à votre établissement" });
    }

    // Construction du filtre de date optionnel
    const query = { enseignantPpr: ppr };
    const { start, end } = req.query;
    if (start || end) {
      query.dateAbsence = {};
      if (start) query.dateAbsence.$gte = new Date(start);
      if (end) query.dateAbsence.$lte = new Date(end);
    }

    const absences = await AbsenceModel.find(query).sort({ dateAbsence: -1 });

    const totalHeures = absences.reduce((sum, abs) => sum + abs.periode, 0);

    const formatted = absences.map(abs => {
      const hd = abs.heureDebut || (abs.quart === "soir" ? "15:00" : "09:00");
      return {
        id: abs.id,
        dateAbsence: abs.dateAbsence.toISOString().split("T")[0],
        periode: abs.periode,
        heureDebut: hd,
        heureFin: computeHeureFin(hd, abs.periode)
      };
    });

    res.status(200).json({
      enseignant: {
        ppr: enseignant.ppr,
        nom: enseignant.nom,
        prenom: enseignant.prenom
      },
      totalHeures,
      absences: formatted
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================================================================
// ADMIN — NOUVELLES STATISTIQUES
// ===================================================================

// -------------------- ADMIN: top-absents --------------------
export const getTopAbsents = async (req, res) => {
  try {
    let limit = parseInt(req.query.limit) || 3;
    if (limit > 10) limit = 10;

    const enseignants = await EnseignModel.find()
      .sort({ totalHeureAbsences: -1 })
      .limit(limit);

    const result = [];
    for (let i = 0; i < enseignants.length; i++) {
      const ens = enseignants[i];
      const eta = await EtaModel.findOne({ id: ens.etaId });
      result.push({
        rank: i + 1,
        ppr: ens.ppr,
        nom: ens.nom,
        prenom: ens.prenom,
        sexe: ens.sexe,
        etablissement: eta ? eta.nom : null,
        totalHeureAbsences: ens.totalHeureAbsences
      });
    }

    res.status(200).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- ADMIN: absences-aujourd-hui --------------------
export const getAbsencesAujourdhui = async (req, res) => {
  try {
    const dateStr = new Date().toISOString().split("T")[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay   = new Date(`${dateStr}T23:59:59.999Z`);

    const absences = await AbsenceModel.find({
      dateAbsence: { $gte: startOfDay, $lte: endOfDay }
    });

    const absents = [];
    for (const abs of absences) {
      const ens = await EnseignModel.findOne({ ppr: abs.enseignantPpr });
      const eta = await EtaModel.findOne({ id: abs.etaId });
      if (ens) {
        const hd = abs.heureDebut || (abs.quart === "soir" ? "15:00" : "09:00");
        absents.push({
          ppr: ens.ppr,
          nom: ens.nom,
          prenom: ens.prenom,
          sexe: ens.sexe,
          etablissement: eta ? eta.nom : null,
          periode: abs.periode,
          heureDebut: hd,
          heureFin: computeHeureFin(hd, abs.periode)
        });
      }
    }

    res.status(200).json({ date: dateStr, total: absents.length, absents });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- ADMIN: par-mois --------------------
const MOIS_FR = ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"];

export const getStatistiquesParMois = async (req, res) => {
  try {
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const { etaId, cycle } = req.query;

    const startOfYear = new Date(`${year}-01-01T00:00:00.000Z`);
    const endOfYear   = new Date(`${year}-12-31T23:59:59.999Z`);

    let absences = await AbsenceModel.find({
      dateAbsence: { $gte: startOfYear, $lte: endOfYear }
    });

    // Filtre optionnel par établissement
    if (etaId) {
      absences = absences.filter(abs => abs.etaId === parseInt(etaId));
    }

    // Filtre optionnel par cycle (jointure en mémoire)
    if (cycle) {
      const enseignants = await EnseignModel.find({ cycle });
      const pprSet = new Set(enseignants.map(e => e.ppr));
      absences = absences.filter(abs => pprSet.has(abs.enseignantPpr));
    }

    // Initialise les 12 mois à zéro
    const monthData = MOIS_FR.map(mois => ({ mois, totalAbsences: 0, totalHeures: 0 }));

    for (const abs of absences) {
      const month = new Date(abs.dateAbsence).getUTCMonth(); // 0-indexed
      monthData[month].totalAbsences += 1;
      monthData[month].totalHeures   += abs.periode;
    }

    res.status(200).json({ year, data: monthData });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===================================================================
// DIRECTEUR — NOUVELLES STATISTIQUES
// ===================================================================

// -------------------- DIRECTEUR: par-periode (matin / soir) --------------------
// Convention : periode <= 2 → matin, periode > 2 → soir
export const getStatistiquesParPeriode = async (req, res) => {
  try {
    const { etaId } = req.user;
    const { start, end } = req.query;

    const query = { etaId };
    if (start || end) {
      query.dateAbsence = {};
      if (start) query.dateAbsence.$gte = new Date(start);
      if (end)   query.dateAbsence.$lte = new Date(`${end}T23:59:59.999Z`);
    }

    const absences = await AbsenceModel.find(query);
    const eta = await EtaModel.findOne({ id: etaId });

    const stats = {
      matin: { totalAbsences: 0, totalHeures: 0 },
      soir:  { totalAbsences: 0, totalHeures: 0 }
    };

    for (const abs of absences) {
      const slot = abs.periode <= 2 ? "matin" : "soir";
      stats[slot].totalAbsences += 1;
      stats[slot].totalHeures   += abs.periode;
    }

    res.status(200).json({
      etaId,
      etablissement: eta ? eta.nom : null,
      periode: stats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DIRECTEUR: absences-aujourd-hui --------------------
export const getAbsencesAujourdhuiDirecteur = async (req, res) => {
  try {
    const { etaId } = req.user;
    const dateStr    = new Date().toISOString().split("T")[0];
    const startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
    const endOfDay   = new Date(`${dateStr}T23:59:59.999Z`);

    const absences = await AbsenceModel.find({
      etaId,
      dateAbsence: { $gte: startOfDay, $lte: endOfDay }
    });

    const eta = await EtaModel.findOne({ id: etaId });

    const absents = [];
    for (const abs of absences) {
      const ens = await EnseignModel.findOne({ ppr: abs.enseignantPpr });
      if (ens) {
        const hd = abs.heureDebut || (abs.quart === "soir" ? "15:00" : "09:00");
        absents.push({
          ppr: ens.ppr,
          nom: ens.nom,
          prenom: ens.prenom,
          sexe: ens.sexe,
          periode: abs.periode,
          heureDebut: hd,
          heureFin: computeHeureFin(hd, abs.periode)
        });
      }
    }

    res.status(200).json({
      date: dateStr,
      etablissement: eta ? eta.nom : null,
      total: absents.length,
      absents
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

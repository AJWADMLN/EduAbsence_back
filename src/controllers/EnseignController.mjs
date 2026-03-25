import { EnseignModel } from "../models/EnseignModel.mjs";
import { EtaModel } from "../models/EtaModel.mjs";
export const getEnseignants = async (req, res) => {
  try {
    const enseignants = await EnseignModel.find()
    res.status(200).json(enseignants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEnseignantById = async (req, res) => {
  try {
    const {params:{ppr}}=req
    const pars=parseInt(ppr)
    const enseignant = await EnseignModel.findOne({ppr:pars})
    if (!enseignant) return res.status(404).json({ message: "Enseignant not found" });
    res.status(200).json(enseignant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createEnseignant = async (req, res) => {
  try {
    const { ppr, nom, prenom, email, etaId, sexe } = req.body;

    // نجيب المؤسسة المرتبطة بالـ etaId
    const etablissement = await EtaModel.findOne({ id: etaId });
    if (!etablissement) {
      return res.status(404).json({ message: "Etablissement not found" });
    }

    // ناخذ cycle من المؤسسة
    const cycle = etablissement.cycle;

    // إنشاء الأستاذ مع cycle ديال المؤسسة
    const enseignant = new EnseignModel({
      ppr,
      nom,
      prenom,
      email,
      etaId,
      sexe,
      cycle, // أوتوماتيكياً من المؤسسة
      totalHeureAbsences: 0
    });

    await enseignant.save();

    res.status(201).json(enseignant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateEnseignant = async (req, res) => {
  try {
    const {params:{ppr}}=req
    const pars=parseInt(ppr)
    const enseignant = await EnseignModel.findOneAndUpdate({ppr:pars}, req.body,{ new: true });
    if (!enseignant) return res.status(404).json({ message: "Enseignant not found" });
    res.status(200).json(enseignant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteEnseignant = async (req, res) => {
  try {
    const {params:{ppr}}=req
    const pars=parseInt(ppr)
    const enseignant = await EnseignModel.findOneAndDelete({ppr:pars});
    if (!enseignant) return res.status(404).json({ message: "Enseignant not found" });
    res.status(200).json({ message: "Enseignant deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getEnseignantsByEtablissement = async (req, res) => {
  try {
    const { etaId } = req.params;
    const enseignants = await EnseignModel.find({ etaId: Number(etaId) });

    if (enseignants.length === 0) {
      return res.status(404).json({ message: "No enseignants found for this etablissement" });
    }

    res.status(200).json(enseignants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DIRECTEUR: fiche enseignant --------------------
export const getEnseignantByPprDirecteur = async (req, res) => {
  try {
    const { etaId } = req.user;
    const ppr = parseInt(req.params.ppr);

    const enseignant = await EnseignModel.findOne({ ppr });
    if (!enseignant) return res.status(404).json({ message: "Enseignant not found" });

    if (enseignant.etaId !== etaId) {
      return res.status(403).json({ message: "Cet enseignant n'appartient pas à votre établissement" });
    }

    res.status(200).json(enseignant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


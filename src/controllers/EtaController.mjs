import { EnseignModel } from "../models/EnseignModel.mjs"
import {EtaModel} from "../models/EtaModel.mjs"
import dotenv from "dotenv"
dotenv.config()

export const getEtablissements = async (req, res) => {
  try {

    const etablissements = await EtaModel.find()

    res.status(200).json(etablissements)

  } catch (error) {

    res.status(500).json({ message: error.message })

  }
}



export const getEtablissementById = async (req, res) => {
  try {
    const {id}=req.params
    const etablissement = await EtaModel.findOne({id:parseInt(id)})

    if (!etablissement) {
      return res.status(404).json({ message: "Etablissement not found" })
    }

    res.status(200).json(etablissement)

  } catch (error) {

    res.status(500).json({ message: error.message })

  }
}



export const createEtablissement = async (req, res) => {
  try {
    let newId = req.body.id;
    if (!newId) {
      const highest = await EtaModel.findOne().sort("-id");
      newId = highest && highest.id ? highest.id + 1 : 1;
    }

    const etablissement = new EtaModel({ ...req.body, id: newId });
    await etablissement.save();

    res.status(201).json(etablissement);

  } catch (error) {

    res.status(500).json({ message: error.message })

  }
}



export const updateEtablissement = async (req, res) => {
  try {
    const {id}=req.params
    const pars=parseInt(id)
    const etablissement = await EtaModel.findOneAndUpdate(
      {id:pars},
      req.body,
      { new: true }
    )

    if (!etablissement) {
      return res.status(404).json({ message: "Etablissement not found" })
    }

    res.status(200).json(etablissement)

  } catch (error) {

    res.status(500).json({ message: error.message })

  }
}



export const deleteEtablissement = async (req, res) => {
  try {
    const {id}=req.params
    const pars=parseInt(id)
    const etablissement = await EtaModel.findOneAndDelete({id:pars})

    if (!etablissement) {
      return res.status(404).json({ message: "Etablissement not found" })
    }

    res.status(200).json({ message: "Etablissement deleted successfully" })

  } catch (error) {

    res.status(500).json({ message: error.message })

  }
}



export const getEtablissementWithEnseignants = async (req, res) => {
  try {
    const { etaId } = req.params;

    const etablissement = await EtaModel.findOne({ id: Number(etaId) });
    if (!etablissement) {
      return res.status(404).json({ message: "Etablissement not found" });
    }

    const enseignants = await EnseignModel.find({ etaId: Number(etaId) });

    res.status(200).json({
      etablissement,
      enseignants
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- DIRECTEUR: son propre établissement --------------------
export const getEtablissementDirecteur = async (req, res) => {
  try {
    const { etaId } = req.user;

    const etablissement = await EtaModel.findOne({ id: etaId });
    if (!etablissement) {
      return res.status(404).json({ message: "Etablissement not found" });
    }

    const enseignants = await EnseignModel.find({ etaId });

    const totalEnseignants = enseignants.length;
    const totalHeuresIrregs = enseignants.reduce(
      (sum, ens) => sum + (ens.totalHeureAbsences || 0),
      0
    );

    res.status(200).json({
      id: etablissement.id,
      nom: etablissement.nom,
      cycle: etablissement.cycle,
      adresse: etablissement.adresse,
      stats: { totalEnseignants, totalHeuresIrregs }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
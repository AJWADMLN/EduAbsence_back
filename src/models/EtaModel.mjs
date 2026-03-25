import mongoose from "mongoose";

const Etaschema=mongoose.Schema({
    id:{type:Number,required:true,unique:true},
    nom:{type:String,required:true,unique:true},
    cycle:{type:String,required:true,enum: ["Primaire", "Collège", "Lycée"]},
    adresse:{type:String,required:true}
})
export const EtaModel=mongoose.model("Eta",Etaschema)
const methodsService = require("../services/methodsService")

const getAllDrafts = async (req, res) =>{

    try{

        const radicados = await methodsService.getAllDrafts(req,res);
         res.status(200).json(radicados);
    }catch(err){
        res.status(500).json({ error: "Error al obtener los radicados" });

    }

};

const createRequestAdjustments = async (req,res)=>{
    try{
         const radicados = await methodsService.createRequestAdjustment(req,res);
         res.status(200).json(radicados);

    }catch(err){
         res.status(500).json({ error: "Error al obtener los radicados" });

    }

};

module.exports = {getAllDrafts, createRequestAdjustments}
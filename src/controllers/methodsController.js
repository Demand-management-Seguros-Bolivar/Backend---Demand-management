const methodsService = require("../services/methodsService")

const getAllDrafts = async (req, res) =>{

    try{

        await methodsService.getAllDrafts(req,res);
       
    }catch(err){
        res.status(500).json({ error: "Error al obtener los radicados" });

    }

};

const updateStatusDraftAcept = async (req,res) =>{
  try {
  
    
    await methodsService.updateStatusDraftAcept(req,res);
   
   
  } catch (error) {
    res.status(500).json({ error: "Error al obtener radicados del usuraio" });
  }
  ;
}

const createRequestAdjustments = async (req,res)=>{
    try{
         const radicados = await methodsService.createRequestAdjustment(req,res);
         

    }catch(err){
         res.status(500).json({ error: "Error al obtener los radicados" });

    }

};

module.exports = {getAllDrafts, createRequestAdjustments, updateStatusDraftAcept}
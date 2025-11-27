const vicepresidenteService = require("../services/vicepresidenteService.js")



const updateStatusDraftAcept = async (req,res) =>{
  try {
  
    
    await vicepresidenteService.updateStatusDraftAcept(req,res);
   
   
  } catch (error) {
    res.status(500).json({ error: "Error al obtener radicados del usuraio" });
  }
  ;
}

const createRequestAdjustments = async (req,res)=>{
    try{
         const radicados = await vicepresidenteService.createRequestAdjustment(req,res);
         

    }catch(err){
         res.status(500).json({ error: "Error al obtener los radicados" });

    }

};






module.exports = {createRequestAdjustments, updateStatusDraftAcept}
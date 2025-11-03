// src/controllers/poController.js
const poService = require('../services/poService');



const getRadicadosByUser = async (req, res) => {
  try {
  
    
    await poService.getRadicadosByUser(req,res);
    
   
  } catch (error) {
    res.status(500).json({ error: "Error al obtener radicados del usuraio" });
  }
};


const getAnswerIa = async (req, res) => {

  try{
    
    const answer_ia = await poService.getAnswerIa(req,res);
    

  }catch(error){
     res.status(500).json({ error: "Error al obtener radicados del usuraio" });
  }
  
};

const getRadicadoByIdAjustes = async (req, res) => {
  try {
  
    
    await poService.getRadicadoByIdAjustes(req,res);
    
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el radicado del usuario" });
  }
};

const getRadicadoByIdDetails = async (req, res) => {
  try {
  
    
    await poService.getRadicadoByIdDetails(req,res);
    
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el radicado del usuario" });
  }
};

async function createDraft(req, res) {
  try {
  
    await poService.createDraft(req,res);
   
  } catch (error) {

    res.status(500).json({ message: 'Error interno del servidor.', error: error.message });
  }
}

const UpdateRadicadoById= async (req, res) => {
  try {
    
    await poService.UpdateRadicadoById(req,res);
   
  } catch (error) {
    res.status(500).json({ error: "Error al actualizar un radicado" });
  }
};

module.exports = { getRadicadoByIdAjustes, getRadicadosByUser, UpdateRadicadoById,createDraft, getAnswerIa, getRadicadoByIdDetails };

// src/controllers/poController.js
const poService = require('../services/poService');

const getRadicadosByUser = async (req, res) => {
  try {
  
    
    const radicados = await poService.getRadicadosByUser(req,res);
    res.status(200).json(radicados);
   
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

const getRadicadoById = async (req, res) => {
  try {
  
    
    await poService.getRadicadoById(req,res);
    
  } catch (error) {
    res.status(500).json({ error: "Error al obtener el radicado del usuario" });
  }
};

async function createDraft(req, res) {
  try {
  

    await poService.createDraft(req,res);

   
  } catch (error) {
    console.error('Error en el controlador:', error);
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

module.exports = { getRadicadoById, getRadicadosByUser, UpdateRadicadoById,createDraft, getAnswerIa };

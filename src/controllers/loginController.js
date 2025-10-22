
// src/controllers/poController.js
const loginService = require('../services/loginService');

const verificateRol = async (req, res) =>{

  try{

    await loginService.verificateRol(req,res)

  }catch(err){

    res.status(500).json({ error: "Error al validar rol del usuario" });

  }

};


const validateLogin = async (req, res) => {

  try{

    const answer_ia = await loginService.validateLogin(req,res);

  }catch(error){
     res.status(500).json({ error: "Error al obtener radicados del usuraio" });
  }
  
};

const logout = async (req, res) => {

  try{

    const answer_ia = await loginService.logout(req,res);

  }catch(error){
     res.status(500).json({ error: "Error al obtener radicados del usuraio" });
  }
  
};

const checkSession = async (req, res) => {

  try{

    const answer_ia = await loginService.checkSession(req,res);

  }catch(error){
     res.status(500).json({ error: "Error al obtener radicados del usuraio" });
  }
  
};



module.exports = { validateLogin, checkSession, logout, verificateRol};

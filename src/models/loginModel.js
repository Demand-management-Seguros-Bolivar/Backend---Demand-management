// src/models/bookModel.js
const {db, bucket} = require('../firebase')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require("fs/promises");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const jwt = require("jsonwebtoken");

const {model, fileManager } = require('../ia_model')



const login = {

  async logout(req, res) {
    try {
    Object.keys(req.cookies).forEach(cookieName => {
      res.clearCookie(cookieName, {
          httpOnly: true,
          secure: false,
          sameSite: "lax",
          path: "/"
        });
      });


      
    return res.redirect("https://accounts.google.com/logout");
    } catch(err) {
      console.error('Error cerrando sesión:', err);
      return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
    }
  },

  async checkSession(req, res) {
    
    const token = req.cookies.session; // toma la cookie
     
   
    if (!token) return res.status(401).json({ authenticated: false });
    
    try {
      const payload = jwt.verify(token, process.env.SECRET_KEY);
      
      res.json({ authenticated: true, user: { email: payload.email, name: payload.name } });
    } catch(err) {
      res.status(401).json({ authenticated: false });
    }
  },


  async validateLogin(req, res) {
  try {
    const { credential } = req.body; // token de Google
    if (!credential) {
      return res.status(400).json({ success: false, message: "Token no proporcionado" });
    }

    //Verificar token con Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    // 2Validar correo
    if (!payload?.email_verified) {
      return res.status(401).json({ success: false, message: "Correo no verificado" });
    }

    if (!payload.email.endsWith("@segurosbolivar.com")) {
      return res.status(403).json({ success: false, message: "Acceso restringido al dominio corporativo" });
    }

    const email = payload.email;
    
  
    // Looking for the drafts that have the id_user
    const snapshot = await db.collection("users").where("correo", "==", email).get();
    const user = snapshot.docs;

    // 3Generar JWT interno
    const sessionToken = jwt.sign(
      { email: payload.email, name: payload.name, role: user.role },
      process.env.SECRET_KEY,
      { expiresIn: "24h" }
    );



    // 4Guardar cookie de sesión
    res.cookie("session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 86400000, // 24h
    });

  
    return res.json({
      success: true,
      message: "Login exitoso",
      user: { name: payload.name, email: payload.email },
    });

  } catch (err) {
    console.error("Error validando token de Google:", err.message);
    return res.status(401).json({ success: false, message: "Token inválido o expirado" });
  }
}

};

module.exports = login;

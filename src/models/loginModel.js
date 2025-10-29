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

  async verificateRol(req, res) {
     console.log(req)
    const token = req.cookies.session;
    console.log(token)

    // 1. Check for token presence
    if (!token) {
      // 401: Unauthorized - no session token provided
      return res.status(401).json({
        authenticated: false,
        message: "No session token provided."
      });
    }

    let decoded; // Declare outside the try block so it's accessible later

    try {
      // 2. Token verification and decoding
      // Correct method is likely 'verify' in most JWT libraries (e.g., jsonwebtoken)
      // Also, fix the typo: 'PROCCESS' should be 'process'
      decoded = jwt.verify(token, process.env.SECRET_KEY);

    } catch (error) {
      // 3. Handle invalid or expired token
      // 401: Unauthorized - token failed verification
      return res.status(401).json({
        success: false,
        message: "Invalid or expired token."
      });
    }

    // 4. Role Authorization Check
    // The logic should be to return 'rol: true' ONLY if the role matches, 
    // and 'rol: false' (or a 403 Forbidden) if it does not.
    console.log(decoded.rol)
    console.log(decoded.rol)
    if (decoded.role === 'PO') {
      // Success: Role matches 'PO'
      return res.json({
        rol: true
      });
    } else {
      // Failure: Role does NOT match 'PO'
      // A 403 Forbidden status is generally more appropriate for authorization failures
      return res.status(403).json({ // Changed status to 403
        rol: false,
        message: `Access denied. Required a specific role , but  no found .`
      });
    }
  },

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
      console.log("here 1")
      console.log(payload.role)
      console.log("here 2")
      
      res.json({ authenticated: true, user: { email: payload.email, name: payload.name, role: payload.role } });
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

    //if (!payload.email.endsWith("@segurosbolivar.com")) {
    //  return res.status(403).json({ success: false, message: "Acceso restringido al dominio corporativo" });
   // }

    const email = payload.email;
    
  
    // Looking for the drafts that have the id_user
    const snapshot = await db.collection("users").where("correo", "==", email).get();
    const user = snapshot.docs;
    console.log(user)

    // 3Generar JWT interno
    const sessionToken = jwt.sign(
      { email: payload.email, name: payload.name, role: user[0].data().role},
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

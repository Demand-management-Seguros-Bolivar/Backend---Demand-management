// src/routes/poRoutes.js
const express = require("express");
const { validateLogin, checkSession, logout } = require('../controllers/loginController');

const router = express.Router();

const multer = require('multer'); // 1. Importa Multer


// 2. Define la configuración de Multer
const upload = multer({ dest: 'uploads/' });

router.post("/validateLogin", validateLogin);
router.get("/checkSession", checkSession);
router.post("/logout", logout);


module.exports = router;


// src/routes/poRoutes.js
const express = require("express");
const { getAnswerIa, getRadicadosByUser , getRadicadoById, createDraft, UpdateRadicadoById } = require('../controllers/pocontroller');

const router = express.Router();

const multer = require('multer'); // 1. Importa Multer


// 2. Define la configuración de Multer
const upload = multer({ dest: 'uploads/' });

router.post("/analyzeIa",upload.single('data'), getAnswerIa );
router.get("/getDrafts",getRadicadosByUser );

router.post("/getDraft",getRadicadoById );

router.post("/radicados", upload.fields([
    { name: 'step2[cumplimiento_normativo]' },
    { name: 'step2[finops]' },
    { name: 'step2[juridica]' },
    { name: 'step2[seguridad_informacion]' },
    { name: 'step2[riesgo]' },
    { name: 'step2[estimacion_detalle]' },
    { name: 'step2[caso_negocio]' },
    
  ]), createDraft);


router.put("/radicadoUpdate/:id_radicado", upload.fields([
    { name: 'step2[cumplimiento_normativo]' },
    { name: 'step2[finops]' },
    { name: 'step2[juridica]' },
    { name: 'step2[seguridad_informacion]' },
    { name: 'step2[riesgo]' },
    { name: 'step2[estimacion_detalle]' },
    { name: 'step2[caso_negocio]' },
    
  ]),UpdateRadicadoById);

module.exports = router;


// src/models/bookModel.js
const {db, bucket} = require('../firebase')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require("fs/promises");
const jwt = require("jsonwebtoken");

const {model, fileManager } = require('../ia_model')


const Book = {
  async getRadicadosByUser(req) {

    const token = req.cookies.session;
      if (!token) {
        return res.status(401).json({ success: false, message: "No hay token de sesión" });
      }

    
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.SECRET_KEY);
      } catch (err) {
        return res.status(401).json({ success: false, message: "Token inválido o expirado" });
      }

    
      const email = decoded.email;
    
  
    

    // Looking for the drafts that have the id_user
    const snapshot = await db.collection("draft").where("correo", "==", email).get();
    console.log(snapshot.docs)
    return snapshot.docs;
  },

  async getAnswerIa(req) {

    const fileData = req.file;
    console.log(req)
    console.log(fileData)

    const uploadResult = await fileManager.uploadFile(fileData.path, {
        mimeType: fileData.mimetype,
        displayName: fileData.originalname,
      });

    
    const prompt = `Quiero que actúes como analista de solicitudes de demanda.
                    Tu tarea será analizar un documento que contiene la información de una solicitud de proyecto y extraer la información de manera estructurada en el formato JSON que indico.

                    📥 ENTRADA DEL ARCHIVO
                    El archivo siempre tendrá esta estructura en su contenido (el texto puede variar, pero los títulos se mantienen):
                    - Tabla de contenido
                    - 2 Información de Entrada parte 1
                      - 2.1 Descripción situación a resolver
                      - 2.2 Foco estratégico
                      - 2.3 Procesos misionales, estratégicos y/o de apoyo impactados
                      - 2.4 Diagrama de flujo del proceso actual
                      - 2.5 Beneficios / ingresos / métricas (KPIs)
                      - 2.6 Alcance esperado y prioridad
                      - 2.7 Proyección de cantidad y/o crecimiento de usuarios
                      - 2.8 Cantidad de transacciones esperadas
                      - 2.9 Riesgo de negocio
                      - 2.10 VoBo vicepresidente Sponsor

                    📤 FORMATO DE SALIDA
                    La salida debe ser exclusivamente un JSON con esta estructura exacta:

                    [{
                      "description_situation": "",
                      "strategic_focus": "",
                      "missional_process": "",
                      "current_flow_diagram": "",
                      "benefit_income": "",
                      "expected_scope": "",
                      "number_user_increase": "",
                      "number_transaction": "",
                      "business_risk": "",
                      "vobo_sponsor": ""
                    }]

                    🔑 REGLAS IMPORTANTES
                    1. Para cada campo, extrae únicamente el texto tal como aparece en el documento (no resumas, no interpretes).
                    2. Si el documento incluye imágenes, tablas o diagramas, ignora su contenido y no lo extraigas.
                    3. El JSON debe estar completo, aunque algún campo no tenga información (en ese caso, deja la cadena vacía "").
                    4. Devuélveme únicamente el JSON válido, sin explicaciones adicionales, sin formato de código ni texto fuera de él.
                    `;

    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      { text: prompt },
    ]);

    console.log(result.response.text());
    return result.response.text();
    
  },


  async getRadicadoById(id_radicado) {

    //Looking for the draft with a specific id
    console.log(id_radicado)
    const snapshot = await db.collection('draft').doc(id_radicado).get();
    return snapshot;
  },

  async createDraft(req) {
    try {
    
      const token = req.cookies.session;
      if (!token) {
        return res.status(401).json({ success: false, message: "No hay token de sesión" });
      }

    
      let decoded;
      try {
        decoded = jwt.verify(token, process.env.SECRET_KEY);
      } catch (err) {
        return res.status(401).json({ success: false, message: "Token inválido o expirado" });
      }

    
      const email = decoded.email;
      const name = decoded.name;
    
      const draftRef = db.collection("draft");
      const formData = req.body;

      const newDoc = await draftRef.add({
        correo:email,
        po: formData.step1.po,
        pot: formData.step1.pot,
        vp_sponsor: formData.step1.vp_sponsor,
        lider_negocio: formData.step1.lider_negocio,
        tribu: formData.step1.tribu,
        squad: formData.step1.squad,
        aliados_q1: formData.step2.aliados_q1,
        aliados_q2: formData.step2.aliados_q2,
        aliados_q3: formData.step2.aliados_q3,
        actividades_q1: formData.step2.actividades_q1,
        actividades_q2: formData.step2.actividades_q2,
        propuesta_q1: formData.step2.propuesta_q1,
        propuesta_q2: formData.step2.propuesta_q2,
        propuesta_q3: formData.step2.propuesta_q3,
        relacion_q1: formData.step2.relacion_q1,
        relacion_q2: formData.step2.relacion_q2,
        recursos_q1: formData.step2.recursos_q1,
        canales_q1: formData.step2.canales_q1,
        canales_q2: formData.step2.canales_q2,
        segmentos_q1: formData.step2.segmentos_q1,
        segmentos_q2: formData.step2.segmentos_q2,
        segmentos_q3: formData.step2.segmentos_q3,
        gastos_q1: formData.step2.gastos_q1,
        gastos_q2: formData.step2.gastos_q2,
        gastos_q3: formData.step2.gastos_q3,
        ingreso_q1: formData.step2.ingreso_q1,
        ingreso_q2: formData.step2.gastos_q2,
        ingreso_q3: formData.step2.gastos_q3,
        createdAt: new Date(),
      });



      const filesData = req.files;

      // Si no hay archivos adjuntos, lanzamos un error.
      if (!filesData || Object.keys(filesData).length === 0) {
        throw new Error("No se ha adjuntado ningún archivo.");
      }
      
      const keys = Object.keys(filesData);


      // Usamos 'map' para crear un array de promesas. Cada promesa representa la carga de un archivo.
      const uploadPromises = keys.map(async (key) => {
      const fileInfo = filesData[key][0];
      const destinationPath = `${newDoc.id}'/${fileInfo.originalname}`;

      // Subimos el archivo a Firebase Storage.
      const [file] = await bucket.upload(fileInfo.path, {
        destination: destinationPath,
        metadata: {
          contentType: fileInfo.mimetype,
        },
      });


      // Obtenemos la URL de descarga del archivo.
      const fileUrl = await file.getSignedUrl({
        action: 'read',
        expires: '03-09-2491',
      });

      // Devolvemos un objeto con la información del archivo para que 'Promise.all' lo recoja.
      return {
        nombreOriginal: fileInfo.originalname,
        nombreCampo: fileInfo.fieldname,
        rutaBucket: file.name,
        urlDescarga: fileUrl[0]
      };
    });

    // 'Promise.all' espera a que todas las promesas de carga se resuelvan.
    const uploadedFiles = await Promise.all(uploadPromises);



    await Promise.all(
    keys.map(async (key) => {
        const fileInfo = filesData[key][0];
        try {
          await fs.unlink(fileInfo.path); // borra cada archivo temporal
        } catch (err) {
          console.error("Error borrando archivo:", fileInfo.path, err);
        }
      })
    );
    const id_radicado = newDoc.id;

    const docRef = db.collection('draft').doc(id_radicado);

      const dataToUpdate = {
        archivosAdjuntos: uploadedFiles
      };

      docRef.update(dataToUpdate);

    

    const docSnapshot = await newDoc.get();
    return docSnapshot;

  } catch (error) {
    console.error("Error en createDraft:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
},

  async UpdateRadicadoById(id_radicado) {
    const docRef = db.collection('draft').doc(id_radicado);

    const dataToUpdate = {
      architecture_containers: 'jejejejejejeje',
      risk:"metoooi"
    };

    docRef.update(dataToUpdate);
  }
};

module.exports = Book;

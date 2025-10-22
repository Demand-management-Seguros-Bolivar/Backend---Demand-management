// src/models/bookModel.js
const {db, bucket} = require('../firebase')
const multer = require('multer');
const upload = multer({ dest: 'uploads/' });
const fs = require("fs");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const FormData = require("form-data");

const {model, fileManager } = require('../ia_model')


const Book = {
  async getRadicadosByUser(req,res) {

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

  async getAnswerIa(req,res) {

    const token = req.cookies.session;

    
    if(!token){
      return status(401).json({ success: false, message: "No hay token de sesión" });
    }

    let decoded;
    

    try{
      decoded =jwt.verify(token, process.env.SECRET_KEY);

    }catch(err){
      return res.status(401).json({succes:false, message:"Token invalido o expirado"});
    };

    //N8N CALL
    try{

      const n8nWebhookUrl = 'https://segurobolivar-trial.app.n8n.cloud/webhook/b05b4186-4f64-41c1-9c57-47177b51a97f';
      const filePath = req.file.path;
      const fileName = req.file.originalname;

      // Crea el formulario para enviar el archivo
      const form = new FormData();
      console.log(typeof req.file)
      console.log(req.file)
      form.append('file', fs.createReadStream(filePath), { filename: fileName });
      form.append("name",fileName);
      
      // Aquí puedes añadir otros datos si lo necesitas

      // Envía la solicitud a n8n
      const response = await axios.post(n8nWebhookUrl, form, {
        headers: {
          ...form.getHeaders(),
          // Incluye tu clave de autenticación si la configuraste
          'API_KEY_N8N': process.env.SECRET_KEY_N8N 
        }
      });
      console.log(response.data);
      // Limpia el archivo temporal
      fs.unlinkSync(filePath);

      res.status(200).json({ 
        message: 'Archivo enviado a n8n para procesamiento.', 
        n8nResponse: response.data 
      });
    
    /*
    const fileData = req.file;
 
     console.log(fileData);
    const uploadResult = await fileManager.uploadFile(fileData.path, {
        mimeType: fileData.mimetype,
        displayName: fileData.originalname,
      });

     console.log("jijiji");
    const prompt = `Quiero que actúes como analista de solicitudes de demanda.
                    Tu tarea será analizar un documento que contiene la información de una solicitud de proyecto y extraer la información de manera estructurada
                    `;
  

     try {
    const result = await model.generateContent([
      {
        fileData: {
          mimeType: uploadResult.file.mimeType,
          fileUri: uploadResult.file.uri,
        },
      },
      { text: prompt },
    ]);
    console.log("jijijigggg");

    console.log(result.response.text());*/

  } catch (error) {
    console.error("Error al generar contenido con Gemini:", error);
    res.status(500).json({ success: false, message: "Error al procesar la solicitud con la IA.", details: error.message });
  }
 
    
  },


  async getRadicadoById(id_radicado) {

    //Looking for the draft with a specific id
    console.log(id_radicado)
    const snapshot = await db.collection('draft').doc(id_radicado).get();
    return snapshot;
  },

  async createDraft(req,res) {
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
   
    
      const draftRef = db.collection("draft");
      const formData = req.body;

      const newDoc = await draftRef.add({
        nombre_proyecto: formData.step1.name_project,
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
        ingreso_q2: formData.step2.ingreso_q2,
        ingreso_q3: formData.step2.ingreso_q3,
        estado: "En proceso",
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
          await fs.promises.unlink(fileInfo.path); // borra cada archivo temporal
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
    const data = docSnapshot.data();

    const dataToSend = {
      id_radicado: newDoc.id,
      ...data,
      createdAt: data.createdAt.toDate ? data.createdAt.toDate().toISOString() : data.createdAt
    };

    const n8nWebhookUrl = 'https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0';

    const response = await axios.post(
      n8nWebhookUrl,
      dataToSend,
      {
        headers: {
          'Content-Type': 'application/json',
          'API_KEY_N8N': process.env.SECRET_KEY_N8N
        }
      }
    );

     res.status(200).json({ message: 'Draft creado con éxito.', docId: docSnapshot.id });

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

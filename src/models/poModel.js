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

  async getRadicadosByUser(req, res) {

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
    
    const snapshot = await db.collection("draft").where("correo", "==", email).get();

    const drafts = snapshot.docs.map(doc => ({
        id: doc.id, 
        ...doc.data()
    }));

    return res.status(200).json({
        success: true,
        data: drafts 
    });
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


  async getRadicadoByIdAjustes(req,res) {

    
    const { id_draft} = req.body;
    
    const snapshot = await db.collection('draft').doc(id_draft ).get();
    

    if((snapshot.data().estadoAjustesPendientes === "Gerentes"  || snapshot.data().estadoAjustesPendientes === "Vicepresidentes") && snapshot.data().estado === "Pendiente de ajustes"){

      return res.json(snapshot);

    }else{

      return res.status(401).json({ success: false, message: "No se tiene permido para edicion de este radicado" });

    }
    
  },


  async getRadicadoByIdDetails(req, res) {
    
    const  data  = req.body; 

    
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
    
    try {
        
        const snapshot = await db.collection('draft').doc(data.id_draft).get();
        const snapshot2 = await db.collection('history').where("id","==",data.id_draft).get();
        
        
        if (!snapshot.exists) {
            return res.status(404).json({ success: false, message: "Borrador no encontrado" });
        }
        
        
        const draftData = snapshot.data();
        const historyChangesData = snapshot2.docs.map(doc => doc.data());

        //if (decoded.role !== "METHODS" || decoded.role !== "PO") {
            // Documento existe, pero no pertenece a este usuario
         //   return res.status(403).json({ success: false, message: "Acceso denegado. No tienes permisos para ver este borrador." });
        //}

        if(decoded.role === "PO"){

          if(draftData.correo !== decoded.email){

             return res.status(403).json({ success: false, message: "Acceso denegado. No tienes permisos para ver este borrador." });
          
          }else{

             draftData["id"] = snapshot.id;
             
              return res.status(200).json({
                  success: true,
                  id: snapshot.id,
                  data: draftData,
                  history: historyChangesData
              });
          }

        }else{

          draftData["id"] = snapshot.id;
        
          return res.status(200).json({
                  success: true,
                  id: snapshot.id,
                  data: draftData,
                  history: historyChangesData
           });

        }
        
        

    } catch (dbErr) {
        console.error("Error al buscar borrador:", dbErr);
        return res.status(500).json({ success: false, message: "Error interno del servidor al buscar el borrador." });
    }
  },


  async createDraft(req, res) {
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
        
        const formData = req.body;
        const filesData = req.files;
        let uploadedFiles = [];
        
        const draftRef = db.collection("draft");

        const initialDraftData = {
            nombre_proyecto: formData.step1.name_project,
            correo: email,
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
            estado: "Radicado",
            estadoAjustesPendientes: "Desactivado",
            archivosAdjuntos: [],
            aprobacionGD: [],
            aprobacionGerentes: [],
            aprobacionVices: [],
            comentarios: [],
            createdAt: new Date()
        };

        const newDocRef = await draftRef.add(initialDraftData);

        const id_radicado = newDocRef.id;
        const keys = filesData ? Object.keys(filesData) : [];

        if (keys.length > 0) {
           
            let uploadPromises = keys.map(async (key) => {
               
                const fileInfo = filesData[key][0]; 
                const destinationPath = `${id_radicado}/${fileInfo.fieldname}/${fileInfo.originalname}`;

                const [file] = await bucket.upload(fileInfo.path, {
                    destination: destinationPath,
                    metadata: {
                        contentType: fileInfo.mimetype,
                    },
                });

                
                const [fileUrl] = await file.getSignedUrl({ 
                    action: 'read',
                    expires: '03-09-2491', 
                });

          
                return {
                    nombreOriginal: fileInfo.originalname,
                    nombreCampo: fileInfo.fieldname,
                    rutaBucket: file.name,
                    urlDescarga: fileUrl
                };
            });

            
            uploadedFiles = await Promise.all(uploadPromises);

           
            await newDocRef.update({
                archivosAdjuntos: uploadedFiles
            });

        } else if (filesData && Object.keys(filesData).length === 0) {
            console.log("No se adjuntaron archivos para este borrador.");
        }
        
       
        await Promise.all(
            keys.map(async (key) => {
                const fileInfo = filesData[key][0];
                try {
                    await fs.promises.unlink(fileInfo.path); 
                } catch (err) {
                    console.error("Error borrando archivo temporal:", fileInfo.path, err.message);
                    
                }
            })
        );
        
       
        const docSnapshot = await newDocRef.get();
        const dataDraft = docSnapshot.data();
        
        const usersRef = await db.collection("users").where("role", "==", "METHODS").get();


        const listUsers = usersRef.docs.map(doc => doc.data());


        const whoSend = listUsers.map(user => ({
          correo: user.correo
        }));

        whoSend.push({correo:email})
        
      
        const dataToSend = {
            id_radicado: docSnapshot.id,
            whosend: whoSend,
            ...dataDraft,
            createdAt: dataDraft.createdAt.toDate ? dataDraft.createdAt.toDate().toISOString() : dataDraft.createdAt
        };

        const n8nWebhookUrl = 'https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0';

        
        console.log(whoSend)
      
        const response = await axios.post(
            n8nWebhookUrl,
            dataToSend,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'API_KEY_N8N': process.env.SECRET_KEY_N8N,
                    'motivo': 'Creacion'
                }
            }
        );

  
        res.status(200).json({ message: 'Draft creado con éxito.', docId: docSnapshot.id, webhookStatus: response.status });

    } catch (error) {
      
        console.error("Error en createDraft:", error);
        // Si el error es de la subida, es mejor un 500
        return res.status(500).json({ success: false, message: `Error al crear el Draft: ${error.message}` });
    }
  },


  async UpdateRadicadoById(req, res) {

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

      const { id_radicado } = req.params;

      const formData = req.body;
      const filesData = req.files;

      const docRef = db.collection("draft").doc(id_radicado);
      const docSnap = await docRef.get();
      const infoDataCurrently = docSnap.data();

      const email = decoded.email;

      if (infoDataCurrently.correo !== email) {
        return res.status(401).json({ success: false, message: "No propietario del radicado" });
      }

      
      let cambios = [];
      const time = new Date();
      let updates = {};

      Object.keys(formData).forEach(key => {
        Object.keys(formData[key]).forEach( keySec => {
          if (infoDataCurrently.hasOwnProperty(keySec)) {
            if (infoDataCurrently[keySec] != formData[key][keySec]) {
              let paso = key === "step1" ? "Informacion general" : "Business Model Canvas";

              cambios.push({
                id: id_radicado,
                time,
                cambio: formData[key][keySec],
                antiguo: infoDataCurrently[keySec],
                paso
              });

              updates[keySec] = formData[key][keySec];
              
            }
          }
        });
      });

      updates.estadoAjustesPendientes = "Desactivado";
      

      if(Object.keys(updates).length > 0){

        if(infoDataCurrently.estadoAjustesPendientes == "Gerentes"){
          updates.estado = "En revision";

          const gerentes = Array.isArray(infoDataCurrently.aprobacionGerentes)
          ? [... infoDataCurrently.aprobacionGerentes]
          : [];

          gerentes.forEach( gerente =>{
              
            if(gerente.estado === "Pendiente de ajustes")
              gerente.estado = "En revision"
          });

          updates.aprobacionGerentes = gerentes;

        }else if ((infoDataCurrently.estadoAjustesPendientes == "Vicepresidentes")){
         
          updates.estado = "En revision";

          const vicepresidentes = Array.isArray(infoDataCurrently.aprobacionVices)
          ? [... infoDataCurrently.aprobacionVices]
          : [];

          vicepresidentes.forEach( vicepresidente =>{
              
            if(vicepresidente.estado === "Pendiente de ajustes")
              vicepresidente.estado = "En revision"
          });

          updates.aprobacionVices = vicepresidentes;

        }else{
          updates.estado = "Radicado";
        }
      
        await docRef.update(updates)
      }
      

      
      const keys = Object.keys(filesData);
      const uploadPromises = keys.map(async (key) => {
        const fileInfo = filesData[key][0];
        const destinationPath = `${id_radicado}/${fileInfo.fieldname}/${fileInfo.originalname}`;

        const [file] = await bucket.upload(fileInfo.path, {
          destination: destinationPath,
          metadata: { contentType: fileInfo.mimetype },
        });

        const fileUrl = await file.getSignedUrl({
          action: 'read',
          expires: '03-09-2491',
        });

        return {
          nombreOriginal: fileInfo.originalname,
          nombreCampo: fileInfo.fieldname,
          rutaBucket: file.name,
          urlDescarga: fileUrl[0]
        };
      });

      const uploadedFiles = await Promise.all(uploadPromises);

      
      await Promise.all(
        keys.map(async (key) => {
          const fileInfo = filesData[key][0];
          try {
            await fs.promises.unlink(fileInfo.path);
          } catch (err) {
            console.error("Error borrando archivo:", fileInfo.path, err);
          }
        })
      );

      
      let archivosActuales = infoDataCurrently.archivosAdjuntos || [];

      uploadedFiles.forEach(nuevo => {
        const index = archivosActuales.findIndex(a => a.nombreCampo === nuevo.nombreCampo);
        if (index !== -1) {
          cambios.push({
                      id: id_radicado,
                      time,
                      cambio: nuevo.nombreOriginal,
                      antiguo: archivosActuales[index].nombreOriginal,
                      paso: valorPasoDocumentos(nuevo.nombreCampo)
                    });

          archivosActuales[index] = nuevo;
        

        } else {
          archivosActuales.push(nuevo);
          cambios.push({
                id: id_radicado,
                time,
                cambio: nuevo.nombreOriginal,
                antiguo: "-",
                paso: valorPasoDocumentos(nuevo.nombreCampo)
              });
        }
      });



    
      await docRef.update({
        archivosAdjuntos: archivosActuales,
      
      });

      const historyRef = db.collection("history");

      

      cambios.forEach(async cambio =>{
        await historyRef.add(cambio)
      });

      const n8nWebhookUrl = 'https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0';
      
      let whoSend = []

       if(infoDataCurrently.estadoAjustesPendientes == "Gerentes"){
         whoSend = [{correo:decoded.email},{correo:infoDataCurrently.aprobacionGD[0].email},...infoDataCurrently.aprobacionGerentes]

       }else if (infoDataCurrently.estadoAjustesPendientes == "vicepresidentes"){
        whoSend = [{correo:decoded.email},{correo:infoDataCurrently.aprobacionGD[0].email},...infoDataCurrently.aprobacionVices]

       }else{
         whoSend = [{correo:decoded.email},{correo:infoDataCurrently.aprobacionGD[0].email}]

       }

      const whoSendHeader = JSON.stringify(whoSend); 
    
      await axios.post(
        n8nWebhookUrl,
        cambios,
        {
          headers: {
            'Content-Type': 'application/json',
            'API_KEY_N8N': process.env.SECRET_KEY_N8N,
            'motivo':'Ajustes Completados',
            'whoSend':whoSendHeader,
            'id_radicado':id_radicado
          }
        }
      );
    

      res.status(201).json({
        success: true,
        message: "Radicado actualizado correctamente",
        archivosActuales,
        cambios
      });

    } catch (err) {
      console.error("ERROR EN UpdateRadicadoById:", err);
      res.status(500).json({ success: false, message: "Error interno", error: err.message });
    }
  }

};


function valorPasoDocumentos(nombreCampo) {
  return pasoDocumentos[nombreCampo] || "Documento";
}

const pasoDocumentos = {
  "step2[cumplimiento_normativo]": "Cumplimiento Normativo",
  "step2[finops]": "FinOps",
  "step2[juridica]": "Jurídica",
  "step2[seguridad_informacion]": "Seguridad información",
  "step2[riesgo]": "Riesgo",
  "step2[estimacion_detalle]": "Estimacion detalle",
  "step2[caso_negocio]": "Caso de negocio"
};



module.exports = Book;

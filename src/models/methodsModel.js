const jwt = require("jsonwebtoken");
const axios = require("axios")
const {db, bucket} = require('../firebase')
const admin = require('firebase-admin');
const FieldValue = admin.firestore.FieldValue;

const methodsModel = {
    
    
    async updateStatusDraftAcept(req, res) {

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

      const { id_draft } = req.body;

      if (!id_draft) {
          return res.status(400).json({ success: false, message: "Falta el ID del borrador" });
      }

      try {
          
          const draftRef = db.collection("draft").doc(id_draft);
          
          
          const draftSnapshot = await draftRef.get(); 

          


          
          if (!draftSnapshot.exists) {
            return res.status(404).json({ success: false, message: "Borrador no encontrado" });
          }

          const dataDraft = await draftSnapshot.data();

          if(decoded.role == "Gerente"){



                let allGerentesAcept = "Aceptado por todos";

                const gerentes = Array.isArray(dataDraft.aprobacionGerentes)
                ? [...dataDraft.aprobacionGerentes]
                : [];

            

                const indexGerente = gerentes.findIndex(g => g.correo === decoded.email);
                
                gerentes[indexGerente].estado = "Aceptado"

                if (gerentes.some((g) => g.estado === "En revision")) {
                  allGerentesAcept = "Not Send messages";
                }else if ( gerentes.some((g)=>g.estado === "Pendiente de ajustes")){
                  allGerentesAcept = "Pendiente de ajustes";
                }

                const updateData = {
                  aprobacionGerentes: gerentes
                };

                await draftRef.update({
                  aprobacionGerentes:gerentes,
                });



                if (allGerentesAcept === "Aceptado por todos"){
                  
                  updateData.estado = "Aprobacion preliminar";
                  const draft = await draftRef.update(updateData);

                  const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";
                  
                  const userMethodsRef = await db.collection('users').where("role","==","METHODS").get();

                  const userMethods = userMethodsRef.docs.map(doc => doc.data());

                  const gmailRecipient =[...gerentes,{correo: dataDraft.correo},...userMethods]
                  await axios.post(
                  n8nWebhookUrl,
                  {recipients:gmailRecipient,
                    info: dataDraft
                  }
                  ,
                  {
                      headers: {
                      "Content-Type": "application/json",
                      "API_KEY_N8N": process.env.SECRET_KEY_N8N,
                      "motivo": "Aceptacion gerentes",
                      "id_radicado":id_draft
                      },
                  }
                  );

                }else if( allGerentesAcept === "Pendiente de ajustes"){


                  updateData.estado = "Pendiente de ajustes";
                  updateData.estadoAjustesPendientes = "Gerentes";

                  const draft =await draftRef.update(updateData);

                  const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";

 
                  const userMethodsRef = await db.collection("users").where("role", "==", "METHODS").get();
                  const userMethods = userMethodsRef.docs.map(doc => doc.data());

                  const gmailRecipient =[...gerentes,{correo: dataDraft.correo},...userMethods]
                  
                  await axios.post(
                  n8nWebhookUrl,
                  {recipients:gmailRecipient,
                   info: dataDraft
                  }
                  ,
                  {
                      headers: {
                      "Content-Type": "application/json",
                      "API_KEY_N8N": process.env.SECRET_KEY_N8N,
                      "motivo": "Ajustes Gerentes",
                      "id_radicado": id_draft
                      },
                  }
                  );
                }
           




          
          }else if(decoded.role == "METHODS"){

            const gerentesSnapshot = await db.collection("users").where("role", "==", "Gerente").get();
            const gerentesData = gerentesSnapshot.docs.map(doc => ({...doc.data(),"estado":"En revision"}));
          
            console.log("Manager Data:", gerentesData);
            const gerentesyMethodsSnapshot = await db.collection("users").where("role", "in", ["Gerente", "METHODS"]).get();
            const correoSnapshot = await db.collection("users").where("correo", "==", dataDraft.correo).get();
            const infoGmailMessages = [...gerentesyMethodsSnapshot.docs.map(doc => doc.data()),
                                       ...correoSnapshot.docs.map(doc => doc.data())
            ]

            await draftRef.update({
                estado: "En revision", 
                aprobacionGD:[{name:decoded.name, email: decoded.email, estado:"Aprobado"}],
                aprobacionGerentes:gerentesData,


                
            });

            const n8nWebhookUrl = 'https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0';

            const response = await axios.post(
                n8nWebhookUrl,
                {'recipients':infoGmailMessages,
                'infoDraft': dataDraft
                },
                {
                headers: {
                    'Content-Type': 'application/json',
                    'API_KEY_N8N': process.env.SECRET_KEY_N8N,
                    'motivo':'aprobacionGD',
                    'id_draft':id_draft
                }
                }
            );


          };
        
          
          return res.status(200).json({ 
              success: true, 
              message: `Borrador aceptado y estado actualizado.`,
              data: draftSnapshot.data() 
          });

      } catch (error) {
          console.error("Error al procesar la aceptación del borrador:", error);
          return res.status(500).json({ success: false, message: "Error interno del servidor al actualizar el borrador" });
      }
    },

    async getAllDrafts(req, res) {
   
      try {

          const token = req.cookies.session;

        
          if (!token) {
            
              return res.status(401).json({ success: false, message: "No hay token de sesión" });
          }

        
          const decoded = jwt.verify(token, process.env.SECRET_KEY);

          let snapshot;

          
          

          snapshot = await db.collection("draft").get()
          
          
          const drafts = snapshot.docs.map(doc => ({ 
              id: doc.id,
              ...doc.data() 
          }));

          
          return res.status(200).json({ 
              success: true,
              data: drafts 
          });

      } catch (err) {
        
          if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
              return res.status(401).json({ success: false, message: "Token inválido o expirado" });
          }
          
          // Para cualquier otro error (ej: Base de Datos)
          return res.status(500).json({ success: false, message: "Error interno del servidor", error: err.message });
      }
    },

    async createRequestAdjustment(req, res) {

      try {
        
        const token = req.cookies.session;

        if (!token) {
          return res.status(401).json({ success: false, message: "No hay token de sesión." });
        }

        const decoded = jwt.verify(token, process.env.SECRET_KEY);

        
        const { documentId, inf } = req.body;
        if (!documentId || !inf) {
          return res.status(400).json({ success: false, message: "Faltan documentId o inf." });
        }

        
        const docRef = db.collection("draft").doc(documentId);
        const docSnap = await docRef.get();

        if (!docSnap.exists) {
          throw new Error("El documento no existe en la colección 'draft'.");
        }

        const infoDraft = docSnap.data();

        
        const newComment = {
          userId: decoded.name,
          gmailSender: decoded.email,
          gmailRecipient: infoDraft.correo,
          tipoSolicitud: inf.tipoSolicitud,
          comentarioAjuste: inf.comentariosAjuste,
          fecha: new Date(),
        };

        
        if (decoded.role === "Gerente") {



              let allGerentesAcept = "Ajustes pendientes";

              const gerentes = Array.isArray(infoDraft.aprobacionGerentes)
                ? [...infoDraft.aprobacionGerentes]
                : [];
    
              const gerenteIndex = gerentes.findIndex((g) => g.correo === decoded.email);

              if (gerenteIndex !== -1) {
                gerentes[gerenteIndex].estado = "Pendiente de ajustes";
              } else {
                console.warn("⚠️ No se encontró el gerente en aprobacionGerentes");
              }

              
              if (gerentes.some((g) => g.estado === "En revision")) {
                allGerentesAcept = "Not Send messages";
              }

              const updateData = {
                comentarios: admin.firestore.FieldValue.arrayUnion(newComment),
                aprobacionGerentes: gerentes,
              };

              
              if (allGerentesAcept === "Ajustes pendientes") {
                updateData.estado = "Pendiente de ajustes";
                updateData.estadoAjustesPendientes = "Gerentes";
              }

              const dataUpdate = await docRef.update(updateData);

              
              if (allGerentesAcept === "Ajustes pendientes") {


                
                const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";
                
                const userMethodsRef = await db.collection("users").where("role", "==", "METHODS").get();
                const userMethods = userMethodsRef.docs.map(doc => doc.data());

                const gmailRecipient =[...gerentes,{correo: infoDraft.correo},...userMethods]

                await axios.post(
                n8nWebhookUrl,
                {recipients:gmailRecipient,
                   info: infoDraft
                }
                ,

                {
                    headers: {
                    "Content-Type": "application/json",
                    "API_KEY_N8N": process.env.SECRET_KEY_N8N,
                    "motivo": "Ajustes Gerentes",
                    "id_radicado": documentId
                    },
                }
                );
              }





        } else {
          
            await docRef.update({
                comentarios: admin.firestore.FieldValue.arrayUnion(newComment),
                estado: "Pendiente de ajustes",
                estadoAjustesPendientes: "GD",
                aprobacionGD: [{ name: decoded.name, email: decoded.email, estado: "En revisión" }],
            });

            const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";
            const payload = { ...newComment, id: documentId };

            await axios.post(
            n8nWebhookUrl,
            payload,
            {
                headers: {
                "Content-Type": "application/json",
                "API_KEY_N8N": process.env.SECRET_KEY_N8N,
                "motivo": "Ajustes",
                },
            }
            );
        }

        
        return res.status(200).json({
          success: true,
          message: "Comentario agregado y solicitud de ajustes creada correctamente.",
          data: { ...newComment, id: documentId },
        });

      } catch (err) {
        if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
          return res.status(401).json({ success: false, message: "Token inválido o expirado." });
        }

        console.error("❌ Error al actualizar el comentario en Firebase:", err);
        return res.status(500).json({ success: false, message: "Error interno del servidor." });
      }
    },

    async updateStatusDraftAceptComplete(req, res) {

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

      const { id_draft } = req.body;

      if (!id_draft) {
        return res.status(400).json({ success: false, message: "Falta el ID del borrador" });
      }

      // Obtener referencia correcta
      const refDraft = db.collection("draft").doc(id_draft);

      // Obtener documento
      const snapshot = await refDraft.get();

      if (!snapshot.exists) {
        return res.status(404).json({ success: false, message: "El borrador no existe" });
      }

      const infoDraft = snapshot.data();

      // Actualizar estado
      const dataUpdate = await refDraft.update({ estado: "Aprobado" });

      

      let snapshotUsers;
      if(infoDraft.estado == "En revision"){
        snapshotUsers = await db
        .collection("users")
        .where("role", "in", ["Gerente", "METHODS","Vicepresidentes"])
        .get();

      }else{ 
        snapshotUsers = await db
        .collection("users")
        .where("role", "in", ["Gerente", "METHODS"])
        .get();}
      

      const users = snapshotUsers.docs.map(doc => doc.data());

      // Correos para n8n
      const infoGmailMessages = [{ correo: infoDraft.correo }, ...users];

      const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";

      const response = await axios.post(
        n8nWebhookUrl,
        {
          recipients: infoGmailMessages,
          info: infoDraft
        },
        {
          headers: {
            "Content-Type": "application/json",
            "API_KEY_N8N": process.env.SECRET_KEY_N8N,
            "motivo": "aprobacion completa",
            "id_radicado": id_draft
          }
        }
      );

      return res.status(200).json({
        success: true,
        message: "Borrador aceptado y estado actualizado.",
        data: dataUpdate
      });
    },

    async passItOnVicepresidente(req, res) {

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

      const { id_draft } = req.body;

      if (!id_draft) {
        return res.status(400).json({ success: false, message: "Falta el ID del borrador" });
      }

     
      const refDraft = db.collection("draft").doc(id_draft);

  
      const snapshot = await refDraft.get();

      if (!snapshot.exists) {
        return res.status(404).json({ success: false, message: "El borrador no existe" });
      }

      const infoDraft = snapshot.data();

      const userVice = db.collection("users").where("role", "==", "Vicepresidente")

      const snapshotVice = await userVice.get();

      const vicepresidentes = snapshotVice.docs.map( doc => ({...doc.data(), estado : "En revision"}))
      
      const dataUpdate = await refDraft.update({ 
        estado: "En revision" ,
        aprobacionVices: vicepresidentes                 
                         
      });

      
      const snapshotUsers = await db
        .collection("users")
        .where("role", "in", ["Gerente", "METHODS","Vicepresidente"])
        .get();

      const users = snapshotUsers.docs.map(doc => doc.data());

      // Correos para n8n
      const infoGmailMessages = [{ correo: infoDraft.correo }, ...users];

      const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";

      const response = await axios.post(
        n8nWebhookUrl,
        {
          recipients: infoGmailMessages,
          info: infoDraft
        },
        {
          headers: {
            "Content-Type": "application/json",
            "API_KEY_N8N": process.env.SECRET_KEY_N8N,
            "motivo": "Vicepresidentes",
            "id_radicado": id_draft
          }
        }
      );

      return res.status(200).json({
        success: true,
        message: "Borrador aceptado y estado actualizado.",
        data: dataUpdate
      });
    }

    


}

module.exports = methodsModel;
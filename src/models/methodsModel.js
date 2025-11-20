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

            const gerentes = Array.isArray(dataDraft.aprovacionGerentes)
            ? [...dataDraft.aprovacionGerentes]
            : [];

            console.log(decoded.email)

            const indexGerente = gerentes.findIndex(g => g.correo === decoded.email);
            
            gerentes[indexGerente].estado = "Aceptado"

            if (gerentes.some((g) => g.estado === "En revision")) {
              allGerentesAcept = "Not Send messages";
            }else if ( gerentes.some((g)=>g.estado === "Pendiente de ajustes")){
              allGerentesAcept = "Pendiente de ajustes";
            }

            const updateData = {
              aprovacionGerentes: gerentes
            };

            await draftRef.update({
              aprovacionGerentes:gerentes,
            });



            if (allGerentesAcept === "Aceptado por todos"){
              
              updateData.estado = "Aprobacion pre-eliminar";
              const draft = await draftRef.update(updateData);

              const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";
              
              await axios.post(
              n8nWebhookUrl,
              draft,
              {
                  headers: {
                  "Content-Type": "application/json",
                  "API_KEY_N8N": process.env.SECRET_KEY_N8N,
                  "motivo": "Aceptacion gerentes",
                  },
              }
              );

            }else if( allGerentesAcept === "Pendiente de ajustes"){
              updateData.estado = "Pendiente de ajustes";
              updateData.estadoAjustesPendientes = "Gerentes";

              const draft =await draftRef.update(updateData);

              const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";
              
              await axios.post(
              n8nWebhookUrl,
              draft,
              {
                  headers: {
                  "Content-Type": "application/json",
                  "API_KEY_N8N": process.env.SECRET_KEY_N8N,
                  "motivo": "Ajustes Gerentes",
                  },
              }
              );
            }
           


          }else if(decoded.role == "METHODS"){

            const gerentesSnapshot = await db.collection("users").where("role", "==", "Gerente").get();
            const gerentesData = gerentesSnapshot.docs.map(doc => ({...doc.data(),"estado":"En revision"}));
          
            console.log("Manager Data:", gerentesData);
            const gerentesyMethodsSnapshot = await db.collection("users").where("role", "in", ["Gerente", "METHODS"]).get();
            const infoGmailMessages = gerentesyMethodsSnapshot.docs.map(doc => doc.data());

            await draftRef.update({
                estado: "En revision", 
                aprovacionGD:[{name:decoded.name, email: decoded.email, estado:"aceptado"}],
                aprovacionGerentes:gerentesData,


                
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
                    'motivo':'aprovacionGD',
                    'id_draft':id_draft
                }
                }
            );


          };

          
          
        
          
          // The data for the managers is inside gerentesSnapshot.docs
          /*
          const managerEmails = gerentesSnapshot.docs.map(doc => doc.data().email);
          console.log("Manager Emails:", managerEmails);
          */
          // ---------------------------------
          
          return res.status(200).json({ 
              success: true, 
              message: `Borrador aceptado y estado actualizado.`,
              data: draftSnapshot.data() // Return the *original* draft data before the update
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

          console.log(decoded.role)
          

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

          const gerentes = Array.isArray(infoDraft.aprovacionGerentes)
            ? [...infoDraft.aprovacionGerentes]
            : [];
 
          const gerenteIndex = gerentes.findIndex((g) => g.correo === decoded.email);

          if (gerenteIndex !== -1) {
            gerentes[gerenteIndex].estado = "Pendiente de ajustes";
          } else {
            console.warn("⚠️ No se encontró el gerente en aprovacionGerentes");
          }

          
          if (gerentes.some((g) => g.estado === "En revision")) {
            allGerentesAcept = "Not Send messages";
          }

          const updateData = {
            comentarios: admin.firestore.FieldValue.arrayUnion(newComment),
            aprovacionGerentes: gerentes,
          };

          
          if (allGerentesAcept === "Ajustes pendientes") {
            updateData.estado = "Pendiente de ajustes";
            updateData.estadoAjustesPendientes = "Gerentes";
          }

          const dataUpdate = await docRef.update(updateData);

          
          if (allGerentesAcept === "Ajustes pendientes") {
            
            const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";
            

            await axios.post(
            n8nWebhookUrl,
            dataUpdate,

            {
                headers: {
                "Content-Type": "application/json",
                "API_KEY_N8N": process.env.SECRET_KEY_N8N,
                "motivo": "Ajustes Gerentes",
                },
            }
            );
          }

        } else {
          
            await docRef.update({
                comentarios: admin.firestore.FieldValue.arrayUnion(newComment),
                estado: "Pendiente de ajustes",
                estadoAjustesPendientes: "GD",
                aprovacionGD: [{ name: decoded.name, email: decoded.email, estado: "En revisión" }],
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


}

module.exports = methodsModel;
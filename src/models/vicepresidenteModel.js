const jwt = require("jsonwebtoken");
const axios = require("axios")
const {db, bucket} = require('../firebase')
const admin = require('firebase-admin');
const FieldValue = admin.firestore.FieldValue;

const vicepresidenteModel = {
    
    
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

          



        let allVicepresidentesAcept = "Aceptado por todos";

        const vicepresidentes = Array.isArray(dataDraft.aprobacionVices)
          ? [...dataDraft.aprobacionVices]
          : [];

            

        const indexGerente = vicepresidentes.findIndex(g => g.correo === decoded.email);
                
        vicepresidentes[indexGerente].estado = "Aceptado"

        if (vicepresidentes.some((g) => g.estado === "En revision")) {
          allVicepresidentesAcept = "Not Send messages";
        }else if ( vicepresidentes.some((g)=>g.estado === "Pendiente de ajustes")){
          allVicepresidentesAcept = "Pendiente de ajustes";
        }

        const updateData = {
          aprobacionVices: vicepresidentes
        };

        await draftRef.update({
          aprobacionVices:vicepresidentes,
        });



        if (allVicepresidentesAcept === "Aceptado por todos"){
                  
          updateData.estado = "Aprobado";
          const draft = await draftRef.update(updateData);

          const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";
                  
          const usersRef = await db.collection('users').where("role","in",["METHODS","Gerente"]).get();

          const users = usersRef.docs.map(doc => doc.data());

          const gmailRecipient =[...vicepresidentes,{correo: dataDraft.correo},...users]
                  
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
                      "motivo": "Aceptacion Vicepresidentes",
                      "id_radicado":id_draft
                      },
              }
            );

        }else if( allVicepresidentesAcept === "Pendiente de ajustes"){


            updateData.estado = "Pendiente de ajustes";
            updateData.estadoAjustesPendientes = "Gerentes";

            await draftRef.update(updateData);

            const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";

 
            const usersRef = await db.collection("users").where("role", "in", ["METHODS","Gerente"]).get();
            const users = usersRef.docs.map(doc => doc.data());

            const gmailRecipient =[... vicepresidentes,{correo: dataDraft.correo},...users]
                  
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
                      "motivo": "Ajustes Vicepresidentes",
                      "id_radicado": id_draft
                },
              }
            );
        }
           




          
        
        
          
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

        
        



        let allVicepresidentesAcept = "Ajustes pendientes";

        const Vicepresidentes = Array.isArray(infoDraft.aprobacionVices)
                ? [...infoDraft.aprobacionVices]
                : [];
    
        const vicepresidenteIndex= Vicepresidentes.findIndex((g) => g.correo === decoded.email);

        if (vicepresidenteIndex!== -1) {
          Vicepresidentes[vicepresidenteIndex].estado = "Pendiente de ajustes";
        } else {
                console.warn("⚠️ No se encontró el gerente en aprobacionGerentes");
        }

              
        if (Vicepresidentes.some((g) => g.estado === "En revision")) {
          allVicepresidentesAcept = "Not Send messages";
        }

        const updateData = {
          comentarios: admin.firestore.FieldValue.arrayUnion(newComment),
          aprobacionVices: Vicepresidentes,
        };

              
        if (allVicepresidentesAcept === "Ajustes pendientes") {
          updateData.estado = "Pendiente de ajustes";
          updateData.estadoAjustesPendientes = "Vicepresidentes";
        }

       await docRef.update(updateData);

              
      if (allVicepresidentesAcept === "Ajustes pendientes") {

        const n8nWebhookUrl = "https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0";
                
        const usersRef = await db.collection("users").where("role", "in", ["METHODS", "Gerente"]).get();
        const users = usersRef.docs.map(doc => doc.data());

        const gmailRecipient =[...Vicepresidentes,{correo: infoDraft.correo},...users]

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
                    "motivo": "Ajustes Vicepresidentes",
                    "id_radicado": documentId
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
    }



}

module.exports = vicepresidenteModel;
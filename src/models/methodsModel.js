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
        // NOTE: Ensure 'jwt' is correctly imported/required
        decoded = jwt.verify(token, process.env.SECRET_KEY);
    } catch (err) {
        return res.status(401).json({ success: false, message: "Token inválido o expirado" });
    }

    const email = decoded.email;
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

        
        await draftRef.update({
            estado: "En revision", 
            
        });
        
        // --- Note on 'gerentes' Query ---
        // CORRECTED: Typos fixed. gerentesSnapshot is used correctly below.
        const gerentesSnapshot = await db.collection("users").where("role", "==", "Gerente").get();
        const gerentesData = gerentesSnapshot.docs.map(doc => doc.data());
        console.log("Manager Data:", gerentesData);
        
        // The data for the managers is inside gerentesSnapshot.docs
        /*
        const managerEmails = gerentesSnapshot.docs.map(doc => doc.data().email);
        console.log("Manager Emails:", managerEmails);
        */
        // ---------------------------------
        
        return res.status(200).json({ 
            success: true, 
            message: `Borrador ${id_draft} aceptado y estado actualizado.`,
            data: draftSnapshot.data() // Return the *original* draft data before the update
        });

    } catch (error) {
        console.error("Error al procesar la aceptación del borrador:", error);
        return res.status(500).json({ success: false, message: "Error interno del servidor al actualizar el borrador" });
    }
    },

    async getAllDrafts(req, res) {
    // Engloba toda la lógica que puede fallar, incluyendo la base de datos
    try {
        const token = req.cookies.session;

        // 1. Verificación de token nulo
        if (!token) {
            // ¡Importante! Usar 'return' para detener la ejecución
            return res.status(401).json({ success: false, message: "No hay token de sesión" });
        }

        // 2. Verificación de token
        // Si jwt.verify falla, saltará al bloque 'catch' de abajo
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        
        // Opcional: Podrías usar 'decoded' para filtrar los borradores solo del usuario logueado.
        // Por ahora, solo lo usaremos para validar que el usuario está autenticado.

        // 3. Consulta a la base de datos
        const snapshot = await db.collection("draft").get();
        
        // 4. Mapeo correcto de los documentos
        const drafts = snapshot.docs.map(doc => ({ 
            id: doc.id,
            ...doc.data() // Asegura que se extrae el objeto de datos de cada documento
        }));

        // 5. Respuesta de éxito
        return res.status(200).json({ 
            success: true,
            data: drafts 
        });

    } catch (err) {
        // Este catch maneja errores de jwt.verify Y errores de la base de datos
        
        // Determinar un mensaje más específico para la base de datos si fuera necesario, 
        // pero para el token inválido o expirado es correcto.
        
        // Usar 'success: false' y un código 401 (para token) o 500 (para BD genérico)
        
        // Si el error es específicamente de JWT (token inválido o expirado)
        if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
            return res.status(401).json({ success: false, message: "Token inválido o expirado" });
        }
        
        // Para cualquier otro error (ej: Base de Datos)
        return res.status(500).json({ success: false, message: "Error interno del servidor", error: err.message });
    }
},

    async createRequestAdjustment(req,res){

         try{
            const token = req.cookies.session;
            if(!token){
                res.status(401).json({succes:false, messages:"No hay token de sesion"});
            }

            let decoded;
            decoded = jwt.verify(token, process.env.SECRET_KEY);

           
            const { documentId, inf } = req.body;
            
            if (!documentId || !inf) {
                return res.status(400).json({ success: false, message: "Faltan documentId o commentText." });
            }

        
            const docRef = db.collection("draft").doc(documentId);
            const docSnap = await docRef.get();

            const newComment = {
                
                userId: decoded.name, 
                gmailSender: decoded.email,
                gmailRecipient: docSnap.data().correo ,
                tipoSolicitud:inf.tipoSolicitud,
                comentarioAjuste: inf.comentariosAjuste,
                fecha: new Date(),
            };

            
            await docRef.update({
                comentarios: FieldValue.arrayUnion(newComment),
                estado:"Pendiente de ajustes",
                estadoAjustesPendientes: "Activo"
            });

            newComment[id] =documentId;

            

            const n8nWebhookUrl = 'https://segurobolivar-trial.app.n8n.cloud/webhook/bde93e34-e7c6-4e5f-b7ff-c59cbb7363b0';
            
                const response = await axios.post(
                  n8nWebhookUrl,
                  newComment,
                  {
                    headers: {
                      'Content-Type': 'application/json',
                      'API_KEY_N8N': process.env.SECRET_KEY_N8N,
                      'motivo':'Ajustes'
                    }
                  }
                );

             return res.status(200).json({
                success: true,
                message: "Comentario agregado y solicitud de ajustes creada correctamente.",
                data: newComment
                });


            

        }catch(err){
            if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
                 return res.status(401).json({success:false,message:"Token inválido o expirado"});
            }
            console.error("Error al actualizar el comentario en Firebase:", err);
            return res.status(500).json({success:false,message:"Error interno del servidor al procesar la solicitud."});
        }
         

    }

}

module.exports = methodsModel;
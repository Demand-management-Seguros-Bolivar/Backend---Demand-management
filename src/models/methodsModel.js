const jwt = require("jsonwebtoken");
const axios = require("axios")
const {db, bucket} = require('../firebase')
const admin = require('firebase-admin');
const FieldValue = admin.firestore.FieldValue;

const methodsModel = {

    async getAllDrafts(req,res){

        try{
            const token = req.cookies.session;
            if(!token){
                res.status(401).json({succes:false, messages:"No hay token de sesion"});
            }

            let decoded;
            decoded = jwt.verify(token, process.env.SECRET_KEY);

        }catch(err){
            res.status(401).json({success:true,message:"Token inválido o expirado"});
        }
         
        const snapshot = await db.collection("draft").get();

        return snapshot.docs

    },

    async createRequestAdjustment(req,res){

         try{
            const token = req.cookies.session;
            if(!token){
                res.status(401).json({succes:false, messages:"No hay token de sesion"});
            }

            let decoded;
            decoded = jwt.verify(token, process.env.SECRET_KEY);

            // --- CÓDIGO PARA ACTUALIZAR EL ARRAY 'comentarios' ---

            // 1. Obtener la data necesaria del body de la solicitud
            // Asume que en el body recibes el ID del documento y el texto del nuevo comentario
            const { documentId, inf } = req.body;
            
            if (!documentId || !inf) {
                return res.status(400).json({ success: false, message: "Faltan documentId o commentText." });
            }

            // 2. Crear el nuevo objeto (map) de comentario
            const newComment = {
                // El 'uid' se obtiene del token decodificado
                userId: decoded.name, 
                gmailSender: decoded.email,
                tipoSolicitud:inf.tipoSolicitud,
                comentarioAjuste: inf.comentariosAjuste,
                // Usamos serverTimestamp() para una marca de tiempo generada por el servidor
                fecha: new Date(),
                // Puedes agregar más campos aquí (e.g., userName, reviewStatus)
            };

            // 3. Obtener la referencia al documento
            const docRef = db.collection("draft").doc(documentId);

             // 4. Usar FieldValue.arrayUnion() para añadir el nuevo mapa al array 'comentarios'
            await docRef.update({
                comentarios: FieldValue.arrayUnion(newComment),
                estado:"Pendiente de ajustes",
                estadoAjustesPendientes: "Activo"
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
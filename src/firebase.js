// src/db.js
const admin = require('firebase-admin');
require('dotenv').config();

// Carga las credenciales del archivo JSON
const serviceAccount = require('../firebase.json');

// Inicializa la app de Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
   storageBucket: process.env.FIREBASE_BUCKET
});

const bucket = admin.storage().bucket();

// Obtén una referencia a la base de datos de Firestore
const db = admin.firestore();

module.exports = {db,bucket};
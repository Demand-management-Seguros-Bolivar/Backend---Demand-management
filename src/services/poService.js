// src/services/bookService.js
const poModel = require("../models/poModel");

const poService = {
  getRadicadosByUser: (req,res) => poModel.getRadicadosByUser(req,res),
  getRadicadoById: (id_radicado) => poModel. getRadicadoById(id_radicado),
  createDraft: (req,res) => poModel.createDraft(req,res),
  UpdateRadicadoById: (id_radicado) => poModel.UpdateRadicadoById(id_radicado),
  getAnswerIa:(req,res) => poModel.getAnswerIa(req,res),
};

module.exports = poService;

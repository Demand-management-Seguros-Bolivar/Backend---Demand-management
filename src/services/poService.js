// src/services/bookService.js
const poModel = require("../models/poModel");

const poService = {
  getRadicadosByUser: (req) => poModel.getRadicadosByUser(req),
  getRadicadoById: (id_radicado) => poModel. getRadicadoById(id_radicado),
  createDraft: (req) => poModel.createDraft(req),
  UpdateRadicadoById: (id_radicado) => poModel.UpdateRadicadoById(id_radicado),
  getAnswerIa:(req) => poModel.getAnswerIa(req),
};

module.exports = poService;

// src/services/bookService.js
const poModel = require("../models/poModel");

const poService = {
  getRadicadosByUser: (req,res) => poModel.getRadicadosByUser(req,res),
  getRadicadoByIdAjustes: (req,res) => poModel. getRadicadoByIdAjustes(req,res),
  getRadicadoByIdDetails: (req,res) => poModel.getRadicadoByIdDetails(req,res),
  createDraft: (req,res) => poModel.createDraft(req,res),
  UpdateRadicadoById: (req,res) => poModel.UpdateRadicadoById(req,res),
  getAnswerIa:(req,res) => poModel.getAnswerIa(req,res),

};

module.exports = poService;

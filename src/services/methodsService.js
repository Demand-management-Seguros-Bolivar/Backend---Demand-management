const methodsModel = require("../models/methodsModel");

const methodsService = {
  getAllDrafts: (req,res) => methodsModel.getAllDrafts(req,res),
  createRequestAdjustment: (req,res) =>methodsModel.createRequestAdjustment(req,res),

};

module.exports = methodsService;
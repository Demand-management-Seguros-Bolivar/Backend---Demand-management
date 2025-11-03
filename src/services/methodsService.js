const methodsModel = require("../models/methodsModel");

const methodsService = {
  getAllDrafts: (req,res) => methodsModel.getAllDrafts(req,res),
  createRequestAdjustment: (req,res) =>methodsModel.createRequestAdjustment(req,res), 
  updateStatusDraftAcept:(req,res) => methodsModel.updateStatusDraftAcept(req,res),


};

module.exports = methodsService;
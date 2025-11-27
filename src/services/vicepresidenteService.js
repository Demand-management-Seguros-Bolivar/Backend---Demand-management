const vicepresidenteModel = require("../models/vicepresidenteModel");

const methodsService = {
  
  createRequestAdjustment: (req,res) =>vicepresidenteModel.createRequestAdjustment(req,res), 
  updateStatusDraftAcept:(req,res) => vicepresidenteModel.updateStatusDraftAcept(req,res)
  
};

module.exports = methodsService;
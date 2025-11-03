const express = require("express");

const {getAllDrafts ,createRequestAdjustments, updateStatusDraftAcept} = require("../controllers/methodsController")

const router = express.Router();

router.get("/getAllDrafts", getAllDrafts)
router.post("/createRequestAdjustments", createRequestAdjustments)
router.post("/aceptDraftsMT",updateStatusDraftAcept );

module.exports = router;
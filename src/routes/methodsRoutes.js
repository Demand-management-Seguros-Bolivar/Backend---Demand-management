const express = require("express");

const {getAllDrafts ,createRequestAdjustments, updateStatusDraftAcept, updateStatusDraftAceptComplete, passItOnVicepresidente} = require("../controllers/methodsController")

const router = express.Router();

router.get("/getAllDrafts", getAllDrafts)
router.post("/createRequestAdjustments", createRequestAdjustments)
router.post("/aceptDrafts",updateStatusDraftAcept );
router.post("/aceptDraftsComplete",updateStatusDraftAceptComplete);
router.post("/passItOnVicepresidente", passItOnVicepresidente)

module.exports = router;
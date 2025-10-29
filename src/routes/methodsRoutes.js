const express = require("express");

const {getAllDrafts ,createRequestAdjustments} = require("../controllers/methodsController")

const router = express.Router();

router.get("/getAllDrafts", getAllDrafts)
router.post("/createRequestAdjustments", createRequestAdjustments)

module.exports = router;
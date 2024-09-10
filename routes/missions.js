const express = require("express");
const router = express.Router();
const missionController = require("../controllers/mission-controller");
const { isAuthorized } = require("../shared/auth");

// Create a new mission
router.post("/", isAuthorized, missionController.createMission);

module.exports = router;
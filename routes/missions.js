const express = require("express");
const router = express.Router();
const missionController = require("../controllers/mission-controller");
const { isAuthorized, isAdmin } = require("../shared/auth");

// Create a new mission
router.post("/", isAuthorized, missionController.createMission);


// Mission list for admins
router.get("/admin", isAdmin, missionController.getAdminMissions);

// Get mission by ID
router.get("/:id", isAuthorized, missionController.getMissionById);

module.exports = router;
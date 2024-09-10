const express = require("express");
const router = express.Router();
const missionController = require("../controllers/mission-controller");
const { isAuthorized, isAdmin, isAssassin } = require("../shared/auth");

// Create a new mission
router.post("/", isAuthorized, missionController.createMission);

// Mission list for admins
router.get("/admin", isAdmin, missionController.getAdminMissions);

// Mission lists for assassins
router.get("/general", isAssassin, missionController.getGeneralMissions);
router.get("/assigned", isAssassin, missionController.getAssignedMissions);
// router.get("/created-by-me", isAssassin, missionController.getAssassinMissions);

// Get mission by ID
router.get("/:id", isAuthorized, missionController.getMissionById);

// Update missions based on status
router.put("/:id/publish", isAdmin, missionController.publishMission);
router.put("/:id/reject", isAdmin, missionController.rejectMission);

router.put("/:id/assign", isAssassin, missionController.assignMission);

module.exports = router;
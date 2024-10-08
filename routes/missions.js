const express = require("express");
const router = express.Router();
const missionController = require("../controllers/mission-controller");
const { isAuthorized, isAdmin, isAssassin } = require("../shared/auth");
const { uploadFile } = require("../controllers/file-controller");

// Create a new mission
router.post("/", isAuthorized, missionController.createMission);

// Mission list for admins
router.get("/admin", isAdmin, missionController.getAdminMissions);

// Mission lists for assassins
router.get("/general", isAssassin, missionController.getGeneralMissions);
router.get("/assigned", isAssassin, missionController.getAssignedMissions);
router.get("/created-by-me", isAssassin, missionController.getMissionsCreatedByMe);

// Get mission by ID
router.get("/:id", isAuthorized, missionController.getMissionById);

// Update missions based on status (order of routes follows the flow of the mission)
router.put("/:id/publish", isAdmin, missionController.publishMission);
router.put("/:id/reject", isAdmin, missionController.rejectMission);

router.put("/:id/assign", isAssassin, missionController.assignMission);
router.put("/:id/complete", isAssassin, uploadFile('evidence'), missionController.completeMission);

router.put("/:id/pay", isAuthorized, missionController.payMission);
router.put("/:id/reject-evidence", isAuthorized, missionController.rejectMissionEvidence);

module.exports = router;
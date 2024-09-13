const express = require("express");
const router = express.Router();
const assassinController = require("../controllers/assassin-controller");
const { isAdmin, isAuthorized, isAssassin } = require("../shared/auth");
const { uploadFile } = require("../controllers/file-controller");

// Create a new assassin
router.post("/", isAdmin, uploadFile('profilePicture'), assassinController.createAssassin);

// Update an assassin
router.put("/:id", isAdmin, uploadFile('profilePicture'), assassinController.updateAssassin);

// Update assassin status
router.put("/:id/status", isAdmin, assassinController.updateAssassinStatus);

// List assassins
router.get("/", isAuthorized, assassinController.listAssassins);

// Purchase assassin information
router.put("/:id/purchase-information", isAssassin, assassinController.purchaseAssassinInformation);

// Get assassin information
router.get("/:id", isAuthorized, assassinController.getAssassinById);
router.get("/:id/missions", isAdmin, assassinController.getAssassinMissions);
router.get("/:id/debts", isAdmin, assassinController.getAssassinDebts);

module.exports = router;
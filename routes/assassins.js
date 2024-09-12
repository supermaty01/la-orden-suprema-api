const express = require("express");
const router = express.Router();
const assassinController = require("../controllers/assassin-controller");
const { isAdmin, isAuthorized, isAssassin } = require("../shared/auth");
const { uploadFile } = require("../controllers/file-controller");

// Create a new assassin
router.post("/", isAdmin, uploadFile('profilePicture'), assassinController.createAssassin);

// Update an assassin
router.put("/:id", isAuthorized, uploadFile('profilePicture'), assassinController.updateAssassin);

// List assassins
router.get("/", isAuthorized, assassinController.listAssassins);

// Purchase assassin information
router.put("/purchase-information", isAssassin, assassinController.purchaseAssassinInformation);

// Get assassin by ID
router.get("/:id", isAuthorized, assassinController.getAssassinById);

module.exports = router;
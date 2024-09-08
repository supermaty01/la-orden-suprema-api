const express = require("express");
const router = express.Router();
const assassinController = require("../controllers/assassin-controller");
const { isAdmin, isAuthorized } = require("../shared/auth");

// Create a new assassin
router.post("/", isAdmin, assassinController.createAssassin);

// List assassins
router.get("/", isAuthorized, assassinController.listAssassins);

module.exports = router;
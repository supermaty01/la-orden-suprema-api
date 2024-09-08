const express = require("express");
const router = express.Router();
const assassinController = require("../controllers/assassin-controller");
const { isAdmin, isAuthorized, isAssassin } = require("../shared/auth");

// Create a new assassin
router.post("/", isAdmin, assassinController.createAssassin);

// List assassins
router.get("/", isAuthorized, assassinController.listAssassins);

// Purchase assassin information
router.put("/purchase-information", isAssassin, assassinController.purchaseAssassinInformation);

module.exports = router;
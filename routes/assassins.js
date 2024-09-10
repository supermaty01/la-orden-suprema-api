const express = require("express");
const router = express.Router();
const assassinController = require("../controllers/assassin-controller");
const { isAdmin, isAuthorized, isAssassin } = require("../shared/auth");
const multer = require('multer');

// Create a new assassin
const storage = multer.memoryStorage();
const upload = multer({ storage });
router.post("/", isAdmin, upload.single('profilePicture'), assassinController.createAssassin);

// List assassins
router.get("/", isAuthorized, assassinController.listAssassins);

// Purchase assassin information
router.put("/purchase-information", isAssassin, assassinController.purchaseAssassinInformation);

module.exports = router;
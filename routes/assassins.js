const express = require("express");
const router = express.Router();
const assassinController = require("../controllers/assassin-controller");
const { isAdmin } = require("../shared/auth");

// Create a new assassin
router.post("/", isAdmin, assassinController.createAssassin);

module.exports = router;
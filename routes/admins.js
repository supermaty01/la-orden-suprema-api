const express = require("express");
const router = express.Router();
const adminController = require("../controllers/admin-controller");

// Create a new admin (Test route only)
router.post("/", adminController.createAdmin);

module.exports = router;
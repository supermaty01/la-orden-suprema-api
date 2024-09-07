const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");

// Login route
router.post("/", userController.login);

module.exports = router;
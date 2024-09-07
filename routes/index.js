const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");

// Login route
router.post("/login", userController.login);

// Forgot password routes
router.post("/forgot-password", userController.forgotPassword);
router.post("/forgot-password/code", userController.forgotPasswordCode);
router.post("/forgot-password/reset", userController.forgotPasswordReset);

module.exports = router;
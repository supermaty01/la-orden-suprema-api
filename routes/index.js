const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");
const { isAuthorized, isAssassin } = require("../shared/auth");
const { Countries, Configuration } = require("../shared/constants");
const { uploadFile } = require("../controllers/file-controller");

// Login route
router.post("/login", userController.login);

// Assassin profile
router.get("/me", isAuthorized, userController.getProfile);
router.put("/me", isAssassin, uploadFile('profilePicture'), userController.updateProfile);

// Forgot password routes
router.post("/forgot-password", userController.forgotPassword);
router.post("/forgot-password/code", userController.forgotPasswordCode);
router.post("/forgot-password/reset", userController.forgotPasswordReset);

// General routes
router.get("/countries", isAuthorized, (req, res) => {
  res.status(200).json(Countries);
});

router.get("/configuration", isAuthorized, (req, res) => {
  res.status(200).json(Configuration);
});

module.exports = router;
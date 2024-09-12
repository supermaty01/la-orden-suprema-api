const express = require("express");
const router = express.Router();
const userController = require("../controllers/user-controller");
const { isAuthorized } = require("../shared/auth");
const { Countries, Configuration } = require("../shared/constants");

// Login route
router.post("/login", userController.login);

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
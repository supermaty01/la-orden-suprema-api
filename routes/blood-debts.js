const express = require("express");
const router = express.Router();
const bloodDebtController = require("../controllers/blood-debt-controller");
const { isAssassin } = require("../shared/auth");

// Get users who have debts to the current user
router.get("/users", isAssassin, bloodDebtController.getUsersWithDebts);

module.exports = router;
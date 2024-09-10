const express = require("express");
const router = express.Router();
const transactionController = require("../controllers/transaction-controller");
const { isAuthorized, isAssassin } = require("../shared/auth");

// List transactions
router.get("/", isAuthorized, transactionController.listTransactions);

// Buy coins
router.post("/buy-coins", isAuthorized, transactionController.buyCoins);
router.post("/sell-coins", isAssassin, transactionController.sellCoins);

module.exports = router;
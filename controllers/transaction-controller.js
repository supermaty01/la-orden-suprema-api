const z = require("zod");
const User = require("../models/user");
const Transaction = require("../models/transaction");
const { TransactionDescription, TransactionType } = require("../shared/constants");
const mongoose = require("mongoose");
const { ObjectId } = mongoose.Types;

exports.listTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.aggregate([
      {
        $match: {
          userId: ObjectId.createFromHexString(req.userId),
        },
      },
      {
        $project: {
          description: 1,
          amount: {
            $cond: {
              if: { $gte: ["$amount", 0] },
              then: { $concat: ["+", { $toString: "$amount" }] },
              else: { $toString: "$amount" },
            },
          },
          type: 1,
          date: 1,
        },
      },
      {
        $sort: { date: -1 },
      },
    ]);
    const user = await User.findById(req.userId);
    res.status(200).json({ transactions, coins: user.coins });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al listar las transacciones" });
  }
}

exports.buyCoins = async (req, res) => {
  try {
    const schema = z.object({
      coins: z.number().positive(),
    });
    schema.parse(req.body);
    const user = await User.findById(req.userId);
    user.coins += req.body.coins;
    const transaction = new Transaction({
      userId: req.userId,
      amount: req.body.coins,
      description: TransactionDescription.COIN_PURCHASE,
      type: TransactionType.INCOME,
      date: new Date(),
    });
    await user.save();
    await transaction.save();
    res.status(200).json({ message: "Monedas compradas exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    } else {
      console.error(error);
      res.status(500).json({ message: "Error al comprar monedas" });
    }
  }
}

exports.sellCoins = async (req, res) => {
  try {
    const schema = z.object({
      coins: z.number().positive(),
    });
    schema.parse(req.body);
    const user = await User.findById(req.userId);
    if (user.coins < req.body.coins) {
      return res.status(400).json({ message: "No cuentas con suficientes monedas para vender" });
    }
    user.coins -= req.body.coins;
    const transaction = new Transaction({
      userId: req.userId,
      amount: -req.body.coins,
      description: TransactionDescription.COIN_SELL,
      type: TransactionType.OUTCOME,
      date: new Date(),
    });
    await user.save();
    await transaction.save();
    res.status(200).json({ message: "Monedas vendidas exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    } else {
      console.error(error);
      res.status(500).json({ message: "Error al vender monedas" });
    }
  }
}
const z = require("zod");
const User = require("../models/user");
const Transaction = require("../models/transaction");
const { TransactionDescription, TransactionType } = require("../shared/constants");

exports.listTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ userId: req.userId }, { _id: 0, userId: 0, __v: 0 }).sort({ date: -1 });
    res.status(200).json(transactions);
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
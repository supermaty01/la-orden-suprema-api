const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  description: { type: String, required: true },
  type: { type: String, required: true },
  date: { type: Date, default: Date.now },
});

//Export model
module.exports = mongoose.model('Transaction', transactionSchema);
const mongoose = require('mongoose');

const bloodDebtSchema = new mongoose.Schema({
  status: { type: String, required: true },
  // Asesino que debe, es decir, el que crea la misión con deuda de sangre
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Asesino que recibe el pago, es decir, el que acepta la misión con deuda
  paidTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  // Misión asociada a la deuda de sangre
  createdMission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: true,
  },
  // Misión asociada al pago de la deuda de sangre
  paidMission: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Mission',
    required: false,
  },
});

//Export model
module.exports = mongoose.model('BloodDebt', bloodDebtSchema);
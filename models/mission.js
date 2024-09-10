const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({
  description: { type: String, required: true },
  details: { type: String, required: true },
  paymentType: { type: String, required: true },
  coinsAmount: { type: Number, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, required: true },
  publishedAt: { type: Date, required: false },
  declinedAt: { type: Date, required: false },
  assignedAt: { type: Date, required: false },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
});

//Export model
module.exports = mongoose.model('Mission', missionSchema);
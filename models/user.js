const mongoose = require('mongoose');
const { UserStatus } = require('../shared/constants');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  resetPasswordCode: { type: String, default: null, required: false },
  pendingReset: { type: Boolean, default: false, required: false },
  role: { type: String, required: true },
  coins: { type: Number, default: 0, required: true },
  // Assassin fields
  alias: { type: String, required: false },
  country: { type: String, required: false },
  address: { type: String, required: false },
  status: { type: String, default: UserStatus.ACTIVE, required: false },
  assassinInformationBought: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  ],
  profilePicture: { type: String, required: false },
});

//Export model
module.exports = mongoose.model('User', userSchema);
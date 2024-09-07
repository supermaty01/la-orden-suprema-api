const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  password: { type: String, required: true },
  resetPasswordCode: { type: String, default: null, required: false },
  pendingReset: { type: Boolean, default: false, required: false },
  role: { type: String, required: true },
});

//Export model
module.exports = mongoose.model('User', userSchema);
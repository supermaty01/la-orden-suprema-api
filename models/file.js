const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  fieldname: { type: String, required: true },
  originalname: { type: String, required: true },
  encoding: { type: String, required: true },
  mimetype: { type: String, required: true },
  size: { type: Number, required: true },
  buffer: { type: Buffer, required: true },
});

//Export model
module.exports = mongoose.model('File', fileSchema);
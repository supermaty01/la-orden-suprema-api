const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const z = require('zod');

exports.toObjectId = (id) => {
  try {
    const schema = z.string().refine((value) => ObjectId.isValid(value), {
      message: "El ID enviado no es un ID válido.",
      path: ["id"],
    });
    schema.parse(id);
    return ObjectId.createFromHexString(id);
  } catch (error) {
    throw error;
  }
}

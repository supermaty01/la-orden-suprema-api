const BloodDebt = require("../models/blood-debt");
const mongoose = require("mongoose");
const { BloodDebtStatus } = require("../shared/constants");
const { ObjectId } = mongoose.Types;

exports.getUsersWithDebts = async (req, res) => {
  try {
    const users = await BloodDebt.aggregate([
      {
        $match: {
          paidTo: ObjectId.createFromHexString(req.userId),
          status: BloodDebtStatus.PAID_INITIAL_MISSION,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "createdBy",
          foreignField: "_id",
          as: "createdBy",
        },
      },
      {
        $unwind: "$createdBy",
      },
      {
        $group: {
          _id: "$createdBy._id",
          alias: { $first: "$createdBy.alias" },
        },
      },
    ]);
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener los usuarios con deudas" });
  }
}
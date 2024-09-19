const BloodDebt = require("../models/blood-debt");
const { BloodDebtStatus } = require("../shared/constants");
const { toObjectId } = require('../shared/utils');

exports.getUsersWithDebts = async (req, res) => {
  try {
    const users = await BloodDebt.aggregate([
      {
        $match: {
          paidTo: toObjectId(req.userId),
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
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al obtener los usuarios con deudas" });
  }
}
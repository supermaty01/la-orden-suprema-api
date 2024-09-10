const { MissionPaymentType, MissionStatus, UserRole, TransactionDescription, TransactionType, BloodDebtStatus } = require("../shared/constants");
const Mission = require("../models/mission");
const User = require("../models/user");
const Transaction = require("../models/transaction");
const BloodDebt = require("../models/blood-debt");
const z = require('zod');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

exports.createMission = async (req, res) => {
  try {
    const schema = z.object({
      description: z.string().min(3).max(50),
      details: z.string().min(3).max(500),
      paymentType: z.string(),
      coinsAmount: z.number().int().positive().optional(),
      assignedTo: z.string().optional(),
    }).refine((data) => !(data.paymentType === MissionPaymentType.COINS && !data.coinsAmount), {
      message: "La cantidad de monedas es requerida para misiones con pago en monedas de asesino",
      path: ["coinsAmount"],
    }).refine((data) => !(data.paymentType !== MissionPaymentType.COINS && req.role === UserRole.ADMIN), {
      message: "Los administradores solo pueden crear misiones con pago en monedas de asesino",
      path: ["paymentType"],
    }).refine((data) => !(data.paymentType === MissionPaymentType.BLOOD_DEBT_COLLECTION && !data.assignedTo), {
      message: "El asesino asignado es requerido para misiones de cobro de deuda de sangre",
      path: ["assignedTo"],
    });
    schema.parse(req.body);

    const { description, details, paymentType, coinsAmount } = req.body;

    if (paymentType === MissionPaymentType.COINS) {
      const user = await User.findById(req.userId);
      if (user.coins < coinsAmount) {
        return res.status(400).json({ message: "No tienes suficientes monedas para crear esta misión" });
      }
      user.coins -= coinsAmount;

      const transaction = new Transaction({
        userId: req.userId,
        amount: -coinsAmount,
        description: TransactionDescription.MISSION_CREATION,
        type: TransactionType.OUTCOME,
        date: new Date(),
      });

      await transaction.save();
      await user.save();
    }

    const currentDate = new Date();
    const mission = new Mission({
      description,
      details,
      paymentType,
      coinsAmount,
      status: req.role === UserRole.ADMIN ? MissionStatus.PUBLISHED : MissionStatus.CREATED,
      createdAt: currentDate,
      createdBy: req.userId,
    });

    if (req.role === UserRole.ADMIN) {
      mission.publishedAt = currentDate;
    }

    const newMission = await mission.save();

    if (paymentType === MissionPaymentType.BLOOD_DEBT) {
      const bloodDebt = new BloodDebt({
        status: BloodDebtStatus.PENDING,
        createdBy: req.userId,
        createdMission: newMission._id,
      });
      await bloodDebt.save();
    }


    res.status(200).json({ message: "Misión creada exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    } else {
      console.error(error);
      res.status(500).json({ message: "Error al crear la misión" });
    }
  }
}

exports.getAdminMissions = async (req, res) => {
  try {
    const missions = await Mission.aggregate([
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
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      {
        $unwind: {
          path: "$assignedTo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          createdBy: "$createdBy.name",
          assignedTo: {
            $ifNull: ["$assignedTo.name", ""],
          },
          description: 1,
          status: 1,
        },
      },
    ]);
    res.status(200).json(missions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las misiones" });
  }
}

exports.getMissionById = async (req, res) => {
  try {
    const missions = await Mission.aggregate([
      {
        $match: {
          _id: ObjectId.createFromHexString(req.params.id),
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
        $lookup: {
          from: "users",
          localField: "assignedTo",
          foreignField: "_id",
          as: "assignedTo",
        },
      },
      {
        $unwind: {
          path: "$assignedTo",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          createdBy: {
            _id: "$createdBy._id",
            name: "$createdBy.name",
          },
          assignedTo: {
            $cond: {
              if: "$assignedTo",
              then: {
                _id: "$assignedTo._id",
                name: "$assignedTo.name",
              },
              else: null,
            },
          },
          description: 1,
          details: 1,
          paymentType: 1,
          coinsAmount: 1,
          status: 1,
          createdAt: 1,
          publishedAt: 1,
          rejectedAt: 1,
          assignedAt: 1,
        },
      },
    ]);

    const mission = missions[0];

    if (!mission) {
      return res.status(404).json({ message: "Misión no encontrada" });
    }
    res.status(200).json(mission);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener la misión" });
  }
}

exports.publishMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Misión no encontrada" });
    }

    if (mission.status !== MissionStatus.CREATED) {
      return res.status(400).json({ message: "La misión no puede ser publicada" });
    }

    mission.status = MissionStatus.PUBLISHED;
    mission.publishedAt = new Date();
    await mission.save();

    res.status(200).json({ message: "Misión publicada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al publicar la misión" });
  }
}

exports.rejectMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Misión no encontrada" });
    }

    if (mission.status !== MissionStatus.CREATED) {
      return res.status(400).json({ message: "La misión no puede ser rechazada" });
    }

    mission.status = MissionStatus.REJECTED;
    mission.rejectedAt = new Date();
    await mission.save();

    if (mission.paymentType === MissionPaymentType.COINS) {
      const user = await User.findById(mission.createdBy);
      user.coins += mission.coinsAmount;
      const transaction = new Transaction({
        userId: user._id,
        amount: mission.coinsAmount,
        description: TransactionDescription.MISSION_REJECTION,
        type: TransactionType.INCOME,
        date: new Date(),
      });
      await transaction.save();
      await user.save();
    } else if (mission.paymentType === MissionPaymentType.BLOOD_DEBT) {
      const bloodDebt = await BloodDebt.findOne({ createdMission: mission._id });
      bloodDebt.status = BloodDebtStatus.REJECTED;
      await bloodDebt.save();
    }

    res.status(200).json({ message: "Misión rechazada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al rechazar la misión" });
  }
}
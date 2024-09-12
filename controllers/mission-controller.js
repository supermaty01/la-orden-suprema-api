const { MissionPaymentType, MissionStatus, UserRole, TransactionDescription, TransactionType, BloodDebtStatus } = require("../shared/constants");
const Mission = require("../models/mission");
const User = require("../models/user");
const Transaction = require("../models/transaction");
const FileModel = require('../models/file');
const BloodDebt = require("../models/blood-debt");
const z = require('zod');
const { fileValidator } = require('../shared/validators');
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

    const { description, details, paymentType, coinsAmount, assignedTo } = req.body;

    let bloodDebt;

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
    } else if (paymentType === MissionPaymentType.BLOOD_DEBT_COLLECTION) {
      bloodDebt = await BloodDebt.findOne({ createdBy: assignedTo, paidTo: req.userId, status: BloodDebtStatus.PAID_INITIAL_MISSION });
      if (!bloodDebt) {
        return res.status(400).json({ message: "No tienes una deuda de sangre pendiente con este asesino" });
      }
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

    if (paymentType === MissionPaymentType.BLOOD_DEBT_COLLECTION) {
      mission.assignedTo = assignedTo;
    }

    const newMission = await mission.save();

    if (paymentType === MissionPaymentType.BLOOD_DEBT) {
      const bloodDebt = new BloodDebt({
        status: BloodDebtStatus.PENDING,
        createdBy: req.userId,
        createdMission: newMission._id,
      });
      await bloodDebt.save();
    } else if (paymentType === MissionPaymentType.BLOOD_DEBT_COLLECTION) {
      bloodDebt.paidMission = newMission._id;
      bloodDebt.status = BloodDebtStatus.PENDING_COLLECTION_APPROVAL;
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
    const filters = {};
    if (req.query.createdBy) {
      filters.createdBy = { $regex: req.query.createdBy, $options: 'i' };
    }
    if (req.query.status) {
      filters.status = req.query.status;
    }

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
      {
        $match: filters,
      },
    ]);
    res.status(200).json(missions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las misiones" });
  }
}

exports.getGeneralMissions = async (req, res) => {
  try {
    const filters = {
      status: MissionStatus.PUBLISHED,
      createdBy: { $ne: ObjectId.createFromHexString(req.userId) },
    };

    const missions = await Mission.aggregate([
      {
        $match: filters,
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
        $project: {
          _id: 1,
          createdBy: {
            $cond: {
              if: { $eq: ["$createdBy.role", UserRole.ADMIN] },
              then: { $literal: "Administrador de la orden" },
              else: "$createdBy.alias",
            },
          },
          description: 1,
        },
      },
    ]);
    res.status(200).json(missions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener las misiones" });
  }
}

exports.getAssignedMissions = async (req, res) => {
  try {
    const filters = {
      assignedTo: ObjectId.createFromHexString(req.userId),
    };

    if (req.query.status) {
      filters.status = req.query.status;
    } else {
      filters.status = { $in: [MissionStatus.ASSIGNED, MissionStatus.COMPLETED, MissionStatus.PAID] };
    }

    const missions = await Mission.aggregate([
      {
        $match: filters,
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
        $project: {
          _id: 1,
          createdBy: {
            $cond: {
              if: { $eq: ["$createdBy.role", UserRole.ADMIN] },
              then: { $literal: "Administrador de la orden" },
              else: "$createdBy.alias",
            },
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

exports.getMissionsCreatedByMe = async (req, res) => {
  try {
    const filters = {
      createdBy: ObjectId.createFromHexString(req.userId),
    };

    if (req.query.status) {
      filters.status = req.query.status;
    }

    const missions = await Mission.aggregate([
      {
        $match: filters,
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
          assignedTo: "$assignedTo.alias",
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
        $lookup: {
          from: "files",
          localField: "evidenceId",
          foreignField: "_id",
          as: "evidence",
        },
      },
      {
        $unwind: {
          path: "$evidence",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          createdBy: req.role === UserRole.ADMIN ? {
            _id: "$createdBy._id",
            name: "$createdBy.name",
          } : {
            $cond: {
              if: { $eq: ["$createdBy.role", UserRole.ADMIN] },
              then: { $literal: "Administrador de la orden" },
              else: "$createdBy.alias",
            }
          },
          assignedTo: {
            $cond: {
              if: "$assignedTo",
              then: req.role === UserRole.ADMIN ? {
                _id: "$assignedTo._id",
                name: "$assignedTo.name",
              } : "$assignedTo.alias",
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
          completedAt: 1,
          paidAt: 1,
          evidence: 1,
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
    const currentDate = new Date();

    mission.status = MissionStatus.PUBLISHED;
    mission.publishedAt = currentDate;
    if (mission.paymentType === MissionPaymentType.BLOOD_DEBT_COLLECTION) {
      const bloodDebt = await BloodDebt.findOne({ paidMission: mission._id });
      if (!bloodDebt) {
        return res.status(400).json({ message: "La misión no puede ser publicada" });
      }
      bloodDebt.status = BloodDebtStatus.COMPLETED;
      mission.status = MissionStatus.ASSIGNED;
      mission.assignedAt = currentDate;

      await bloodDebt.save();
    }

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
    } else if (mission.paymentType === MissionPaymentType.BLOOD_DEBT_COLLECTION) {
      const bloodDebt = await BloodDebt.findOne({ paidMission: mission._id });
      bloodDebt.status = BloodDebtStatus.PAID_INITIAL_MISSION;
      bloodDebt.paidMission = null;
      await bloodDebt.save();
    }

    res.status(200).json({ message: "Misión rechazada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al rechazar la misión" });
  }
}

exports.assignMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Misión no encontrada" });
    }

    if (mission.status !== MissionStatus.PUBLISHED) {
      return res.status(400).json({ message: "La misión no puede ser asignada" });
    }

    if (mission.createdBy.toString() === req.userId) {
      return res.status(400).json({ message: "No puedes asignarte una misión que creaste" });
    }

    if (mission.paymentType === MissionPaymentType.BLOOD_DEBT) {
      const bloodDebt = await BloodDebt.findOne({ createdMission: mission._id });
      if (bloodDebt.status !== BloodDebtStatus.PENDING) {
        return res.status(400).json({ message: "La misión no puede ser asignada" });
      }
      bloodDebt.status = BloodDebtStatus.ASSIGNED;
      bloodDebt.paidTo = req.userId;
      await bloodDebt.save();
    }

    mission.status = MissionStatus.ASSIGNED;
    mission.assignedTo = req.userId;
    mission.assignedAt = new Date();

    await mission.save();
    res.status(200).json({ message: "Misión asignada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al asignar la misión" });
  }
}

exports.completeMission = async (req, res) => {
  try {
    const schema = z.object({
      evidence: fileValidator(),
    });

    schema.parse({ evidence: req.file });

    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Misión no encontrada" });
    }

    if (mission.status !== MissionStatus.ASSIGNED) {
      return res.status(400).json({ message: "La misión no puede ser completada" });
    }

    if (mission.assignedTo.toString() !== req.userId) {
      return res.status(400).json({ message: "No puedes completar una misión que no tienes asignada" });
    }

    const file = new FileModel(req.file);
    const savedFile = await file.save();

    mission.status = MissionStatus.COMPLETED;
    mission.evidenceId = savedFile._id;

    await mission.save();
    res.status(200).json({ message: "Misión completada exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al completar la misión" });
  }
}

exports.payMission = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Misión no encontrada" });
    }

    if (mission.status !== MissionStatus.COMPLETED) {
      return res.status(400).json({ message: "La misión no puede ser pagada" });
    }

    if (mission.createdBy.toString() !== req.userId) {
      return res.status(400).json({ message: "No puedes pagar una misión que no creaste" });
    }

    if (mission.paymentType === MissionPaymentType.BLOOD_DEBT) {
      const bloodDebt = await BloodDebt.findOne({ createdMission: mission._id });
      if (bloodDebt.status !== BloodDebtStatus.ASSIGNED) {
        return res.status(400).json({ message: "La misión no puede ser pagada" });
      }
      bloodDebt.status = BloodDebtStatus.PAID_INITIAL_MISSION;
      await bloodDebt.save();
    } else if (mission.paymentType === MissionPaymentType.COINS) {
      const user = await User.findById(mission.assignedTo);
      user.coins += mission.coinsAmount;
      const transaction = new Transaction({
        userId: user._id,
        amount: mission.coinsAmount,
        description: TransactionDescription.MISSION_REWARD,
        type: TransactionType.INCOME,
        date: new Date(),
      });
      await transaction.save();
      await user.save();
    } else if (mission.paymentType === MissionPaymentType.BLOOD_DEBT_COLLECTION) {
      const bloodDebt = await BloodDebt.findOne({ paidMission: mission._id });
      if (bloodDebt.status !== BloodDebtStatus.COMPLETED) {
        return res.status(400).json({ message: "La misión no puede ser pagada" });
      }
      bloodDebt.status = BloodDebtStatus.PAID;
      await bloodDebt.save();
    }

    mission.status = MissionStatus.PAID;
    mission.paidAt = new Date();
    await mission.save();
    res.status(200).json({ message: "Misión pagada exitosamente" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al pagar la misión" });
  }
}

exports.rejectMissionEvidence = async (req, res) => {
  try {
    const mission = await Mission.findById(req.params.id);
    if (!mission) {
      return res.status(404).json({ message: "Misión no encontrada" });
    }

    if (mission.status !== MissionStatus.COMPLETED) {
      return res.status(400).json({ message: "La evidencia de la misión no puede ser rechazada" });
    }

    if (mission.createdBy.toString() !== req.userId) {
      return res.status(400).json({ message: "No puedes rechazar la evidencia de una misión que no creaste" });
    }

    const file = await FileModel.findById(mission.evidenceId);
    if (!file) {
      return res.status(404).json({ message: "Evidencia no encontrada" });
    }

    await FileModel.findByIdAndDelete(mission.evidenceId);
    mission.evidenceId = null;
    mission.status = MissionStatus.ASSIGNED;
    await mission.save();
    res.status(200).json({ message: "Evidencia rechazada exitosamente" });
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al rechazar la evidencia" });
  }
}
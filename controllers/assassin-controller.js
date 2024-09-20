const User = require('../models/user');
const Transaction = require('../models/transaction');
const FileModel = require('../models/file');
const bcrypt = require('bcrypt');
const z = require('zod');
const { UserRole, UserStatus, Configuration, TransactionDescription, TransactionType, BloodDebtStatus } = require('../shared/constants');
const mailController = require('./mail-controller');
const { toObjectId } = require('../shared/utils');
const { fileValidator } = require('../shared/validators');
const Mission = require("../models/mission");
const bloodDebt = require('../models/blood-debt');

exports.createAssassin = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string({ required_error: "El email es obligatorio" }).email({ message: "El email no es válido" }),
      name: z.string({ required_error: "El nombre es obligatorio" }),
      alias: z.string({ required_error: "El pseudónimo es obligatorio" }),
      country: z.string({ required_error: "El país es obligatorio" }),
      address: z.string({ required_error: "La dirección es obligatoria" }),
      profilePicture: fileValidator(),
    });

    schema.parse({ ...req.body, profilePicture: req.file });

    const { email, name, alias, country, address } = req.body;

    const existingEmail = await User.findOne({ email: email.toLowerCase() });
    if (existingEmail) {
      return res.status(400).json({ message: "El email ya está en uso" });
    }

    const existingAlias = await User.findOne({ alias });
    if (existingAlias) {
      return res.status(400).json({ message: "El pseudónimo ya está en uso" });
    }

    const password = Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(password, 10);

    const file = new FileModel(req.file);
    const savedFile = await file.save();

    const user = new User({
      name,
      alias,
      country,
      address,
      email: email.toLowerCase(),
      password: hashedPassword,
      role: UserRole.ASSASSIN,
      profilePictureId: savedFile._id,
    });

    await user.save();

    await mailController.send(user.email,
      'Bienvenido a la comunidad de asesinos',
      `Hola ${user.name}, tu contraseña es: ${password}`,
      `Hola <b>${user.name}</b>, tu contraseña es: <b>${password}</b>`
    );
    res.status(201).json({ message: "Asesino creado exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al crear el asesino" });
  }
}

exports.updateAssassin = async (req, res) => {
  try {
    const schema = z.object({
      name: z.string({ required_error: "El nombre es obligatorio" }),
      alias: z.string({ required_error: "El pseudónimo es obligatorio" }),
      country: z.string({ required_error: "El país es obligatorio" }),
      address: z.string({ required_error: "La dirección es obligatoria" }),
      profilePicture: fileValidator().optional(),
    });

    schema.parse({ ...req.body, profilePicture: req.file });

    const { name, alias, country, address } = req.body;

    const existingAlias = await User.findOne({ alias, _id: { $ne: toObjectId(req.params.id) } });
    if (existingAlias) {
      return res.status(400).json({ message: "El pseudónimo ya está en uso" });
    }

    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    if (req.file) {
      const file = new FileModel(req.file);
      const savedFile = await file.save();

      if (user.profilePictureId) {
        await FileModel.findByIdAndDelete(user.profilePictureId);
      }

      user.profilePictureId = savedFile._id;
    }

    user.name = name;
    user.alias = alias;
    user.country = country;
    user.address = address;

    await user.save();

    res.status(201).json({ message: "Asesino actualizado exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el asesino" });
  }
}

exports.updateAssassinStatus = async (req, res) => {
  try {
    const schema = z.object({
      status: z.string({ required_error: "El estado es obligatorio" })
        .refine((status) => Object.values(UserStatus).includes(status), { message: "Estado inválido" }),
    });

    schema.parse(req.body);

    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    user.status = req.body.status;
    await user.save();

    res.status(201).json({ message: "Estado del asesino actualizado exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el estado del asesino" });
  }
}

exports.listAssassins = async (req, res) => {
  try {
    const filters = {
      role: UserRole.ASSASSIN,
    };

    let assassins;

    if (req.query.alias) {
      filters.alias = { $regex: req.query.alias, $options: 'i' };
    }

    if (req.role === UserRole.ADMIN) {
      if (req.query.country) {
        filters.country = { $regex: req.query.country, $options: 'i' };
      }
      if (req.query.name) {
        filters.name = { $regex: req.query.name, $options: 'i' };
      }
      if (req.query.email) {
        filters.email = { $regex: req.query.email, $options: 'i' };
      }
      if (req.query.address) {
        filters.address = { $regex: req.query.address, $options: 'i' };
      }
      if (req.query.status) {
        filters.status = req.query.status;
      }

      assassins = await User.find(filters, {
        _id: 1,
        email: 1,
        name: 1,
        alias: 1,
        country: 1,
        address: 1,
        status: 1,
      });
    } else {
      filters.status = UserStatus.ACTIVE;
      filters._id = { $ne: toObjectId(req.userId) };

      const user = await User.findById(req.userId);
      const assassinInformationBought = user.assassinInformationBought;

      assassins = await User.aggregate([
        {
          $match: filters,
        },
        {
          $project: {
            _id: 1,
            name: 1,
            alias: 1,
            country: 1,
            isPurchased: {
              $in: ["$_id", assassinInformationBought],
            },
          },
        },
        {
          $project: {
            _id: 1,
            name: {
              $cond: {
                if: "$isPurchased",
                then: "$name",
                else: {
                  $literal: "???",
                },
              },
            },
            alias: 1,
            country: 1,
            isPurchased: 1,
          },
        },
        {
          $sort: { name: 1 },
        }
      ]);
    }


    res.status(200).json(assassins);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al listar los asesinos" });
  }
}

exports.purchaseAssassinInformation = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(400).json({ message: "Usuario no encontrado" });
    }

    const schema = z.object({
      assassinId: z.string({ required_error: "El ID del asesino al cual se le desea comprar la información es obligatorio" }),
    });
    schema.parse({ assassinId: req.params.id });

    const assassinId = req.params.id;
    if (assassinId === req.userId) {
      return res.status(400).json({ message: "No puedes comprar tu propia información" });
    }

    if (user.assassinInformationBought.includes(assassinId)) {
      return res.status(400).json({ message: "Ya has comprado la información de este asesino" });
    }

    if (user.coins < Configuration.INFORMATION_PRICE) {
      return res.status(400).json({ message: "No cuentas con suficientes monedas para comprar la información del asesino" });
    }

    user.assassinInformationBought.push(assassinId);
    user.coins -= Configuration.INFORMATION_PRICE;

    const transaction = new Transaction({
      userId: req.userId,
      amount: -Configuration.INFORMATION_PRICE,
      description: TransactionDescription.INFORMATION_PURCHASE,
      type: TransactionType.OUTCOME,
      date: new Date(),
    });
    await user.save();
    await transaction.save();

    res.status(200).json({ message: "Información del asesino comprada exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al comprar la información del asesino" });
  }
}

exports.getAssassinById = async (req, res) => {
  try {
    const schema = z.object({
      id: z.string({ required_error: "El ID del asesino es obligatorio" }),
    });
    schema.parse(req.params);

    let project = {
      _id: 1,
      name: 1,
      alias: 1,
      country: 1,
      address: 1,
      email: 1,
      coins: 1,
      status: 1,
      profilePicture: 1,
    };

    if (req.role === UserRole.ASSASSIN) {
      const user = await User.findById(req.userId);
      if (!user.assassinInformationBought.includes(req.params.id)) {
        return res.status(400).json({ message: "No has comprado la información de este asesino" });
      }
      project = {
        _id: 1,
        name: 1,
        alias: 1,
        country: 1,
        address: 1,
        profilePicture: 1,
      }
    }

    const assassin = await User.aggregate([
      {
        $match: {
          _id: toObjectId(req.params.id),
        },
      },
      {
        $lookup: {
          from: "files",
          localField: "profilePictureId",
          foreignField: "_id",
          as: "profilePicture",
        },
      },
      {
        $unwind: "$profilePicture",
      },
      {
        $project: project,
      },
    ]);

    return res.status(200).json(assassin[0]);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al obtener el asesino" });
  }
}

exports.getAssassinMissions = async (req, res) => {
  try {
    const missions = await Mission.aggregate([
      {
        $match: {
          assignedTo: toObjectId(req.params.id),
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
        $project: {
          _id: 1,
          description: 1,
          status: 1,
          createdBy: "$createdBy.name",
        },
      }
    ]);

    res.status(200).json(missions);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al obtener las misiones del asesino" });
  }
}

exports.getAssassinDebts = async (req, res) => {
  try {
    const debtsToPay = await bloodDebt.aggregate([
      {
        $match: {
          createdBy: toObjectId(req.params.id),
          status: BloodDebtStatus.PENDING,
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "paidTo",
          foreignField: "_id",
          as: "paidTo",
        },
      },
      {
        $unwind: {
          path: "$paidTo",
          preserveNullAndEmptyArrays: true,
        }
      },
      {
        $project: {
          _id: 1,
          missionId: "$createdMission",
          paidTo: {
            $cond: {
              if: "$paidTo",
              then: {
                _id: "$paidTo._id",
                name: "$paidTo.name",
              },
              else: null,
            },
          },
        },
      }
    ]);

    const debtsToCollect = await bloodDebt.aggregate([
      {
        $match: {
          paidTo: toObjectId(req.params.id),
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
        $project: {
          _id: 1,
          missionId: "$createdMission",
          paidTo: {
            $cond: {
              if: "$createdBy",
              then: {
                _id: "$createdBy._id",
                name: "$createdBy.name",
              },
              else: null,
            },
          },
        },
      }
    ]);

    res.status(200).json({ debtsToPay, debtsToCollect });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al obtener las deudas del asesino" });
  }
}

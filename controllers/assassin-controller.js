const User = require('../models/user');
const Transaction = require('../models/transaction');
const FileModel = require('../models/file');
const bcrypt = require('bcrypt');
const z = require('zod');
const { UserRole, UserStatus, Configuration, TransactionDescription, TransactionType } = require('../shared/constants');
const mailController = require('./mail-controller');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;
const { fileValidator } = require('../shared/validators');

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
      return res.status(400).send("El email ya está en uso");
    }

    const existingAlias = await User.findOne({ alias });
    if (existingAlias) {
      return res.status(400).send("El pseudónimo ya está en uso");
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
    res.status(201).send("Asesino creado exitosamente");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send(error.errors);
    }
    console.error(error);
    res.status(500).send("Error al crear el asesino");
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
      filters._id = { $ne: ObjectId.createFromHexString(req.userId) };

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
      ]);
    }


    res.status(200).json(assassins);
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al listar los asesinos");
  }
}

exports.purchaseAssassinInformation = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(400).send("Usuario no encontrado");
    }

    const schema = z.object({
      assassinId: z.string({ required_error: "El ID del asesino al cual se le desea comprar la información es obligatorio" }),
    });
    schema.parse(req.body);

    if (req.body.assassinId === req.userId) {
      return res.status(400).send("No puedes comprar tu propia información");
    }

    if (user.assassinInformationBought.includes(req.body.assassinId)) {
      return res.status(400).send("Ya has comprado la información de este asesino");
    }

    if (user.coins < Configuration.INFORMATION_PRICE) {
      return res.status(400).send("No cuentas con suficientes monedas para comprar la información del asesino");
    }

    user.assassinInformationBought.push(req.body.assassinId);
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

    res.status(200).send("Información del asesino comprada exitosamente");
  } catch (error) {
    console.error(error);
    res.status(500).send("Error al comprar la información del asesino");
  }
}

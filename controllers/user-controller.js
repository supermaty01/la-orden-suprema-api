const User = require('../models/user');
const bcrypt = require('bcrypt');
const z = require('zod');
const jwt = require('jsonwebtoken');
const mailController = require('./mail-controller');
const { UserStatus } = require('../shared/constants');
const { fileValidator } = require('../shared/validators');
const crypto = require('crypto');
const mongoose = require('mongoose');
const { ObjectId } = mongoose.Types;

exports.login = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    schema.parse(req.body);
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "El email no se encuentra registrado" });
    }
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(400).json({ message: "La contraseña no es válida" });
    }
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).json({ message: "El usuario no está activo" });
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.status(200).json({ token });
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al iniciar sesión" });
  }
}

exports.forgotPassword = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
    });
    schema.parse(req.body);
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "El email no se encuentra registrado" });
    }
    const code = Math.floor(100000 + Math.random() * 900000);
    user.resetPasswordCode = code.toString();
    await user.save();
    await mailController.send(user.email, 'Código de recuperación de contraseña', `Su código de recuperación de contraseña es: ${code}`, `Su código de recuperación de contraseña es: <b>${code}</b>`);
    res.status(200).json({ message: "Código de recuperación de contraseña enviado" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    } else {
      console.error(error);
      res.status(500).json({ message: "Error al solicitar la recuperación de contraseña" });
    }
  }
}

exports.forgotPasswordCode = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      code: z.string().length(6),
    });
    schema.parse(req.body);
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "El email no se encuentra registrado" });
    }
    if (user.resetPasswordCode !== req.body.code) {
      return res.status(400).json({ message: "El código no es válido" });
    }
    const token = crypto.randomBytes(32).toString('hex');

    user.resetPasswordToken = await bcrypt.hash(token, 10);
    user.resetPasswordCode = null;
    await user.save();
    res.status(200).json({ message: "Código de recuperación de contraseña correcto", resetToken: token });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    } else {
      console.error(error);
      res.status(500).json({ message: "Error al verificar el código de recuperación de contraseña" });
    }
  }
}

exports.forgotPasswordReset = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
      token: z.string(),
    });
    schema.parse(req.body);
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(400).json({ message: "El email no se encuentra registrado" });
    }
    if (!user.resetPasswordToken) {
      return res.status(400).json({ message: "No se ha solicitado la recuperación de contraseña" });
    }
    const validToken = await bcrypt.compare(req.body.token, user.resetPasswordToken);
    if (!validToken) {
      return res.status(400).json({ message: "El token no es válido" });
    }
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordCode = null;
    user.resetPasswordToken = null;
    await user.save();
    res.status(200).json({ message: "Contraseña actualizada correctamente" });
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al actualizar la contraseña" });
  }
}

exports.getProfile = async (req, res) => {
  try {
    const user = await User.aggregate([
      {
        $match: {
          _id: ObjectId.createFromHexString(req.userId),
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
        $unwind: {
          path: "$profilePicture",
          preserveNullAndEmptyArrays: true,
        },
      },
      {
        $project: {
          _id: 1,
          name: 1,
          alias: 1,
          country: 1,
          address: 1,
          email: 1,
          role: 1,
          profilePicture: 1,
        },
      },
    ]);

    res.status(200).json(user[0]);
  }
  catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error al obtener el perfil del usuario" });
  }
}

exports.updateProfile = async (req, res) => {
  try {
    const schema = z.object({
      country: z.string({ required_error: "El país es obligatorio" }),
      address: z.string({ required_error: "La dirección es obligatoria" }),
      profilePicture: fileValidator().optional(),
    });

    schema.parse({ ...req.body, profilePicture: req.file });

    const { country, address } = req.body;

    const user = await User.findById(req.userId);

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

    user.country = country;
    user.address = address;

    await user.save();

    res.status(201).json({ message: "Perfil actualizado exitosamente" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    console.error(error);
    res.status(500).json({ message: "Error al actualizar el perfil" });
  }
}
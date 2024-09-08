const User = require('../models/user');
const bcrypt = require('bcrypt');
const z = require('zod');
const jwt = require('jsonwebtoken');
const mailController = require('./mail-controller');
const { UserStatus } = require('../shared/constants');

exports.login = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    schema.parse(req.body);
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(400).send("El email no se encuentra registrado");
    }
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(400).send("La contraseña no es válida");
    }
    if (user.status !== UserStatus.ACTIVE) {
      return res.status(403).send("El usuario no está activo");
    }
    const token = jwt.sign({ userId: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.status(200).send(token);
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send(error.errors);
    }
    console.error(error);
    res.status(500).send("Error al iniciar sesión");
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
      return res.status(400).send("El email no se encuentra registrado");
    }
    const code = Math.floor(100000 + Math.random() * 900000);
    user.resetPasswordCode = code.toString();
    await user.save();
    await mailController.send(user.email, 'Código de recuperación de contraseña', `Su código de recuperación de contraseña es: ${code}`, `Su código de recuperación de contraseña es: <b>${code}</b>`);
    res.status(200).send("Código de recuperación de contraseña enviado");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send(error.errors);
    } else {
      console.error(error);
      res.status(500).send("Error al solicitar la recuperación de contraseña");
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
      return res.status(400).send("El email no se encuentra registrado");
    }
    if (user.resetPasswordCode !== req.body.code) {
      return res.status(400).send("El código no es válido");
    }
    user.pendingReset = true;
    await user.save();
    res.status(200).send("Código de recuperación de contraseña correcto");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send(error.errors);
    } else {
      console.error(error);
      res.status(500).send("Error al verificar el código de recuperación de contraseña");
    }
  }
}

exports.forgotPasswordReset = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    schema.parse(req.body);
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(400).send("El email no se encuentra registrado");
    }
    if (!user.pendingReset) {
      return res.status(400).send("No se ha solicitado la recuperación de contraseña");
    }
    user.password = await bcrypt.hash(req.body.password, 10);
    user.resetPasswordCode = null;
    user.pendingReset = false;
    await user.save();
    res.status(200).send("Contraseña actualizada correctamente");
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send(error.errors);
    }
    console.error(error);
    res.status(500).send("Error al actualizar la contraseña");
  }
}
const User = require('../models/user');
const bcrypt = require('bcrypt');
const z = require('zod');
const UserRole = require('../shared/user-roles').UserRole;
const mailController = require('./mail-controller');

exports.createAssassin = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string({ required_error: "El email es obligatorio" }).email({ message: "El email no es válido" }),
      name: z.string({ required_error: "El nombre es obligatorio" }),
      alias: z.string({ required_error: "El pseudónimo es obligatorio" }),
      country: z.string({ required_error: "El país es obligatorio" }),
      address: z.string({ required_error: "La dirección es obligatoria" }),
    });
    schema.parse(req.body);

    const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).send("El email ya está en uso");
    }

    const password = Math.random().toString(36).slice(-8);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      email: req.body.email.toLowerCase(),
      name: req.body.name,
      alias: req.body.alias,
      country: req.body.country,
      address: req.body.address,
      password: hashedPassword,
      role: UserRole.ASSASSIN,
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
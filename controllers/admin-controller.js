const User = require('../models/user');
const bcrypt = require('bcrypt');
const z = require('zod');
const { UserRole } = require('../shared/constants');

exports.createAdmin = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string({ required_error: "El email es obligatorio" }).email({ message: "El email no es válido" }),
      name: z.string({ required_error: "El nombre es obligatorio" }),
      password: z.string({ required_error: "La contraseña es obligatoria " }).min(8, "La contraseña debe tener al menos 8 caracteres"),
    });
    schema.parse(req.body);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).send("El email ya está en uso");
    }
    const user = new User({
      email: req.body.email.toLowerCase(),
      name: req.body.name,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    await user.save();
    res.status(201).send("Administador creado exitosamente");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send(error.errors);
    }
    console.error(error);
    res.status(500).send("Error al crear el administrador");
  }
}
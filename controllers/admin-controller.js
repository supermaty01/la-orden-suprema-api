const User = require('../models/user');
const bcrypt = require('bcrypt');
const z = require('zod');
const UserRole = require('../shared/user-roles').UserRole;

exports.createAdmin = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      name: z.string(),
      password: z.string().min(8),
    });
    schema.parse(req.body);
    const hashedPassword = await bcrypt.hash(req.body.password, 10);
    const existingUser = await User.findOne({ email: req.body.email.toLowerCase() });
    if (existingUser) {
      return res.status(400).send("User already exists");
    }
    const user = new User({
      email: req.body.email.toLowerCase(),
      name: req.body.name,
      password: hashedPassword,
      role: UserRole.ADMIN,
    });
    await user.save();
    res.status(201).send("Admin created successfully");
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send(error.errors);
    }
    console.error(error);
    res.status(500).send("Internal server error");
  }
}
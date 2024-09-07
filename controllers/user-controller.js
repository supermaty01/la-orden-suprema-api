const User = require('../models/user');
const bcrypt = require('bcrypt');
const z = require('zod');
const jwt = require('jsonwebtoken');

exports.login = async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(8),
    });
    schema.parse(req.body);
    const user = await User.findOne({ email: req.body.email.toLowerCase() });
    if (!user) {
      return res.status(400).send("User not found");
    }
    const validPassword = await bcrypt.compare(req.body.password, user.password);
    if (!validPassword) {
      return res.status(400).send("Invalid password");
    }
    const token = jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: '1h',
    });
    res.status(200).send(token);
  }
  catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).send(error.errors);
    }
    console.error(error);
    res.status(500).send("Internal server error");
  }
}
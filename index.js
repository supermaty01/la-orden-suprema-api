const express = require('express');
const testRouter = require('./routes/test');
const adminsRouter = require('./routes/admins');
const loginRouter = require('./routes/login');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

mongoose.connect(process.env.MONGO_URL);

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/test', testRouter);
app.use('/admins', adminsRouter);
app.use('/login', loginRouter);
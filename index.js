const express = require('express');
const adminsRouter = require('./routes/admins');
const indexRouter = require('./routes/index');
const assassinsRouter = require('./routes/assassins');
const transactionsRouter = require('./routes/transactions');
const missionsRouter = require('./routes/missions');
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

app.use('', indexRouter);
app.use('/admins', adminsRouter);
app.use('/assassins', assassinsRouter);
app.use('/transactions', transactionsRouter);
app.use('/missions', missionsRouter);
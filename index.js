const express = require('express');
const adminsRouter = require('./routes/admins');
const indexRouter = require('./routes/index');
const assassinsRouter = require('./routes/assassins');
const transactionsRouter = require('./routes/transactions');
const missionsRouter = require('./routes/missions');
const bloodDebtRouter = require('./routes/blood-debts');
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

app.all('*', function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization,X-Requested-With,Origin,Accept');
  res.header('Access-Control-Allow-Credentials', true);

  if ('OPTIONS' == req.method) {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.use('', indexRouter);
app.use('/admins', adminsRouter);
app.use('/assassins', assassinsRouter);
app.use('/transactions', transactionsRouter);
app.use('/missions', missionsRouter);
app.use('/blood-debts', bloodDebtRouter);
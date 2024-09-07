const nodemailer = require('nodemailer')

exports.send = async function (to, subject, text, html) {
  const transporterConfig = {
    host: process.env.SMTP_SERVER,
    port: process.env.SMTP_PORT ? process.env.SMTP_PORT :
      process.env.SMTP_SECURE === 'true' ? 465 : 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  };

  const transporter = nodemailer.createTransport(transporterConfig);

  const mailOptions = {
    from: process.env.SMTP_FROM, // sender address (who sends)
    to: to, // list of receivers (who receives)
    cc: process.env.SMTP_FROM,
    subject: subject, // Subject line
    text: text, // plaintext body
    html: html // html body
  };

  // send mail with defined transport object
  await transporter.sendMail(mailOptions);
}
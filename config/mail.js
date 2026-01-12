// config/mail.js

const nodemailer = require("nodemailer");
const hbs = require("nodemailer-express-handlebars").default;
const path = require("path");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false, // true for 465
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Register Handlebars plugin
transporter.use(
  "compile",
  hbs({
    viewEngine: {
      extname: ".hbs",
      layoutsDir: path.join(__dirname, "../views/email/layouts"),
      defaultLayout: false,
      partialsDir: path.join(__dirname, "../views/email/partials"),
    },
    viewPath: path.join(__dirname, "../views/email"),
    extName: ".hbs",
  })
);

module.exports = transporter;

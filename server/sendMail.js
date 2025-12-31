require('dotenv').config();
console.log('SMTP_HOST:', process.env.SMTP_HOST);
const nodemailer = require('nodemailer');

// Configure your SMTP transport here
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
  secure: false, // true for 465, false for other ports
  // proxy: 'http://cso.proxy.att.com:8888',
  auth: {
    user: process.env.SMTP_USER || 'your@email.com',
    pass: process.env.SMTP_PASS || 'yourpassword',
  },
});

async function sendMail({ to, subject, text, html }) {
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@example.com',
    to,
    subject,
    text,
    html,
  });
  return info;
}

module.exports = sendMail;

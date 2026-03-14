const nodemailer = require('nodemailer');

const transport = nodemailer.createTransport({
  host:   process.env.SMTP_HOST,
  port:   Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const from = process.env.EMAIL_FROM || '"MedTrust" <noreply@medtrust.in>';

const send = (to, subject, html) =>
  transport.sendMail({ from, to, subject, html });

exports.sendWelcome = (email, name) =>
  send(email, 'Welcome to MedTrust 🏥', `
    <h2>Hi ${name},</h2>
    <p>Welcome to <strong>MedTrust</strong> — where every donation is fully transparent.</p>
    <p>You can now browse campaigns and start making a difference.</p>
  `);

exports.sendDonationReceipt = (email, name, amount, campaignTitle) =>
  send(email, `Receipt: ₹${amount} donation`, `
    <h2>Thank you, ${name}!</h2>
    <p>Your donation of <strong>₹${amount}</strong> to <em>${campaignTitle}</em> has been received.</p>
    <p>You can track how your money is used on your dashboard.</p>
  `);

exports.sendCampaignApproved = (email, name, title) =>
  send(email, '✅ Your campaign is now live!', `
    <h2>Great news, ${name}!</h2>
    <p>Your campaign <strong>${title}</strong> has been verified and is now live on MedTrust.</p>
    <p>Donors can now find and support your cause.</p>
  `);

exports.sendCampaignRejected = (email, name, title, reason) =>
  send(email, 'Campaign verification update', `
    <h2>Hi ${name},</h2>
    <p>Unfortunately your campaign <strong>${title}</strong> could not be verified at this time.</p>
    <p><strong>Reason:</strong> ${reason}</p>
    <p>Please contact support if you believe this is an error.</p>
  `);

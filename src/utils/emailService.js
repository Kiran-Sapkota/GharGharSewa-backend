const nodemailer = require("nodemailer");
const {
  otpEmail,
  providerPendingEmail,
  providerApprovedEmail,
  newBookingProviderEmail,
  newBookingUserEmail,
  newReviewProviderEmail,
} = require("./emailTemplates");

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  const user = process.env.GMAIL_USER || process.env.SMTP_USER;
  const pass = process.env.GMAIL_PASSWORD || process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn("Email not configured: set GMAIL_USER and GMAIL_PASSWORD in .env");
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.gmail.com",
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === "true",
    auth: { user, pass },
  });

  return transporter;
};

const sendMail = async ({ to, subject, html, text }) => {
  const transport = getTransporter();
  if (!transport) {
    console.warn(`Email skipped (no SMTP): ${subject} -> ${to}`);
    return false;
  }

  const from =
    process.env.EMAIL_FROM ||
    `"GharGhar Sewa" <${process.env.GMAIL_USER || process.env.SMTP_USER}>`;

  await transport.sendMail({ from, to, subject, html, text });
  return true;
};

const sendOtpEmail = (to, code, purpose) =>
  sendMail({
    to,
    subject:
      purpose === "password_reset"
        ? "Reset your GharGhar Sewa password"
        : "Verify your GharGhar Sewa account",
    html: otpEmail(code, purpose),
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
  });

const sendProviderPendingEmail = (to, name) =>
  sendMail({
    to,
    subject: "Provider application received — pending approval",
    html: providerPendingEmail(name),
    text: `Hi ${name}, your provider application is under admin review.`,
  });

const sendProviderApprovedEmail = (to, name) =>
  sendMail({
    to,
    subject: "Your GharGhar Sewa provider account is approved",
    html: providerApprovedEmail(name),
    text: `Hi ${name}, you are now approved and can receive bookings.`,
  });

const sendNewBookingEmails = async ({ providerEmail, providerName, userEmail, userName, booking }) => {
  const dateStr = new Date(booking.bookingDate).toLocaleString();
  await Promise.all([
    sendMail({
      to: providerEmail,
      subject: "New booking request on GharGhar Sewa",
      html: newBookingProviderEmail(providerName, userName, booking, dateStr),
      text: `New booking from ${userName} for ${booking.serviceCategory} on ${dateStr}.`,
    }),
    sendMail({
      to: userEmail,
      subject: "Booking confirmed — GharGhar Sewa",
      html: newBookingUserEmail(userName, providerName, booking, dateStr),
      text: `Your booking with ${providerName} is confirmed for ${dateStr}.`,
    }),
  ]);
};

const sendNewReviewEmail = (to, providerName, rating, comment) =>
  sendMail({
    to,
    subject: "You received a new review",
    html: newReviewProviderEmail(providerName, rating, comment),
    text: `New ${rating}-star review: ${comment}`,
  });

const notifyAdminNewProvider = async (providerName, providerEmail) => {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
  if (!adminEmail) return;
  await sendMail({
    to: adminEmail,
    subject: "New provider awaiting approval",
    html: `<p>Provider <strong>${providerName}</strong> (${providerEmail}) submitted a profile and needs approval.</p>`,
    text: `New provider ${providerName} (${providerEmail}) needs approval.`,
  });
};

module.exports = {
  sendOtpEmail,
  sendProviderPendingEmail,
  sendProviderApprovedEmail,
  sendNewBookingEmails,
  sendNewReviewEmail,
  notifyAdminNewProvider,
};

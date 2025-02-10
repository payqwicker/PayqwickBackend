const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, html) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,  // Example: smtp.gmail.com
      port: process.env.SMTP_PORT || 587,  
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for 587
      auth: {
        user: process.env.SMTP_USER, // Your email
        pass: process.env.SMTP_PASS, // App password
      },
    });

    const mailOptions = {
      from: `"Fintech App" <${process.env.SMTP_USER}>`, // Sender
      to, // Recipient(s)
      subject,
      text, // Plain text version
      html, // HTML version
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent:", info.messageId);
    return info;
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
};

module.exports = sendEmail;


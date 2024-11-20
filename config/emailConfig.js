const nodemailer = require("nodemailer");
const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail(to, subj, text, html) {
    if (!to || !subj || !text) return;
    const info = await transporter.sendMail({
        from: "E-Learning App",
        to: to,
        subject: subj,
        text: text,
        html: html || text,
    });

    console.log("Message sent: %s", info.messageId);
}

module.exports = sendEmail;

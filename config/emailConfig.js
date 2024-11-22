const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");

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
        from: "E-Learning App <" + process.env.EMAIL_USER + ">",
        to: to,
        subject: subj,
        text: text,
        html: html || text,
    });

    console.log("Message sent: %s", info.messageId);
}

function getEmailHtml(verificationCode) {
    const templatePath = path.join(
        __dirname,
        "../public/verify-email-template.html"
    );
    let html = fs.readFileSync(templatePath, "utf-8");

    // Split the verification code into individual digits
    const digits = verificationCode.toString().split("");
    digits.forEach((digit, index) => {
        html = html.replace(`{{vc${index}}}`, digit);
    });

    return html;
}

module.exports = {
    sendEmail,
    getEmailHtml,
};

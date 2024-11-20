const { StatusCodes } = require("http-status-codes");
const sendEmail = require("../config/emailConfig");
const { randomBetween } = require("../utils");
const { BadRequestError } = require("../errors");

const verifyEmail = (req, res) => {
    if (req.user.isEmailVerified) {
        throw new BadRequestError("Email is already verified");
    }
    const { code } = req.body;
    const { emailVerificationCode } = req.user;

    if (
        !code ||
        !emailVerificationCode ||
        parseInt(emailVerificationCode) !== parseInt(code)
    ) {
        throw new BadRequestError("Invalid verification code");
    }

    req.user.isEmailVerified = true;
    req.user.emailVerificationCode = null;
    req.user.save();

    res.status(StatusCodes.OK).json({
        success: true,
        msg: "Email verified successfully",
    });
};

const sendEmailVerificationCode = async (req, res) => {
    if (req.user.isEmailVerified) {
        return res.status(StatusCodes.BAD_REQUEST).json({
            success: false,
            msg: "Email is already verified",
        });
    }
    const { email, emailVerificationCode } = req.user;
    const code = emailVerificationCode || randomBetween(100000, 999999);

    try {
        console.log(emailVerificationCode);

        console.log("sending email");
        await sendEmail(
            email,
            `E-Learning App verification code: ${code}`,
            `Email verification code: ${code}`
        );
        req.user.emailVerificationCode = code;
        req.user.save();
        res.status(StatusCodes.OK).json({
            success: true,
            msg: "Verification code sent successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: "Failed to send verification code",
        });
    }
};

module.exports = {
    verifyEmail,
    sendEmailVerificationCode,
};

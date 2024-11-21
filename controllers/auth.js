const jwt = require("jsonwebtoken");
const User = require("../models/User");

const { StatusCodes } = require("http-status-codes");

const {
    BadRequestError,
    UnauthenticatedError,
    NotFoundError,
} = require("../errors");
const { randomBetween } = require("../utils");
const sendEmail = require("../config/emailConfig");

const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        throw new BadRequestError("Please provide email and password");
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new UnauthenticatedError("Invalid Credentials");
    }
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
        throw new UnauthenticatedError("Invalid Credentials");
    }
    res.status(StatusCodes.OK).json({
        user: user.getData(),
        accessToken: user.createAccessToken(),
    });
};

const register = async (req, res) => {
    console.log(req.body);
    const userData = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        phone: req.body.phone,
    };
    const user = await User.create(userData);

    res.status(StatusCodes.CREATED).json({
        user: user.getData(),
        accessToken: user.createAccessToken(),
    });
};

const sendResetPasswordCode = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new BadRequestError("Please provide email");
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new NotFoundError(`No user with email ${email}`);
    }
    const resetPasswordCode =
        user.resetPasswordCode || randomBetween(100000, 999999);
    try {
        await sendEmail(
            user.email,
            `E-Learning App reset password code: ${resetPasswordCode}`,
            `reset password code: ${resetPasswordCode}`
        );
        if (!user.resetPasswordCode) {
            user.resetPasswordCode = resetPasswordCode;
            user.save();
        }
    } catch (error) {
        throw new res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            msg: "Failed to send verification code",
        });
    }

    console.log(user.resetPasswordCode);

    res.status(StatusCodes.OK).json({
        success: true,
        msg: "Reset password code sent to your email",
    });
};

const resetPassword = async (req, res) => {
    const { email, code, newPassword } = req.body;
    if (!email || !code || !newPassword) {
        throw new BadRequestError(
            "Please provide email, code and new password"
        );
    }
    const user = await User.findOne({ email });
    if (!user) {
        throw new NotFoundError(`No user with email ${email}`);
    }
    if (parseInt(user.resetPasswordCode) != parseInt(code)) {
        throw new BadRequestError("Invalid code");
    }
    if (newPassword.length < 10) {
        throw new BadRequestError("Password must be at least 10 characters");
    }
    user.password = newPassword;
    user.resetPasswordCode = null;
    await user.save();
    res.status(StatusCodes.OK).json({
        success: true,
        msg: "Password reset successfully",
    });
};

module.exports = {
    login,
    register,
    sendResetPasswordCode,
    resetPassword,
};

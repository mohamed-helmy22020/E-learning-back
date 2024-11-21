const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const handleUpload = require("../config/cloudinary");
const { UnauthenticatedError } = require("../errors");
const cloudinary = require("cloudinary").v2;

const getUserData = async (req, res) => {
    const user = req.user;
    res.status(StatusCodes.OK).json({
        user: user.getData(),
    });
};

const updateUserData = async (req, res) => {
    const user = req.user;
    const { name, email, newPassword, phone, currentPassword } = req.body;
    const { file: profilePicture } = req;
    const isPasswordCorrect = currentPassword
        ? await user.comparePassword(currentPassword)
        : false;

    const userData = {};

    if (name) {
        userData.name = name;
    }
    if (email) {
        if (!isPasswordCorrect) {
            throw new UnauthenticatedError("Current password is incorrect");
        }
        userData.email = email;
    }
    if (phone) {
        userData.phone = phone;
    }
    if (currentPassword && newPassword) {
        if (!isPasswordCorrect) {
            throw new UnauthenticatedError("Current password is incorrect");
        }
        userData.password = newPassword;
    }

    if (profilePicture) {
        try {
            const b64 = Buffer.from(profilePicture.buffer).toString("base64");
            let dataURI = "data:" + profilePicture.mimetype + ";base64," + b64;
            const cldRes = await handleUpload(
                dataURI,
                `profile_picture_${user._id}`,
                "profile_pictures"
            );
            userData.userProfileImage = cldRes.secure_url;
        } catch (error) {
            throw new Error(error);
        }
    }

    const updatedUser = await User.findByIdAndUpdate(user._id, userData, {
        new: true,
        runValidators: true,
    });

    res.status(StatusCodes.OK).json({
        user: updatedUser.getData(),
    });
};

module.exports = {
    getUserData,
    updateUserData,
};

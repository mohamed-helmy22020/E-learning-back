const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { UnauthenticatedError } = require("../errors");
const { handleUploadFromBuffer } = require("../config/cloudinary");

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
    console.log(profilePicture);

    const isPasswordCorrect = currentPassword
        ? await user.comparePassword(currentPassword)
        : false;

    const userData = {};

    if (name) {
        userData.name = name;
    }

    if (email || newPassword || phone) {
        if (!isPasswordCorrect) {
            throw new UnauthenticatedError("current password is incorrect");
        }
        if (email) userData.email = email;
        if (phone) userData.phone = phone;
        if (newPassword)
            userData.password = await user.encryptPassword(newPassword);
    }

    if (profilePicture) {
        try {
            const cldRes = await handleUploadFromBuffer(profilePicture, {
                public_id: `profile_picture_${user._id}`,
                folder: "profile_pictures",
            });
            userData.userProfileImage = cldRes.secure_url;
        } catch (error) {
            console.log(error);
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

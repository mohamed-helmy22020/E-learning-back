const { StatusCodes } = require("http-status-codes");
const User = require("../models/User");
const { UnauthenticatedError } = require("../errors");
const { handleUploadPicFromBuffer } = require("../config/cloudinary");
const Course = require("../models/Course");

const getUserData = async (req, res) => {
    const user = req.user;
    res.status(StatusCodes.OK).json({ success: true, user: user.getData() });
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
            const cldRes = await handleUploadPicFromBuffer(profilePicture, {
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
        success: true,
        user: updatedUser.getData(),
    });
};

const getUploadedCourses = async (req, res) => {
    const user = req.user;
    let courses = Course.find({ instructorId: user._id });
    courses = await courses.sort("-createdAt");
    res.status(StatusCodes.OK).json({
        success: true,
        courses: courses.map((course) => {
            return {
                ...course.getData(),
                instructorDetails: {
                    name: user.name,
                    userProfileImage: user.userProfileImage,
                },
            };
        }),
        nbHits: courses.length,
    });
};

const getEnrolledCourses = async (req, res) => {
    const user = req.user;
    let courses = Course.find({ _id: { $in: user.enrolledCourses } }).populate(
        "instructorId",
        "name userProfileImage"
    );
    courses = await courses.sort("-createdAt");
    res.status(StatusCodes.OK).json({
        success: true,
        courses: courses.map((course) => {
            const { instructorId, ...rest } = {
                ...course.getData(),
                instructorDetails: course.instructorId,
                isFav: user.favCourses.includes(course._id),
            };
            return rest;
        }),
        nbHits: courses.length,
    });
};

module.exports = {
    getUserData,
    updateUserData,
    getUploadedCourses,
    getEnrolledCourses,
};

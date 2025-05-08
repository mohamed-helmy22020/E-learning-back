const { StatusCodes } = require("http-status-codes");
const Notification = require("../models/Notification");
const {
    BadRequestError,
    NotFoundError,
    UnauthenticatedError,
} = require("../errors");
const { isValidObjectId } = require("mongoose");

const getAllNotifications = async (req, res) => {
    const user = req.user;

    const notifications = (
        await Notification.find({
            recipient: user._id,
        })
            .populate("course", "title picture students")
            .populate("lecture", "title thumbnailUrl")
    ).map((n) => n.getData());
    return res.status(StatusCodes.OK).json({
        success: true,
        notifications,
    });
};

const seeNotification = async (req, res) => {
    const user = req.user;
    const { notificationId } = req.params;
    if (!notificationId || !isValidObjectId(notificationId)) {
        throw new BadRequestError("Please provide valid notification id");
    }
    const notification = await Notification.findById(notificationId);
    if (!notification) {
        throw new NotFoundError("No notification with this id");
    }
    if (notification.recipient.toString() !== user._id.toString()) {
        throw new UnauthenticatedError(
            "You can only change your notifications"
        );
    }

    notification.seen = true;
    notification.save();
    res.status(StatusCodes.OK).json({
        success: true,
    });
};

const seeAllNotifications = async (req, res) => {
    const user = req.user;
    await Notification.updateMany(
        {
            recipient: user._id,
            seen: false,
        },
        {
            seen: true,
        }
    );
    return res.status(StatusCodes.OK).json({ success: true });
};

module.exports = {
    getAllNotifications,
    seeNotification,
    seeAllNotifications,
};

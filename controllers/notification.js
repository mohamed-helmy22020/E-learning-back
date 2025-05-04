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
            .populate("course", "title picture")
            .populate("lecture", "title thumbnailUrl")
    ).map((n) => n.getData());
    console.log(notifications);
    return res.status(StatusCodes.OK).json({
        success: true,
        notifications,
    });
};

const seeNotification = async (req, res) => {
    console.log("test1");
    const user = req.user;
    const { notificationId } = req.params;
    console.log({ notificationId });
    if (!notificationId || !isValidObjectId(notificationId)) {
        throw new BadRequestError("Please provide valid notification id");
    }
    console.log("test2");
    const notification = await Notification.findById(notificationId);
    if (!notification) {
        throw new NotFoundError("No notification with this id");
    }
    console.log("test3");
    if (notification.recipient.toString() !== user._id.toString()) {
        throw new UnauthenticatedError(
            "You can only change your notifications"
        );
    }

    notification.seen = true;
    notification.save();
    console.log("test4");
    res.status(StatusCodes.OK).json({
        success: true,
    });
};

module.exports = {
    getAllNotifications,
    seeNotification,
};

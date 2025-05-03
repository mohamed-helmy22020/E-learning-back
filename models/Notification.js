const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
    {
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        type: {
            type: String,
            enum: [
                "new_lecture", // Student gets notified
                "course_purchased", // Instructor gets notified
            ],
            required: true,
        },
        course: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Provide the course"],
        },

        lecture: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lecture",
        },
        count: {
            type: Number,
            default: 0,
        },
        seen: {
            type: Boolean,
            default: false,
        },
    },
    {
        timestamps: true,
    }
);
notificationSchema.methods.getData = function () {
    return {
        id: this._id,
        recipient: this.recipient,
        type: this.type,
        course: this.course,
        lecture: this.lecture,
        count: this.count,
        seen: this.seen,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
    };
};
module.exports = mongoose.model("Notification", notificationSchema);

const mongoose = require("mongoose");

const lectureSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Please provide title"],
        },
        description: {
            type: String,
            required: [true, "Please provide description"],
        },
        videoUrl: {
            type: String,
            required: [true, "Please provide videoUrl"],
        },
        playbackUrl: {
            type: String,
        },
        thumbnailUrl: {
            type: String,
            required: [true, "Please provide thumbnailUrl"],
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Please provide course"],
        },
        lectureNumber: {
            type: Number,
            required: [true, "Please provide lecture number"],
        },
        instructorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please provide instructor"],
        },
        duration: {
            type: Number,
            required: [true, "Please provide vide duration"],
        },
    },
    {
        timestamps: true,
    }
);

lectureSchema.methods.getData = function () {
    return {
        lectureId: this._id,
        title: this.title,
        description: this.description,
        videoUrl: this.videoUrl,
        playbackUrl: this.playbackUrl,
        thumbnailUrl: this.thumbnailUrl,
        courseId: this.courseId,
        lectureNumber: this.lectureNumber,
        instructorId: this.instructorId,
        duration: this.duration,
        createdAt: this.createdAt,
    };
};
module.exports = mongoose.model("Lecture", lectureSchema);

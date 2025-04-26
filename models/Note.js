const mongoose = require("mongoose");

const noteSchema = new mongoose.Schema(
    {
        note: {
            type: String,
            required: [true, "Please provide note"],
        },
        lectureId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Lecture",
            required: [true, "Please provide lecture id"],
        },
        videoSeconds: {
            type: Number,
            required: [true, "Please provide videoSeconds"],
        },
        studentId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please provide student id"],
        },
    },
    {
        timestamps: true,
    }
);

noteSchema.methods.getData = function () {
    return {
        id: this._id,
        note: this.note,
        lectureId: this.lectureId,
        videoSeconds: this.videoSeconds,
    };
};
module.exports = mongoose.model("Note", noteSchema);

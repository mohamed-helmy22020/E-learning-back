const mongoose = require("mongoose");
const calculateAverageRate = require("../utils/averageRate");

const courseSchema = new mongoose.Schema(
    {
        instructorId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Please provide instructorId"],
        },
        title: {
            type: String,
            required: [true, "Please provide title"],
        },
        description: {
            type: String,
            required: [true, "Please provide description"],
        },
        price: {
            type: Number,
            required: [true, "Please provide price"],
        },
        picture: {
            type: String,
            required: [true, "Please provide image"],
        },
        overview: {
            type: String,
            default: "",
        },
        overviewPlaybackUrl: {
            type: String,
            default: "",
        },
        category: {
            type: String,
            required: [true, "Please provide category"],
        },
        rates: {
            type: [Number],
            default: [0, 0, 0, 0, 0],
            validate: {
                validator: (arr) => arr.length === 5,
                message: "Rate array must have exactly 5 elements",
            },
        },
        rating: {
            type: Number,
            default: 0,
        },
        lecturesCount: {
            type: Number,
            default: 0,
        },
        students: {
            type: Number,
            default: 0,
        },
    },
    { timestamps: true }
);

courseSchema.methods.getData = function () {
    return {
        id: this._id,
        instructorId: this.instructorId,
        title: this.title,
        description: this.description,
        price: this.price,
        picture: this.picture,
        category: this.category,
        rates: this.rates,
        rating: this.rating,
        lecturesCount: this.lecturesCount,
        createdAt: this.createdAt,
        overview: this.overview,
        overviewPlaybackUrl: this.overviewPlaybackUrl,
        students: this.students,
    };
};

courseSchema.pre("save", async function (next) {
    if (this.isModified("rates")) {
        this.rating = calculateAverageRate(this.rates);
    }
    next();
});

module.exports = mongoose.model("Course", courseSchema);

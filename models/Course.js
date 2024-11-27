const mongoose = require("mongoose");

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
    };
};

courseSchema.pre("save", async function (next) {
    next();
});

module.exports = mongoose.model("Course", courseSchema);

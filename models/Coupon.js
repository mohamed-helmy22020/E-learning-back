const mongoose = require("mongoose");

const couponSchema = new mongoose.Schema(
    {
        coupon: {
            type: String,
            required: [true, "Please provide coupon"],
        },
        courseId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Course",
            required: [true, "Please provide course id"],
        },
        discountPercentage: {
            type: Number,
            required: [true, "Please provide Discount Percentage"],
        },
        userLimit: {
            type: Number,
            required: [true, "Please provide user limit"],
        },
        numberOfUses: {
            type: Number,
            default: 0,
        },
        expiryDate: {
            type: Date,
            required: [true, "Please provide expiry date"],
        },
    },
    { timestamps: true }
);

couponSchema.methods.getData = function () {
    return {
        id: this._id,
        coupon: this.coupon,
        courseId: this.courseId,
        discountPercentage: this.discountPercentage,
        userLimit: this.userLimit,
        expiryDate: this.expiryDate,
    };
};

couponSchema.pre("save", async function (next) {
    next();
});

module.exports = mongoose.model("Coupon", couponSchema);

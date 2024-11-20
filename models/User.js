const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please provide name"],
        match: [/^[a-zA-Z]+ [a-zA-Z]+$/, "Please provide a valid name"],
    },
    email: {
        type: String,
        required: [true, "Please provide email"],
        match: [
            /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
            "Please provide a valid email",
        ],
        unique: [true, "This email is used"],
    },

    phone: {
        type: String,
        required: [true, "Please provide phone"],
    },
    password: {
        type: String,
        required: [true, "Please provide password"],
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isPhoneVerified: {
        type: Boolean,
        default: false,
    },
    emailVerificationCode: String,
    phoneVerificationCode: String,
    resetPasswordCode: String,
    userProfileImage: {
        type: String,
        default: "",
    },
});

userSchema.methods.getData = function () {
    return {
        userId: this._id,
        email: this.email,
        phone: this.phone,
        name: this.name,
        isEmailVerified: this.isEmailVerified,
        isPhoneVerified: this.isPhoneVerified,
        userProfileImage: this.userProfileImage,
    };
};

userSchema.pre("save", async function (next) {
    if (this.isModified("password")) {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } else {
        next();
    }
});

userSchema.methods.createAccessToken = function () {
    return jwt.sign(
        {
            userId: this._id,
            email: this.email,
        },
        process.env.ACCESS_TOKEN_SECRET
    );
};

userSchema.methods.comparePassword = async function (candidatePassword) {
    const isMatch = await bcrypt.compare(candidatePassword, this.password);
    return isMatch;
};

module.exports = mongoose.model("User", userSchema);

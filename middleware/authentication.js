const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { UnauthenticatedError } = require("../errors");

const auth = async (req, res, next) => {
    const isHandshake = req._query?.sid === undefined;
    if (!isHandshake) {
        return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return next(new UnauthenticatedError("You are not authenticated"));
    }
    const token = authHeader.split(" ")[1];
    try {
        const payload = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
        const user = await User.findOne({ _id: payload.userId });
        if (!user) {
            return next(new UnauthenticatedError("You are not authenticated"));
        }
        req.user = user;
        next();
    } catch (error) {
        return next(new UnauthenticatedError("You are not authenticated"));
    }
};

module.exports = auth;

const { StatusCodes } = require("http-status-codes");

const getUserData = async (req, res) => {
    const user = req.user;
    res.status(StatusCodes.OK).json({
        user: user.getData(),
    });
};

module.exports = {
    getUserData,
};

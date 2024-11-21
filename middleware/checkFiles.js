const allowedMimeTypes = ["image/jpeg", "image/png", "image/gif"];
const { BadRequestError } = require("../errors");
const checkProfilePicture = {
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (!allowedMimeTypes.includes(file.mimetype)) {
            return cb(
                new BadRequestError(
                    "Invalid file type. Only images are allowed."
                )
            );
        }

        cb(null, true);
    },
};

module.exports = {
    checkProfilePicture,
};

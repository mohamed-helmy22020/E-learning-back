const { BadRequestError } = require("../errors");

const allowedPictureTypes = ["image/jpeg", "image/png", "image/gif"];
const allowedVideoTypes = [
    "video/mp4",
    "video/mov",
    "video/avi",
    "video/mkv",
    "video/webm",
];
const MAX_PHOTO_SIZE = 5 * 1024 * 1024; // 5 MB
const MAX_VIDEO_SIZE = 100 * 1024 * 1024; // 100 MB

const checkPicture = {
    fileFilter: (req, file, cb) => {
        if (!allowedPictureTypes.includes(file.mimetype)) {
            return cb(
                new BadRequestError(
                    "Invalid file type. Only images are allowed."
                )
            );
        } else if (file.size > MAX_PHOTO_SIZE) {
            return cb(
                new BadRequestError(
                    "File size exceeds the maximum allowed size of 5 MB."
                )
            );
        }

        cb(null, true);
    },
};

const lectureChecker = {
    fileFilter: (req, file, cb) => {
        if (file.fieldname == "thumbnail") {
            checkPicture.fileFilter(req, file, cb);
        } else if (file.fieldname === "video") {
            // Validate video size and type

            if (!allowedVideoTypes.includes(file.mimetype)) {
                return cb(new Error("Only video files are allowed"), false);
            }
            if (file.size > MAX_VIDEO_SIZE) {
                return cb(
                    new Error("Video size must be less than 100MB"),
                    false
                );
            }
        }
        cb(null, true);
    },
};

module.exports = {
    checkPicture,
    lectureChecker,
};

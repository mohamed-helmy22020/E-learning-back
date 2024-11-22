const { checkPicture } = require("../middleware/checkFiles");
const express = require("express");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage, ...checkPicture });

const {
    getUserData,
    updateUserData,
    getUploadedCourses,
} = require("../controllers/user");
const router = express.Router();

router
    .route("/data")
    .get(getUserData)
    .post(upload.single("profilePicture"), updateUserData);

router.route("/uploaded-courses").get(getUploadedCourses);
module.exports = router;

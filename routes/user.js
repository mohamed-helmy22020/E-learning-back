const { checkPicture } = require("../middleware/checkFiles");
const express = require("express");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage, ...checkPicture });

const {
    getUserData,
    updateUserData,
    getUploadedCourses,
    getEnrolledCourses,
} = require("../controllers/user");
const router = express.Router();

router
    .route("/data")
    .get(getUserData)
    .post(upload.single("profilePicture"), updateUserData);

router.route("/uploaded-courses").get(getUploadedCourses);
//TODO: Add route to swagger
router.route("/enrolled-courses").get(getEnrolledCourses);
module.exports = router;

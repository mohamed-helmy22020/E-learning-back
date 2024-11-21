const express = require("express");
const {
    getAllCourses,
    createCourse,
    getCourseById,
} = require("../controllers/course");
const router = express.Router();
const multer = require("multer");
const { checkPicture } = require("../middleware/checkFiles");
const storage = multer.memoryStorage();
const upload = multer({ storage, ...checkPicture });

router
    .route("/")
    .get(getAllCourses)
    .post(upload.single("coursePicture"), createCourse);
router.route("/:courseId").get(getCourseById);
module.exports = router;

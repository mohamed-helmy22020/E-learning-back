const express = require("express");
const {
    getCourseLectures,
    uploadLecture,
    getLectureById,
} = require("../controllers/lecture");
const { lectureChecker } = require("../middleware/checkFiles");
const router = express.Router();

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage, ...lectureChecker });

const uploadLectureFiles = upload.fields([
    { name: "video", maxCount: 1 }, // Single video file
    { name: "thumbnail", maxCount: 1 }, // Single thumbnail file
]);
router.route("/").post(getCourseLectures);

router.route("/create").post(uploadLectureFiles, uploadLecture);
router.route("/:lectureId").get(getLectureById);

module.exports = router;

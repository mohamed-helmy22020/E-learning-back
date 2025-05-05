const express = require("express");
const {
    getAllCourses,
    createCourse,
    getCourseById,
    getAllFavCourses,
    addCourseToFav,
    deleteCourseFromFav,
    updateCourseData,
    getUploadedCourseData,
    vote,
} = require("../controllers/course");
const router = express.Router();
const { checkPicture } = require("../middleware/checkFiles");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage, ...checkPicture });

router
    .route("/")
    .get(getAllCourses)
    .post(
        upload.fields([
            { name: "coursePicture", maxCount: 1 }, // Single file for coursePicture
            { name: "courseOverview", maxCount: 1 }, // Single file for courseIntro
        ]),
        createCourse
    )
    .patch(
        upload.fields([
            { name: "coursePicture", maxCount: 1 }, // Single file for coursePicture
            { name: "courseOverview", maxCount: 1 }, // Single file for courseIntro
        ]),
        updateCourseData
    );
router.route("/fav/").get(getAllFavCourses);
router.route("/fav/:courseId").post(addCourseToFav).delete(deleteCourseFromFav);
router.route("/:courseId").get(getCourseById);
router.route("/uploaded-course/:courseId").get(getUploadedCourseData);
router.route("/instructor/:instructorId").get(getCourseById);
router.route("/vote/:courseId").post(vote);
module.exports = router;

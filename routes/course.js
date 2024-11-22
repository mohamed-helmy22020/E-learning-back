const express = require("express");
const {
    getAllCourses,
    createCourse,
    getCourseById,
    getAllFavCourses,
    addCourseToFav,
    deleteCourseFromFav,
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
router.route("/fav/").get(getAllFavCourses);
router.route("/fav/:courseId").post(addCourseToFav).delete(deleteCourseFromFav);
router.route("/:courseId").get(getCourseById);
module.exports = router;

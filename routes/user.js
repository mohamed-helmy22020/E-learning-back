const { checkPicture } = require("../middleware/checkFiles");
const express = require("express");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage, ...checkPicture });

const { getUserData, updateUserData } = require("../controllers/user");
const router = express.Router();

router
    .route("/data")
    .get(getUserData)
    .post(upload.single("profilePicture"), updateUserData);

module.exports = router;

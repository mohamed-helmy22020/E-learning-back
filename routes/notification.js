const express = require("express");
const {
    getAllNotifications,
    seeNotification,
} = require("../controllers/notification");
const router = express.Router();

router.route("/").get(getAllNotifications);
router.route("/see/:notificationId").post(seeNotification);

module.exports = router;

const express = require("express");
const {
    getAllNotifications,
    seeNotification,
    seeAllNotifications,
} = require("../controllers/notification");
const router = express.Router();

router.route("/").get(getAllNotifications);
router.route("/see/:notificationId").post(seeNotification);
router.route("/see-all").post(seeAllNotifications);

module.exports = router;

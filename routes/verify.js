const express = require("express");
const {
    verifyEmail,
    sendEmailVerificationCode,
} = require("../controllers/verification");
const router = express.Router();

router.route("/email").post(verifyEmail);
router.route("/send/email").post(sendEmailVerificationCode);

module.exports = router;

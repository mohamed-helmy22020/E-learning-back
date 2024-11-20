const express = require("express");
const {
    login,
    register,
    sendResetPasswordCode,
    resetPassword,
} = require("../controllers/auth");
const router = express.Router();

router.route("/login").post(login);
router.route("/register").post(register);
router.route("/send-reset-code").post(sendResetPasswordCode);
router.route("/reset-password").post(resetPassword);

module.exports = router;

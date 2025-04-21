const express = require("express");
const {
    createPaymentSheet,
    handlePostPaymentEvents,
} = require("../controllers/payment");
const router = express.Router();
const authenticateUser = require("../middleware/authentication");

router
    .route("/payment-sheet")
    .post(express.json(), authenticateUser, createPaymentSheet);
router
    .route("/webhook")
    .post(express.raw({ type: "application/json" }), handlePostPaymentEvents);
module.exports = router;

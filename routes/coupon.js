const express = require("express");
const {
    createCoupon,
    getCouponData,
    deleteCoupon,
    getCourseCoupons,
} = require("../controllers/coupon");
const router = express.Router();

router.route("/get-course-coupons/:courseId").get(getCourseCoupons);
router.route("/get-coupon-data").post(getCouponData);
router.route("/create").post(createCoupon);
router.route("/delete").delete(deleteCoupon);

module.exports = router;

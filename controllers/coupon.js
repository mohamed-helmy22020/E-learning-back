const { isValidObjectId } = require("mongoose");
const Coupon = require("../models/Coupon");
const Course = require("../models/Course");
const {
    BadRequestError,
    UnauthenticatedError,
    NotFoundError,
} = require("../errors");
const { StatusCodes } = require("http-status-codes");

const createCoupon = async (req, res) => {
    const user = req.user;
    const { coupon, courseId, discountPercentage, userLimit, expiryDate } =
        req.body;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }

    if (
        !coupon ||
        !courseId ||
        !discountPercentage ||
        !userLimit ||
        !expiryDate
    ) {
        throw new BadRequestError(
            "Please provide Coupon, CourseId, Discount Percentage, User Limit and Expiry Date"
        );
    }
    const coupons = await Coupon.find({
        coupon,
        courseId,
    });

    if (coupons.length > 0) {
        throw new BadRequestError(
            "This coupon is already exist for this course"
        );
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new NotFoundError("This course cannot be found");
    }

    if (course.instructorId.toString() !== user._id.toString()) {
        throw new UnauthenticatedError(
            "You can only add coupons for your courses"
        );
    }

    const couponData = {
        coupon,
        courseId,
        discountPercentage,
        userLimit,
        expiryDate: new Date(expiryDate),
    };

    const createdCoupon = await Coupon.create(couponData);
    res.status(StatusCodes.CREATED).json({
        success: true,
        data: { ...createdCoupon.getData(), numberOfUses: 0 },
    });
};

const getCourseCoupons = async (req, res) => {
    const user = req.user;
    const { courseId } = req.params;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new NotFoundError("This course cannot be found");
    }

    if (course.instructorId.toString() !== user._id.toString()) {
        throw new UnauthenticatedError(
            "You can only get coupons of your courses"
        );
    }

    const coupons = (
        await Coupon.find({
            courseId,
        })
    ).map((c) => ({
        ...c.getData(),
        numberOfUses: c.numberOfUses,
    }));

    res.status(StatusCodes.OK).json({
        success: true,
        data: coupons,
    });
};

const getCouponData = async (req, res) => {
    const { coupon, courseId } = req.body;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }

    if (!coupon) {
        throw new BadRequestError("Please provide Coupon");
    }

    const coupons = await Coupon.find({
        coupon,
        courseId,
    });

    if (coupons.length <= 0) {
        throw new NotFoundError("This coupon cannot be found");
    }

    const couponData = coupons[0];
    if (Date.now() > new Date(couponData.expiryDate)) {
        throw new BadRequestError("This coupon is expired");
    }

    if (couponData.numberOfUses >= couponData.userLimit) {
        throw new BadRequestError("This coupon has reached the users limit");
    }

    res.status(StatusCodes.CREATED).json({
        success: true,
        data: couponData.getData(),
    });
};

const deleteCoupon = async (req, res) => {
    const user = req.user;
    const { coupon, courseId } = req.body;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }

    if (!coupon) {
        throw new BadRequestError("Please provide Coupon");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new NotFoundError("This course cannot be found");
    }

    if (course.instructorId.toString() !== user._id.toString()) {
        throw new UnauthenticatedError(
            "You can only delete coupons of your courses"
        );
    }

    const coupons = await Coupon.find({
        coupon,
        courseId,
    });

    if (coupons.length <= 0) {
        throw new BadRequestError("This coupon cannot be found");
    }

    const deletedCoupon = await Coupon.findByIdAndDelete(
        coupons[0]._id.toString()
    );
    res.status(StatusCodes.CREATED).json({
        success: true,
        data: { ...deletedCoupon.getData() },
    });
};

module.exports = {
    createCoupon,
    getCouponData,
    deleteCoupon,
    getCourseCoupons,
};

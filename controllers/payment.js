const { isValidObjectId } = require("mongoose");
const { BadRequestError, NotFoundError } = require("../errors");
const Course = require("../models/Course");
const User = require("../models/User");
const Coupon = require("../models/Coupon");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createPaymentSheet = async (req, res) => {
    const user = req.user;
    const { courseId, coupon } = req.body;
    if (!courseId || !isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new NotFoundError("No course with this id");
    }

    if (user.enrolledCourses.includes(courseId)) {
        throw new BadRequestError("You've already bought this course");
    }
    if (!user.stripeCustomerId) {
        const customer = await stripe.customers.create({
            email: user.email,
        });
        user.stripeCustomerId = customer.id;
        await user.save();
    }
    const customerId = user.stripeCustomerId;

    const ephemeralKey = await stripe.ephemeralKeys.create(
        { customer: customerId },
        { apiVersion: "2020-08-27" }
    );
    const metadata = {
        courseId,
        userId: user.id,
    };
    let endPrice = course.price * 100;

    let couponData;
    if (coupon) {
        const coupons = await Coupon.find({
            coupon,
            courseId,
        });
        if (coupons.length > 0) {
            couponData = coupons[0];
            if (Date.now() > new Date(couponData.expiryDate)) {
                throw new BadRequestError("This is coupon is expired");
            }

            if (couponData.numberOfUses >= couponData.userLimit) {
                throw new BadRequestError(
                    "This coupon has reached the users limit"
                );
            }

            endPrice -=
                (endPrice * parseInt(couponData.discountPercentage)) / 100;
            metadata.couponId = couponData._id.toString();
        }
    }
    const paymentIntent = await stripe.paymentIntents.create({
        amount: endPrice,
        currency: "usd",
        customer: customerId,
        metadata,
    });

    res.json({
        paymentIntent: paymentIntent.client_secret,
        ephemeralKey: ephemeralKey.secret,
        customer: customerId,
        publishableKey: process.env.STRIPE_PUBLISHABLE_KEY,
    });
};

const handlePostPaymentEvents = async (req, res) => {
    const sig = req.headers["stripe-signature"];

    let event;
    try {
        event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error(`Webhook signature verification failed: ${err}`);
        return res.status(400).json({
            success: false,
            msg: `Webhook Error: ${err}`,
        });
    }

    // Handle the event
    switch (event.type) {
        case "payment_intent.succeeded":
            const paymentIntent = event.data.object;

            // Extract metadata
            const courseId = paymentIntent.metadata.courseId;
            const userId = paymentIntent.metadata.userId;
            const couponId = paymentIntent.metadata.couponId;

            const user = await User.findById(userId);
            const coupon = await Coupon.findById(couponId);
            if (!user.enrolledCourses.includes(courseId)) {
                user.enrolledCourses.push(courseId);
                await user.save();
                if (coupon) {
                    coupon.numberOfUses = coupon.numberOfUses + 1;
                    await coupon.save();
                }
            }

            console.log(`Course purchased: ${courseId} by User: ${userId}`);

            // Perform actions (e.g., update database, send confirmation email)
            break;

        default:
            console.log(`Unhandled event type: ${event.type}`);
    }

    // Acknowledge receipt of the event
    res.json({ received: true });
};
module.exports = {
    createPaymentSheet,
    handlePostPaymentEvents,
};

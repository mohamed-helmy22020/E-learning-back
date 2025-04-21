const { isValidObjectId } = require("mongoose");
const { BadRequestError, NotFoundError } = require("../errors");
const Course = require("../models/Course");
const User = require("../models/User");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const createPaymentSheet = async (req, res) => {
    const user = req.user;
    const { courseId } = req.body;
    if (!courseId || !isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id.");
    }

    const course = await Course.findById(courseId);
    if (!course) {
        throw new NotFoundError("There is no course with this course id.");
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

    const endPrice = course.price * 100;

    const paymentIntent = await stripe.paymentIntents.create({
        amount: endPrice,
        currency: "usd",
        customer: customerId,
        metadata: {
            courseId,
            userId: user.id,
        },
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

            const user = await User.findById(userId);
            console.log(user.enrolledCourses);
            if (!user.enrolledCourses.includes(courseId)) {
                user.enrolledCourses.push(courseId);
                await user.save();
                console.log(user.enrolledCourses);
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

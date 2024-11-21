const { BadRequestError } = require("../errors");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const { handleUploadFromBuffer } = require("../config/cloudinary");
const { calculateAverageRate } = require("../utils");

const getAllCourses = async (req, res) => {
    const { title, description, category, numericFilters, sort, fields } =
        req.query;
    const queryObject = {};

    if (title) {
        queryObject.title = { $regex: title, $options: "i" };
    }
    if (description) {
        queryObject.description = { $regex: description, $options: "i" };
    }
    if (category) {
        queryObject.category = category;
    }
    if (numericFilters) {
        const operatorMap = {
            ">": "$gt",
            ">=": "$gte",
            "=": "$eq",
            "<": "$lt",
            "<=": "$lte",
        };
        const regEx = /\b(<|>|>=|=|<|<=)\b/g;
        let filters = numericFilters.replace(
            regEx,
            (match) => `-${operatorMap[match]}-`
        );
        const options = ["price", "rating"];
        filters = filters.split(",").forEach((item) => {
            const [field, operator, value] = item.split("-");
            if (options.includes(field)) {
                queryObject[field] = { [operator]: Number(value) };
            }
        });
    }

    let result = Course.find(queryObject);
    // sort
    if (sort) {
        const sortList = sort.split(",").join(" ");
        result = result.sort(sortList);
    } else {
        result = result.sort("createdAt");
    }

    if (fields) {
        const fieldsList = fields.split(",").join(" ");
        result = result.select(fieldsList);
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    result = result.skip(skip).limit(limit);

    const courses = await result;
    res.status(200).json({ courses, nbHits: courses.length });
};
const getCourseById = async (req, res) => {
    const { courseId } = req.params;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }
    try {
        const course = await Course.findById(courseId);
        return res.status(200).json({ course });
    } catch (error) {
        return res.status(404).json({ msg: "Course not found" });
    }
};

const createCourse = async (req, res) => {
    const user = req.user;
    const coursePictureId = new mongoose.Types.ObjectId();
    const { title, description, price, category } = req.body;
    const { file: coursePicture } = req;
    console.log({ title, description, price, category });
    console.log({ coursePicture, coursePictureId });

    if (!title || !description || !price || !category || !coursePicture) {
        throw new BadRequestError(
            "Please provide title, description, price, category and course picture"
        );
    }
    const courseData = {
        _id: coursePictureId,
        instructorId: user._id,
        title,
        description,
        price,
        category,
    };

    try {
        const cldRes = await handleUploadFromBuffer(coursePicture, {
            public_id: `course_picture_${user._id}_${coursePictureId}`,
            folder: "course_pictures",
        });
        courseData.picture = cldRes.secure_url;
    } catch (error) {
        console.log(error);
        throw new Error(error);
    }

    const course = await Course.create(courseData);
    res.status(200).json(course.getData());
};

module.exports = {
    getAllCourses,
    createCourse,
    getCourseById,
};

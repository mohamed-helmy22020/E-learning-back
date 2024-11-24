const { BadRequestError } = require("../errors");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const { handleUploadPicFromBuffer } = require("../config/cloudinary");
const { calculateAverageRate } = require("../utils");
const { StatusCodes } = require("http-status-codes");

const getAllCourses = async (req, res) => {
    const { title, description, category, numericFilters, sort, fields } =
        req.query;
    const queryObject = {
        instructorId: { $ne: req.user._id },
    };

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
        result = result.sort("-createdAt");
    }

    if (fields) {
        const fieldsList = fields.split(",").join(" ");
        result = result.select(fieldsList);
    } else {
        result = result.select("-__v -updatedAt");
    }
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    result = result.skip(skip).limit(limit);

    let courses = await result;
    courses = courses
        .filter((course) => {
            return !req.user.enrolledCourses.includes(course._id);
        })
        .map((course) => {
            return {
                ...course.getData(),
                isFav: req.user.favCourses.includes(course._id),
            };
        });
    res.status(StatusCodes.OK).json({ courses, nbHits: courses.length });
};

const getCourseById = async (req, res) => {
    const user = req.user;
    const { courseId } = req.params;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }
    try {
        let course = await Course.findById(courseId);
        return res.status(StatusCodes.OK).json({
            course: {
                ...course.getData(),
                isFav: user.favCourses.includes(courseId),
            },
        });
    } catch (error) {
        return res
            .status(StatusCodes.NOT_FOUND)
            .json({ msg: "Course not found" });
    }
};

const createCourse = async (req, res) => {
    const user = req.user;
    const courseId = new mongoose.Types.ObjectId();
    const { title, description, price, category } = req.body;
    const { file: coursePicture } = req;

    if (!title || !description || !price || !category || !coursePicture) {
        throw new BadRequestError(
            "Please provide title, description, price, category and course picture"
        );
    }
    const courseData = {
        _id: courseId,
        instructorId: user._id,
        title,
        description,
        price,
        category,
    };

    try {
        const cldRes = await handleUploadPicFromBuffer(coursePicture, {
            public_id: `course_picture_${user._id}_${courseId}`,
            folder: "course_pictures",
        });
        courseData.picture = cldRes.secure_url;
    } catch (error) {
        throw new Error(error);
    }

    const course = await Course.create(courseData);
    res.status(StatusCodes.CREATED).json(course.getData());
};

const getAllFavCourses = async (req, res) => {
    const user = req.user;
    const favCoursesIDs = user.favCourses.reverse();

    const favCourses = await Course.find({ _id: { $in: favCoursesIDs } });

    res.status(StatusCodes.OK).json({
        courses: favCourses.map((course) => course.getData()),
        nbHits: favCourses.length,
    });
};

const addCourseToFav = (req, res) => {
    const user = req.user;
    const { courseId } = req.params;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }
    if (user.favCourses.includes(courseId)) {
        return res.status(StatusCodes.OK).json({ msg: "Course added to fav" });
    }
    user.favCourses.push(courseId);
    user.save();
    res.status(StatusCodes.OK).json({ msg: "Course added to fav" });
};

const deleteCourseFromFav = (req, res) => {
    const user = req.user;
    const { courseId } = req.params;
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }
    if (!user.favCourses.includes(courseId)) {
        console.log("wef");
        return res
            .status(StatusCodes.OK)
            .json({ msg: "Course removed from fav" });
    }
    user.favCourses = user.favCourses.filter((id) => id != courseId);

    user.save();
    res.status(StatusCodes.OK).json({ msg: "Course removed from fav" });
};

module.exports = {
    getAllCourses,
    createCourse,
    getCourseById,
    getAllFavCourses,
    addCourseToFav,
    deleteCourseFromFav,
};

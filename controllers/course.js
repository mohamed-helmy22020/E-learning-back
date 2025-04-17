const {
    BadRequestError,
    NotFoundError,
    UnauthenticatedError,
} = require("../errors");
const mongoose = require("mongoose");
const Course = require("../models/Course");
const User = require("../models/User");
const {
    handleUploadPicFromBuffer,
    handleUploadVideoFromBuffer,
} = require("../config/cloudinary");
const { StatusCodes } = require("http-status-codes");

const createCourse = async (req, res) => {
    const user = req.user;
    const courseId = new mongoose.Types.ObjectId();
    const { title, description, price, category } = req.body;
    const {
        files: { coursePicture, courseOverview },
    } = req;
    console.log(coursePicture, courseOverview);

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
        price: Number(price),
        category,
    };

    try {
        const cldRes = await handleUploadPicFromBuffer(coursePicture[0], {
            public_id: `course_picture_${user._id}_${courseId}`,
            folder: "course_pictures",
        });
        courseData.picture = cldRes.secure_url;
    } catch (error) {
        throw new Error(error);
    }

    if (courseOverview) {
        try {
            const cldRes = await handleUploadVideoFromBuffer(
                courseOverview[0],
                {
                    public_id: `course_overview_${user._id}_${courseId}`,
                    folder: "course_overviews",
                }
            );
            courseData.overview = cldRes.secure_url;
        } catch (error) {
            throw new Error(error);
        }
    }

    const course = await Course.create(courseData);
    res.status(StatusCodes.CREATED).json({
        ...course.getData(),
        instructorDetails: {
            name: user.name,
            userProfileImage: user.userProfileImage,
        },
        success: true,
    });
};

const updateCourseData = async (req, res) => {
    const user = req.user;
    const { courseId, title, description, price, category } = req.body;
    const {
        files: { coursePicture, courseOverview },
    } = req;

    if (!courseId) {
        throw new BadRequestError("Please provide course ID");
    }
    const fetchedCourse = await Course.findById(courseId, "  instructorId");
    if (!fetchedCourse) {
        throw new NotFoundError("No course with this id");
    }

    if (fetchedCourse.instructorId.toString() != user._id.toString()) {
        throw new UnauthenticatedError("You can change only your courses.");
    }

    const courseData = {};
    if (title) {
        courseData.title = title;
    }
    if (description) {
        courseData.description = description;
    }
    if (price) {
        courseData.price = price;
    }
    if (category) {
        courseData.category = category;
    }

    if (coursePicture) {
        try {
            const cldRes = await handleUploadPicFromBuffer(coursePicture[0], {
                public_id: `course_picture_${user._id}_${courseId}`,
                folder: "course_pictures",
            });
            courseData.picture = cldRes.secure_url;
        } catch (error) {
            throw new Error(error);
        }
    }

    if (courseOverview) {
        try {
            const cldRes = await handleUploadVideoFromBuffer(
                courseOverview[0],
                {
                    public_id: `course_overview_${user._id}_${courseId}`,
                    folder: "course_overviews",
                }
            );
            courseData.overview = cldRes.secure_url;
        } catch (error) {
            throw new Error(error);
        }
    }

    console.log(courseData);

    const course = await Course.findByIdAndUpdate(courseId, courseData, {
        new: true,
        runValidators: true,
    });

    res.status(StatusCodes.OK).json({
        ...course.getData(),
        instructorDetails: {
            name: user.name,
            userProfileImage: user.userProfileImage,
        },
        success: true,
    });
};

const getAllCourses = async (req, res) => {
    const {
        title,
        description,
        category,
        numericFilters,
        sort,
        fields,
        search,
    } = req.query;

    const queryObject = {
        instructorId: { $ne: req.user._id },
    };

    if (search) {
        queryObject.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
        ];
    } else {
        if (title) {
            queryObject.title = { $regex: title, $options: "i" };
        }
        if (description) {
            queryObject.description = { $regex: description, $options: "i" };
        }
    }
    if (category) {
        queryObject.category = category;
    }
    if (numericFilters) {
        const operatorMap = {
            ">": "$gt",
            ">=": "$gte",
            "=": "$eq",
            "&lt;": "$lt",
            "<=": "$lte",
        };
        const regEx = /\b(&lt;|>|>=|=|<|<=)\b/g;
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
    let result = Course.find(queryObject).populate(
        "instructorId",
        "name userProfileImage"
    );
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
            const { instructorId, ...rest } = {
                ...course.getData(),
                instructorDetails: course.instructorId,
                isFav: req.user.favCourses.includes(course._id),
            };
            return rest;
        });

    res.status(StatusCodes.OK).json({ courses, nbHits: courses.length });
};

const getCourseById = async (req, res) => {
    const user = req.user;
    const { courseId } = req.params;
    console.log(courseId);
    if (!courseId || !mongoose.isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }
    try {
        let course = await Course.findById(courseId).populate(
            "instructorId",
            "name userProfileImage"
        );

        console.log(course.getData());
        return res.status(StatusCodes.OK).json({
            course: {
                ...course.getData(),
                isFav: user.favCourses.includes(courseId),
            },
        });
    } catch (error) {
        console.log(error);
        return res
            .status(StatusCodes.NOT_FOUND)
            .json({ msg: "Course not found" });
    }
};

const getAllFavCourses = async (req, res) => {
    const user = req.user;
    const favCoursesIDs = user.favCourses.reverse();

    const favCourses = await Course.find({
        _id: { $in: favCoursesIDs },
    }).populate("instructorId", "name userProfileImage");

    res.status(StatusCodes.OK).json({
        courses: favCourses.map((course) => {
            const { instructorId, ...rest } = {
                ...course.getData(),
                instructorDetails: course.instructorId,
                isFav: true,
            };
            return rest;
        }),
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
        return res
            .status(StatusCodes.OK)
            .json({ msg: "Course removed from fav" });
    }
    user.favCourses = user.favCourses.filter((id) => id != courseId);

    user.save();
    res.status(StatusCodes.OK).json({ msg: "Course removed from fav" });
};

const getInstructorData = (req, res) => {
    const { instructorId } = req.params;
    if (!instructorId || !mongoose.isValidObjectId(instructorId)) {
        throw new BadRequestError("Please provide valid instructor id");
    }
    User.findOne({ _id: instructorId })
        .then((user) => {
            res.status(StatusCodes.OK).json({ instructor: user.getData() });
        })
        .catch((err) => {
            res.status(StatusCodes.NOT_FOUND).json({
                msg: "Instructor not found",
            });
        });
};

module.exports = {
    createCourse,
    updateCourseData,
    getAllCourses,
    getCourseById,
    getAllFavCourses,
    addCourseToFav,
    deleteCourseFromFav,
    getInstructorData,
};

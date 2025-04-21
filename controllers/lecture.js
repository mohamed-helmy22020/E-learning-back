const { isValidObjectId } = require("mongoose");
const Course = require("../models/Course");
const {
    BadRequestError,
    UnauthenticatedError,
    NotFoundError,
} = require("../errors");
const Lecture = require("../models/Lecture");
const { StatusCodes } = require("http-status-codes");
const mongoose = require("mongoose");
const {
    handleUploadPicFromBuffer,
    cloudinary,
    handleUploadVideoFromBuffer,
} = require("../config/cloudinary");

const getCourseLectures = async (req, res) => {
    const user = req.user;
    const { courseId } = req.body;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }

    const course = await Course.findOne({ _id: courseId });

    if (!course) {
        throw new NotFoundError(`No course with id ${courseId}`);
    }

    if (
        !user.enrolledCourses.includes(courseId.toString()) &&
        course.instructorId.toString() != user._id.toString()
    ) {
        throw new UnauthenticatedError(
            "you are not authorized to access this course"
        );
    }

    const lectures = await Lecture.find({ courseId: courseId });

    res.status(StatusCodes.OK).json({
        lectures: lectures.map((lecture) => lecture.getData()),
        nbHits: lectures.length,
    });
};

const uploadLecture = async (req, res) => {
    const user = req.user;
    const {
        body: { courseId, title, description },
        files: { thumbnail, video },
    } = req;

    if (
        !courseId ||
        !isValidObjectId(courseId) ||
        !thumbnail ||
        !video ||
        !title ||
        !description
    ) {
        throw new BadRequestError(
            "Please provide valid course id, thumbnail, video, title, description"
        );
    }

    const course = await Course.findOne({ _id: courseId });

    if (!course) {
        throw new NotFoundError(`No course with id ${courseId}`);
    }

    if (course.instructorId.toString() != user._id.toString()) {
        throw new UnauthenticatedError(
            "you are not authorized to access this course"
        );
    }

    const lectureId = new mongoose.Types.ObjectId();

    const lectureData = {
        _id: lectureId,
        title,
        description,
        courseId,
        lectureNumber: course.lecturesCount + 1,
        instructorId: user._id,
    };

    try {
        const uploadThumbnailResult = await handleUploadPicFromBuffer(
            thumbnail[0],
            {
                public_id: `lecture_thumbnail_${courseId}_${lectureData.lectureNumber}`,
                folder: "lecture_pictures",
            }
        );
        lectureData.thumbnailUrl = uploadThumbnailResult.secure_url;
    } catch (error) {
        throw new Error(error);
    }

    try {
        const uploadVideoResult = await handleUploadVideoFromBuffer(video[0], {
            public_id: `lecture_video_${courseId}_${lectureData.lectureNumber}`,
            folder: "lecture_videos",
        });

        lectureData.videoUrl = uploadVideoResult.secure_url;
    } catch (error) {
        throw new Error(error);
    }

    const lecture = await Lecture.create(lectureData);
    course.lecturesCount++;
    course.save();
    res.status(StatusCodes.CREATED).json({ lecture: lecture.getData() });
};

const updateLectureData = async (req, res) => {
    const user = req.user;
    const {
        body: { courseId, lectureId, title, description },
        files: { thumbnail, video },
    } = req;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id ");
    }

    if (!lectureId || !isValidObjectId(lectureId)) {
        throw new BadRequestError("Please provide valid lecture id");
    }

    const course = await Course.findOne({ _id: courseId });

    if (!course) {
        throw new NotFoundError(`No course with id ${courseId}`);
    }

    if (course.instructorId.toString() != user._id.toString()) {
        throw new UnauthenticatedError(
            "you are not authorized to access this course lectures"
        );
    }

    const lectureData = {};

    if (title) {
        lectureData.title = title;
    }
    if (description) {
        lectureData.description = description;
    }

    if (thumbnail) {
        try {
            const uploadThumbnailResult = await handleUploadPicFromBuffer(
                thumbnail[0],
                {
                    public_id: `lecture_thumbnail_${courseId}_${lectureData.lectureNumber}`,
                    folder: "lecture_pictures",
                }
            );
            lectureData.thumbnailUrl = uploadThumbnailResult.secure_url;
        } catch (error) {
            throw new Error(error);
        }
    }
    if (video) {
        try {
            const uploadVideoResult = await handleUploadVideoFromBuffer(
                video[0],
                {
                    public_id: `lecture_video_${courseId}_${lectureData.lectureNumber}`,
                    folder: "lecture_videos",
                }
            );

            lectureData.videoUrl = uploadVideoResult.secure_url;
            lectureData.playbackUrl = uploadVideoResult.playback_url;
        } catch (error) {
            throw new Error(error);
        }
    }

    const lecture = await Lecture.findByIdAndUpdate(lectureId, lectureData, {
        new: true,
        runValidators: true,
    });

    res.status(StatusCodes.CREATED).json({
        lecture: lecture.getData(),
        success: true,
    });
};

const getLectureById = async (req, res) => {
    const user = req.user;
    const { lectureId } = req.params;

    if (!lectureId || !isValidObjectId(lectureId)) {
        throw new BadRequestError("Please provide valid lecture id");
    }

    const lecture = await Lecture.findOne({ _id: lectureId });

    if (!lecture) {
        throw new NotFoundError(`No lecture with id ${lectureId}`);
    }

    const course = await Course.findOne({ _id: lecture.courseId });

    if (
        !user.enrolledCourses.includes(course._id.toString()) &&
        course.instructorId.toString() != user._id.toString()
    ) {
        throw new UnauthenticatedError(
            "you are not authorized to access this course"
        );
    }

    res.status(StatusCodes.OK).json({ lecture: lecture.getData() });
};

module.exports = {
    getCourseLectures,
    uploadLecture,
    getLectureById,
    updateLectureData,
};

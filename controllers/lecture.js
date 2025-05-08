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
    handleUploadVideoFromBuffer,
} = require("../config/cloudinary");
const { getIO } = require("../config/socketManager");
const User = require("../models/User");
const Notification = require("../models/Notification");
const io = getIO();
const notificationNamespace = io.of("/api/notification");

const getCourseLectures = async (req, res) => {
    const user = req.user;
    const { courseId } = req.body;

    if (!courseId || !isValidObjectId(courseId)) {
        throw new BadRequestError("Please provide valid course id");
    }

    const course = await Course.findOne({ _id: courseId });

    if (!course) {
        throw new NotFoundError(`No course with this id`);
    }

    if (
        !user.enrolledCourses.includes(courseId.toString()) &&
        course.instructorId.toString() != user._id.toString()
    ) {
        throw new UnauthenticatedError(
            "You are not authorized to access this course"
        );
    }

    let lectures = await Lecture.find({ courseId: courseId });
    lectures = lectures.map((l) => {
        return {
            ...l.getData(),
            progress: user.watchedLectures.find(
                (wl) => wl.lecture.toString() === l._id.toString()
            ) || {
                course: course._id,
                lecture: l._id,
                duration: 0,
                isDone: 0,
            },
        };
    });

    res.status(StatusCodes.OK).json({
        success: true,
        lectures,
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
        throw new NotFoundError(`No course with this id`);
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
        lectureData.playbackUrl = uploadVideoResult.playback_url;
        lectureData.duration = uploadVideoResult.duration;
    } catch (error) {
        throw new Error(error);
    }

    const lecture = await Lecture.create(lectureData);
    course.lecturesCount++;
    course.save();

    const students = await User.find({
        enrolledCourses: course._id,
    });

    students.forEach(async (s) => {
        const notification = await Notification.create({
            recipient: s._id,
            type: "new_lecture",
            course: course._id,
            lecture: lecture._id,
        });

        notificationNamespace.to(`user:${s._id}`).emit("receiveNotification", {
            ...notification.getData(),
            course: {
                _id: course._id,
                title: course.title,
                picture: course.picture,
            },
            lecture: {
                _id: lecture._id,
                title: lecture.title,
                thumbnailUrl: lecture.thumbnailUrl,
            },
        });
    });
    res.status(StatusCodes.CREATED).json({
        success: true,
        lecture: lecture.getData(),
    });
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
        throw new NotFoundError(`No course with this id`);
    }

    if (course.instructorId.toString() != user._id.toString()) {
        throw new UnauthenticatedError(
            "You are not authorized to access this course lectures"
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
        success: true,
        lecture: lecture.getData(),
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
        throw new NotFoundError(`No lecture with this id`);
    }

    const course = await Course.findOne({ _id: lecture.courseId });

    if (
        !user.enrolledCourses.includes(course._id.toString()) &&
        course.instructorId.toString() != user._id.toString()
    ) {
        throw new UnauthenticatedError(
            "You are not authorized to access this course"
        );
    }

    res.status(StatusCodes.OK).json({
        success: true,
        lecture: lecture.getData(),
    });
};

const updateLectureProgress = async (req, res) => {
    const user = req.user;
    const { lectureId } = req.params;
    const { duration } = req.body;

    if (!lectureId || !isValidObjectId(lectureId)) {
        throw new BadRequestError("Please provide valid lecture id");
    }

    const lecture = await Lecture.findById(lectureId);
    if (!lecture) {
        throw new NotFoundError("No lecture with this id");
    }

    if (!duration) {
        throw new BadRequestError("Please Provide duration");
    }

    if (duration > lecture.duration || duration < 0) {
        throw new BadRequestError("Duration is not valid");
    }

    const wlIndex = user.watchedLectures.findIndex(
        (wl) => wl.lecture.toString() === lectureId
    );
    if (wlIndex > -1) {
        if (duration > user.watchedLectures[wlIndex].duration) {
            user.watchedLectures[wlIndex] = {
                course: lecture.courseId,
                lecture: lecture._id,
                duration,
                isDone: duration >= lecture.duration - 10,
                updatedAt: new Date().toISOString(),
            };
        }
    } else {
        user.watchedLectures.push({
            course: lecture.courseId,
            lecture: lecture._id,
            duration,
            isDone: duration >= lecture.duration - 10,
        });
    }

    await user.save();

    res.status(StatusCodes.OK).json({
        success: true,
    });
};

module.exports = {
    getCourseLectures,
    uploadLecture,
    getLectureById,
    updateLectureData,
    updateLectureProgress,
};

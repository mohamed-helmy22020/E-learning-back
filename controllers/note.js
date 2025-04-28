const { isValidObjectId } = require("mongoose");
const {
    NotFoundError,
    BadRequestError,
    UnauthenticatedError,
} = require("../errors");
const Lecture = require("../models/Lecture");
const Note = require("../models/Note");
const { StatusCodes } = require("http-status-codes");

const createNote = async (req, res) => {
    const user = req.user;
    const { note, lectureId, videoSeconds } = req.body;

    if (!lectureId || !isValidObjectId(lectureId)) {
        throw new BadRequestError("Please provide valid lecture id");
    }

    if (!note || !videoSeconds || isNaN(videoSeconds)) {
        throw new BadRequestError(
            "Please provide note and valid video seconds"
        );
    }

    const fetchedNote = await Note.findOne({
        lectureId,
        videoSeconds: parseInt(videoSeconds),
    });
    if (fetchedNote) {
        throw new BadRequestError(
            "You can add only one note for the same video second"
        );
    }

    const lecture = await Lecture.findOne({ _id: lectureId });
    if (!lecture) {
        throw new NotFoundError(`No lecture with this id`);
    }

    const { lectureId: _, ...newNote } = (
        await Note.create({
            note,
            lectureId,
            videoSeconds: parseInt(videoSeconds),
            studentId: user._id,
        })
    ).getData();

    res.status(201).json({
        success: true,
        note: {
            ...newNote,
            lecture: {
                _id: lecture._id,
                title: lecture.title,
                lectureNumber: lecture.lectureNumber,
            },
        },
    }); // Return the created note
};

const editNote = async (req, res) => {
    const user = req.user;
    const { noteId } = req.params;
    const { note } = req.body;

    if (!noteId || !isValidObjectId(noteId)) {
        throw new BadRequestError("Please provide valid note id");
    }

    const fetchedNote = await Note.findOne({ _id: noteId });

    if (!fetchedNote) {
        throw new BadRequestError("No note with this id");
    }

    if (fetchedNote.studentId.toString() !== user._id.toString()) {
        throw new UnauthenticatedError("You can only edit your notes");
    }

    const noteData = {};

    if (note) {
        noteData.note = note;
    }

    const updatedNote = await Note.findByIdAndUpdate(noteId, noteData, {
        new: true,
        runValidators: true,
    });

    res.status(StatusCodes.OK).json({
        success: true,
        note: updatedNote.getData(),
    });
};

const deleteNote = async (req, res) => {
    const user = req.user;
    const { noteId } = req.params;

    if (!noteId || !isValidObjectId(noteId)) {
        throw new BadRequestError("Please provide valid note id");
    }

    const fetchedNote = await Note.findOne({ _id: noteId });

    if (!fetchedNote) {
        throw new BadRequestError("No note with this id");
    }

    if (fetchedNote.studentId.toString() !== user._id.toString()) {
        throw new UnauthenticatedError("You can only delete your notes");
    }

    const deletedNote = await Note.findByIdAndDelete({ _id: noteId });

    res.status(StatusCodes.OK).json({
        success: true,
        note: deletedNote.getData(),
    });
};

const getLectureNotes = async (req, res) => {
    const user = req.user;
    const { lectureId } = req.params;
    if (!lectureId || !isValidObjectId(lectureId)) {
        throw new BadRequestError("Please provide valid lecture id");
    }

    const fetchedLecture = await Lecture.find({ _id: lectureId });

    if (!fetchedLecture) {
        throw new BadRequestError("No lecture with this id");
    }

    const notes = (
        await Note.find({
            lectureId,
            studentId: user._id.toString(),
        }).populate("lectureId", "title lectureNumber")
    ).map((n) => {
        const { lectureId, ...rest } = {
            ...n.getData(),
            lecture: n.lectureId,
        };
        return rest;
    });

    res.status(StatusCodes.OK).json({
        success: true,
        notes,
    });
};
module.exports = {
    createNote,
    editNote,
    deleteNote,
    getLectureNotes,
};

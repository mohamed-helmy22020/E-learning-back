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

    if (
        !note ||
        !lectureId ||
        !isValidObjectId(lectureId) ||
        !videoSeconds ||
        isNaN(videoSeconds)
    ) {
        throw new BadRequestError(
            "Please provide valide lecture id, note and valid video seconds"
        );
    }

    const fetchedNote = await Note.findOne({
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

    // Create the note
    const newNote = await Note.create({
        note,
        lectureId,
        videoSeconds,
        studentId: user._id,
    });

    res.status(201).json({
        success: true,
        note: newNote.getData(),
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
module.exports = {
    createNote,
    editNote,
    deleteNote,
};

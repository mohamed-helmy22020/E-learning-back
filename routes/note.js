const express = require("express");
const {
    createNote,
    deleteNote,
    editNote,
    getLectureNotes,
} = require("../controllers/note");

const router = express.Router();
router.route("/").post(createNote);

router.route("/:noteId").delete(deleteNote).patch(editNote);
router.route("/get-lecture-notes/:lectureId").get(getLectureNotes);

module.exports = router;

const express = require("express");
const { createNote, deleteNote, editNote } = require("../controllers/note");

const router = express.Router();
router.route("/").post(createNote);

router.route("/:noteId").delete(deleteNote).patch(editNote);

module.exports = router;

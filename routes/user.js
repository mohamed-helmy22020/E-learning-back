const express = require("express");

const { getUserData } = require("../controllers/user");
const router = express.Router();

router.route("/data").get(getUserData);

module.exports = router;

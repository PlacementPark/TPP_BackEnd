const express = require("express");
const router = express.Router();
const {getLocations} = require('../controllers/location');
const { get } = require("mongoose");
router.route('/').get(getLocations)

module.exports = router
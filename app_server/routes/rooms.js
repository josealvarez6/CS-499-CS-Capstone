var express = require('express');
var router = express.Router();
var controller = require('../controllers/rooms');

/* GET travel page */
router.get('/', controller.rooms);

module.exports = router;
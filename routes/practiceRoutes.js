const express = require('express');
const controller = require('../controllers/practiceController');
const { optionalAuthenticateToken } = require('../middleware/auth');
const { userLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/topic-counts', optionalAuthenticateToken, userLimiter, controller.getTopicCounts);

module.exports = router;

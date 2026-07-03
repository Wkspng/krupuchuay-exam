const express = require('express');
const controller = require('../controllers/examAttemptController');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/auth');
const { userLimiter, submissionLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.post('/', optionalAuthenticateToken, submissionLimiter, controller.createExamAttempt);
router.get('/', authenticateToken, userLimiter, controller.getExamAttempts);
router.get('/:id', authenticateToken, userLimiter, controller.getExamAttemptById);

module.exports = router;

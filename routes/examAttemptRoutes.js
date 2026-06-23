const express = require('express');
const controller = require('../controllers/examAttemptController');
const { authenticateToken, optionalAuthenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/', optionalAuthenticateToken, controller.createExamAttempt);
router.get('/', authenticateToken, controller.getExamAttempts);
router.get('/:id', authenticateToken, controller.getExamAttemptById);

module.exports = router;

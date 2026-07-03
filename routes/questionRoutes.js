const express = require('express');
const controller = require('../controllers/questionController');
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');
const { userLimiter, adminLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', optionalAuthenticateToken, controller.getQuestions);
router.get('/random', optionalAuthenticateToken, userLimiter, controller.getRandomQuestions);
router.get('/:id', optionalAuthenticateToken, controller.getQuestionById);
router.post('/import', authenticateToken, requireAdmin, adminLimiter, controller.importQuestions);
router.post('/', authenticateToken, requireAdmin, adminLimiter, controller.createQuestion);
router.put('/:id', authenticateToken, requireAdmin, adminLimiter, controller.updateQuestion);
router.delete('/:id', authenticateToken, requireAdmin, adminLimiter, controller.deleteQuestion);

module.exports = router;

const express = require('express');
const controller = require('../controllers/questionController');
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthenticateToken, controller.getQuestions);
router.get('/random', controller.getRandomQuestions);
router.get('/:id', optionalAuthenticateToken, controller.getQuestionById);
router.post('/import', authenticateToken, requireAdmin, controller.importQuestions);
router.post('/', authenticateToken, requireAdmin, controller.createQuestion);
router.put('/:id', authenticateToken, requireAdmin, controller.updateQuestion);
router.delete('/:id', authenticateToken, requireAdmin, controller.deleteQuestion);

module.exports = router;

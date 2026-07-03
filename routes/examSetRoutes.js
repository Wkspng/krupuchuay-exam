const express = require('express');
const controller = require('../controllers/examSetController');
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');
const { userLimiter, adminLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', optionalAuthenticateToken, controller.getExamSets);
router.post('/', authenticateToken, requireAdmin, adminLimiter, controller.createExamSet);
router.post('/:id/start', optionalAuthenticateToken, userLimiter, controller.startExamSet);
router.get('/:id', optionalAuthenticateToken, controller.getExamSetById);
router.put('/:id', authenticateToken, requireAdmin, adminLimiter, controller.updateExamSet);
router.delete('/:id', authenticateToken, requireAdmin, adminLimiter, controller.deleteExamSet);

module.exports = router;

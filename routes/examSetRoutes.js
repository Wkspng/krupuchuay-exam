const express = require('express');
const controller = require('../controllers/examSetController');
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthenticateToken, controller.getExamSets);
router.post('/', authenticateToken, requireAdmin, controller.createExamSet);
router.post('/:id/start', optionalAuthenticateToken, controller.startExamSet);
router.get('/:id', optionalAuthenticateToken, controller.getExamSetById);
router.put('/:id', authenticateToken, requireAdmin, controller.updateExamSet);
router.delete('/:id', authenticateToken, requireAdmin, controller.deleteExamSet);

module.exports = router;

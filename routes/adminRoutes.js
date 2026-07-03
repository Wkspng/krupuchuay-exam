const express = require('express');
const controller = require('../controllers/adminExamPackController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { adminLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/exam-packs/status', authenticateToken, requireAdmin, controller.getExamPacksStatus);
router.get('/exam-packs/status/:categoryId', authenticateToken, requireAdmin, controller.getSingleExamPackStatus);
router.post('/exam-packs/dry-run/:categoryId', authenticateToken, requireAdmin, adminLimiter, controller.dryRunExamPack);
router.post('/exam-packs/compile/:categoryId', authenticateToken, requireAdmin, adminLimiter, controller.compileExamPack);
router.post('/exam-packs/compile-all', authenticateToken, requireAdmin, adminLimiter, controller.compileAllExamPacks);

module.exports = router;

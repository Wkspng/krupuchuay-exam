const express = require('express');
const controller = require('../controllers/statsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/me', authenticateToken, controller.getMyStats);
router.get('/overview', authenticateToken, requireAdmin, controller.getOverviewStats);

module.exports = router;

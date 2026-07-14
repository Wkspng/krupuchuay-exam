const express = require('express');
const controller = require('../controllers/paymentController');
const { authenticateSignedIn } = require('../middleware/auth');
const { userLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/config', authenticateSignedIn, controller.getConfig);
router.get('/status', authenticateSignedIn, controller.getStatus);
router.post('/verify-slip', authenticateSignedIn, userLimiter, controller.verifySlip);

module.exports = router;

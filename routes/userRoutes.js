const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/userApprovalController');
const { adminLimiter } = require('../middleware/rateLimiter');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, controller.getUsers);
router.get('/pending', authenticateToken, requireAdmin, controller.getPendingUsers);
router.post('/', authenticateToken, requireAdmin, adminLimiter, controller.createUser);
router.patch('/:id', authenticateToken, requireAdmin, adminLimiter, controller.updateUser);
router.patch('/:id/approve', authenticateToken, requireAdmin, adminLimiter, controller.approveUser);
router.patch('/:id/reject', authenticateToken, requireAdmin, adminLimiter, controller.rejectUser);
router.delete('/:id', authenticateToken, requireAdmin, adminLimiter, controller.deleteUser);

module.exports = router;

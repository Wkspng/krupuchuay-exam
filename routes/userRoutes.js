const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const controller = require('../controllers/userApprovalController');

const router = express.Router();

router.get('/', authenticateToken, requireAdmin, controller.getUsers);
router.get('/pending', authenticateToken, requireAdmin, controller.getPendingUsers);
router.post('/', authenticateToken, requireAdmin, controller.createUser);
router.patch('/:id', authenticateToken, requireAdmin, controller.updateUser);
router.patch('/:id/approve', authenticateToken, requireAdmin, controller.approveUser);
router.patch('/:id/reject', authenticateToken, requireAdmin, controller.rejectUser);
router.delete('/:id', authenticateToken, requireAdmin, controller.deleteUser);

module.exports = router;

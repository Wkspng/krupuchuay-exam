const express = require('express');
const controller = require('../controllers/categoryController');
const { authenticateToken, optionalAuthenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', optionalAuthenticateToken, controller.getCategories);
router.post('/', authenticateToken, requireAdmin, controller.createCategory);
router.put('/:id', authenticateToken, requireAdmin, controller.updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, controller.deleteCategory);

module.exports = router;

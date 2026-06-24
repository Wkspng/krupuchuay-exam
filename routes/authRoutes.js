const express = require('express');
const controller = require('../controllers/authController');

const router = express.Router();

router.get('/firebase-config', controller.getFirebaseConfig);
router.post('/register', controller.register);
router.post('/login', controller.login);

module.exports = router;

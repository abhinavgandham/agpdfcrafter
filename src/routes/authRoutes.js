const express = require('express');
const { login } = require('../controllers/loginController');
const { logout } = require('../controllers/logoutController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/logout', authenticateToken, logout);

module.exports = router;
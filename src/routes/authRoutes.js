const express = require('express');
const { register,confirmRegistration,login } = require('../controllers/cognitoController');
const { logout } = require('../controllers/logoutController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/confirm-registration', confirmRegistration);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);

module.exports = router;
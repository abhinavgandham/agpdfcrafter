const express = require('express');
const { register,confirmRegistration,login, 
    createAdminUser, promoteToAdmin, demoteFromAdmin, removeUser } = require('../controllers/cognitoController');
const { logout } = require('../controllers/logoutController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/confirm-registration', confirmRegistration);
router.post('/login', login);
router.post('/logout', authenticateToken, logout);
router.post('/createAdminUser', authenticateToken, createAdminUser);
router.post('/promoteToAdmin', authenticateToken, promoteToAdmin);
router.post('/demoteFromAdmin', authenticateToken, demoteFromAdmin);
router.post('/removeUser', authenticateToken, removeUser);

module.exports = router;
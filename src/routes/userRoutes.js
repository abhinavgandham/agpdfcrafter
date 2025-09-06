const express = require('express');
const router = express.Router();
const { getAllUsers, getUserById } = require('../controllers/userController');
const { authenticateToken } = require('../middleware/auth');

router.get('/getAllUsers/', authenticateToken, getAllUsers);
router.get('/getUserById/:id', authenticateToken, getUserById);


module.exports = router;
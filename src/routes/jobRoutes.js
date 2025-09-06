const express = require('express');
const router = express.Router();
const { getAllJobs } = require('../controllers/jobController');
const { getJobs } = require("../controllers/jobController")
const { authenticateToken }= require('../middleware/auth');

router.get('/getAllJobs', authenticateToken, getAllJobs);
router.get('/getJobs', authenticateToken, getJobs);

module.exports = router;
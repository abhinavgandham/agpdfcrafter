const express = require('express');
const { upload } = require('../controllers/uploadController');
const { convertFile } = require('../controllers/conversionController');
const { download } = require('../controllers/downloadController');
const { handleFileUpload } = require('../middleware/fileUpload');
const { authenticateToken }= require('../middleware/auth');

const router = express.Router();

router.post('/upload', authenticateToken, handleFileUpload, upload);
router.post('/convert', authenticateToken, convertFile);
router.get('/download/:filename', authenticateToken, download);

module.exports = router;
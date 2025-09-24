const multer = require('multer');
const path = require('path');
const { getParameterValue } = require('../cloudservices/parameterStore');

let uploadLimit;

// Get the upload limit parameter asynchronously
getParameterValue('/n11795611-abhinavgandham-cab432/app/file-upload-limit')
  .then(value => {
    uploadLimit = Number(value);
    console.log(`✅ Upload limit set to: ${uploadLimit} bytes`);
  })
  .catch(error => {
    console.error('❌ Error getting upload limit parameter, using default:', error);
  });

// File filter for allowed file types
const fileFilter = (req, file, callBack) => {
    // Array of allowed extensions
    const allowedExtensions = ['.html', '.docx', '.md'];

    // Boolean variable that checks where the file extension is valid
    const isValidExtension = allowedExtensions.includes(path.extname(file.originalname).toLowerCase());

    // If the file type or extension is not valid, return an error
    if (!isValidExtension) {
        return callBack(new Error('Unsupported file extension'))
    }

    // If the file extension is valid, return true
    callBack(null, true);
}

const uploadFile = multer({
    storage: multer.memoryStorage(),
    fileFilter: fileFilter,
    limits: {
        fileSize: uploadLimit, // 100MB limit
        files: 1 // Only 1 file per request
    }
})

const uploadSingleFile = uploadFile.single('file');

const handleFileUpload = (req, res, next) => {
    uploadSingleFile(req, res, (err) => {
        // If the file is too large, return an error
        if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                message: 'File is too large. Maximum file size is 100MB.'
            });
        }
        // Handling other error types
        if (err) {
            if (err.message === 'Unsupported file extension') {
                return res.status(400).json({
                    message: err.message
                })
            }
            else {
                return res.status(500).json({
                    message: 'An error occurred while uploading the file.'
                })
            }
        }
        next();
    });
};

module.exports = {
    uploadFile,
    uploadSingleFile,
    handleFileUpload
};

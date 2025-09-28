/**
 * Function to upload a file to the server.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object containing the file information.
 */
const upload = async (req, res) => {
    try {
        // Getting the file from the request object
        const file = req.file;

        // Checking if no file was uploaded by the user
        if (!file) {
            return res.status(400).json({
                message: 'No file uploaded'
            })
        }

         // Store file in memory for this user
         const username = req.user ? req.user.username : 'anonymous';
         req.app.locals.uploadedFiles = req.app.locals.uploadedFiles || new Map();
         req.app.locals.uploadedFiles.set(username, {
             originalname: file.originalname,
             buffer: file.buffer,
             size: file.size,
             mimetype: file.mimetype
         });

         // Return success
        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            fileName: file.originalname,
            mimeType: file.mimetype,
            fileSize: file.size,
            bufferLength: file.buffer.length
        })
    } catch (error) {
        return res.status(500).json({message: "An unexpected error occured."})
    }
}

module.exports = {upload};
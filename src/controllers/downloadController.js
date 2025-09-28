const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { conversionsPrefix } = require('../cloudservices/bucket.js');

/**
 * Function to download the converted file from s3.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object containing the s3 presigneddownload URL.
 */
const download = async (req, res) => {
    try {
        const { filename } = req.params;
        const s3Client = new S3Client({
            region: 'ap-southeast-2'
        });
        
        try {
            console.log(`Attempting S3 download for: ${filename}`);
            const command = new GetObjectCommand({
                Bucket: 'pdfconversions-abhinav-n11795611',
                Key: `${conversionsPrefix}${filename}`
            });
            
            const downloadUrl = await getSignedUrl(s3Client, command, { 
                expiresIn: 3600 
            });
            
            console.log(`S3 download URL generated successfully for: ${filename}`);
            return res.json({ downloadUrl });
            
        } catch (s3Error) {
            console.log(`S3 failed for ${filename}:`, s3Error.message);
            console.log(`S3 error details:`, s3Error);
        }
        
    } catch (error) {
        console.error('Download error:', error);
        return res.status(500).json({
            message: "Error downloading file",
            error: error.message
        });
    }
}

module.exports = { download }
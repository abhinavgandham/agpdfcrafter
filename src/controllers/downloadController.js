const fs = require('fs');
const path = require('path');
const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { conversionsPrefix } = require('../cloudservices/bucket.js');

const download = async (req, res) => {
    try {
        const { filename } = req.params;
        const s3Client = new S3Client({
            region: 'ap-southeast-2'
        });
        
        // Try S3 first
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
            // Fallback to local file system
            const filePath = path.join(__dirname, '../conversions', filename);
            
            if (fs.existsSync(filePath)) {
                res.setHeader('Content-Type', 'application/pdf');
                res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
                return res.sendFile(filePath);
            }
            
            return res.status(404).json({ message: "File not found" });
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
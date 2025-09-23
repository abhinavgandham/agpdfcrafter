const { 
    S3Client, PutObjectCommand
} = require("@aws-sdk/client-s3");
const { getBucketSecret } = require("./secretsManager");
const env = require('dotenv');

env.config();

const conversionsPrefix = 'conversions/';

const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-southeast-2'
});

/**
 * Function to set up the conversions directory structure in S3
 * @returns {Promise<{success: boolean, message: string, error: string}>}
 */
const setupConversionsDirectory = async () => {
    try {
        const bucketName = await getBucketSecret();
        
        // Create a placeholder file to establish the conversions "directory"
        const placeholderCommand = new PutObjectCommand({
            Bucket: bucketName,
            Key: `${conversionsPrefix}.gitkeep`, // Hidden file to maintain directory structure
            Body: Buffer.from(''), // Empty content as Buffer
            ContentType: 'text/plain'
        });
        
        await s3Client.send(placeholderCommand);
        return { success: true, message: 'Conversions directory structure created' };
        
    } catch (error) {
        console.error('Error creating conversions directory:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { 
    setupConversionsDirectory, 
    s3Client 
};
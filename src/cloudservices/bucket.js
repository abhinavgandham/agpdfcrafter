const { 
    S3Client, CreateBucketCommand, 
    ListBucketsCommand, GetBucketTaggingCommand, 
    PutBucketTaggingCommand, PutBucketLifecycleConfigurationCommand 
} = require("@aws-sdk/client-s3");
const env = require('dotenv');

env.config();

const bucketName = 'pdfconversions-abhinav-n11795611';

// Initialize S3 client
const s3Client = new S3Client({
    region: 'ap-southeast-2'
});

/**
 * Function to tag the bucket.
 * @returns {Promise<{success: boolean, message: string, error: string}>}
 */
const tagBucket = async () => {
    try {
        // First, try to get existing tags
        const getTags = await s3Client.send(new GetBucketTaggingCommand({ Bucket: bucketName }));
        const tags = getTags.TagSet || [];

        // Check if the tag already exists
        const tagExists = tags.some(tag => tag.Key === 'Name' && tag.Value === 'pdfconversions-abhinav-n11795611');
        if (tagExists) {
            return { success: true, message: 'Bucket is already tagged' };
        }

        // Add the new tag to existing tags
        const allTags = [...tags, { Key: 'Name', Value: 'pdfconversions-abhinav-n11795611' }];
        const createTag = new PutBucketTaggingCommand({ 
            Bucket: bucketName, 
            Tagging: { TagSet: allTags } 
        });
        const response = await s3Client.send(createTag);
        console.log('Bucket tagged successfully');
        return { success: true, message: 'Bucket tagged successfully' };

    } catch (error) {
        if (error.name === 'NoSuchTagSet') {
            // Bucket has no tags, add the first tag
            try {
                const createTag = new PutBucketTaggingCommand({ 
                    Bucket: bucketName, 
                    Tagging: { TagSet: [{ Key: 'Name', Value: 'pdfconversions-abhinav-n11795611' }] } 
                });
                await s3Client.send(createTag);
                console.log('Bucket tagged successfully (first tag)');
                return { success: true, message: 'Bucket tagged successfully' };
            } catch (createError) {
                console.error('Error creating first tag:', createError);
                return { success: false, error: createError.message };
            }
        } else {
            console.error('Error tagging bucket:', error);
            return { success: false, error: error.message };
        }
    }
}

/**
 * Function to create the bucket.
 * @returns {Promise<{success: boolean, message: string, error: string}>}
 */
const createBucket = async () => {
    // Getting the current list of buckets
    const listBuckets = await s3Client.send(new ListBucketsCommand({}));

    // Checking if the bucket exists in the list
    const bucketExists = listBuckets.Buckets.some(bucket => bucket.Name === bucketName);

   try {
    // If the bucket exists, return success
    if (bucketExists) {
        console.log(`Bucket '${bucketName}' already exists`);
        return { success: true, message: 'Bucket already exists' };
    } else {
        // If the bucket does not exist, create it and return success as this is normal behavior.
        const createCommand = new CreateBucketCommand({ Bucket: bucketName });
        const response = await s3Client.send(createCommand);
        console.log(`Bucket '${bucketName}' created successfully:`, response.Location);
        tagBucket();
        setupLifecyclePolicy();
        return { success: true, message: 'Bucket created successfully' };
    }
    
   } catch (error) {
    // If there is an error, return failure
    console.error('Error creating bucket:', error);
    return { success: false, error: error.message };
   }

}

/**
 * Function to setup the lifecycle policy.
 * @returns {Promise<{success: boolean, message: string, error: string}>}
 */
const setupLifecyclePolicy = async () => {
    try {
        const lifecycleConfig = {
            Bucket: bucketName,
            LifecycleConfiguration: {
                Rules: [
                    {
                        ID: 'DeleteAfter48Hours',
                        Status: 'Enabled',
                        Filter: {},
                        Expiration: {
                            Days: 2
                        }
                    }
                ]
            }
        };

        await s3Client.send(new PutBucketLifecycleConfigurationCommand(lifecycleConfig));
        console.log('Lifecycle policy set: Objects will be deleted after 48 hours');
        return { success: true, message: 'Lifecycle policy configured' };
    } catch (error) {
        console.error('Error setting lifecycle policy:', error);
        return { success: false, error: error.message };
    }
}

module.exports = { createBucket, tagBucket, s3Client };
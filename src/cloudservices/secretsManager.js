const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { getParameterValue } = require("./parameterStore");
const env = require('dotenv');
env.config();

// Initialise Secrets Manager client
const secretsManagerClient = new SecretsManagerClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
});

/**
 * Function to get the secret name from the parameter store.
 * @param {*} paramName 
 * @returns {Promise<string>} - The secret name.
 */
const getSecretName = async (paramName) => {
    try {
        return await getParameterValue(paramName);
    } catch (error) {
        console.error(`Error getting parameter ${paramName}:`, error);
        throw error;
    }
};


/**
 * Function to get the Cognito client secret from the secrets manager.
 * @returns {Promise<string>} - The Cognito client secret.
 */
const getCognitoClientSecret = async () => {
    let response;
    try {
        const secretName = await getSecretName('/n11795611-abhinavgandham-cab432/app/cognito-client-secret-name');
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: secretName,
            VersionStage: "AWSCURRENT",
        }))
    } catch (error) {
        console.error('Error getting Cognito client secret:', error);
        throw error;
    }

    console.log('Raw secret response:', response.SecretString);
    const secret = JSON.parse(response.SecretString);
    console.log('Parsed secret object:', secret);
    console.log('cognitoSecret value:', secret.cognitoSecret);
    
    return secret.cognitoSecret;
}


/**
 * Function to get the Cognito client ID from the secrets manager.
 * @returns {Promise<string>} - The Cognito client ID.
 */
const getCognitoIdSecret = async () => {
    let response;
    try {
        const secretName = await getSecretName('/n11795611-abhinavgandham-cab432/app/cognito-client-id-secret-name');
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: secretName,
            VersionStage: "AWSCURRENT",
        }))
    } catch (error) {
        console.error('Error getting Cognito client ID:', error);
        throw error;
    }

    console.log('Raw secret response:', response.SecretString);
    const secret = JSON.parse(response.SecretString);
    console.log('Parsed secret object:', secret);
    console.log('cognitoClientId value:', secret.cognitoClientId);
    
    return secret.cognitoClientId;
}


/**
 * Function to get the user pool ID from the secrets manager.
 * @returns {Promise<string>} - The user pool ID.
 */
const getUserPoolIdSecret = async () => {
    let response;
    try {
        const secretName = await getSecretName('/n11795611-abhinavgandham-cab432/app/user-pool-id-secret-name');
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: secretName,
            VersionStage: "AWSCURRENT",
        }))
    } catch (error) {
        console.error('Error getting user pool ID:', error);
        throw error;
    }

    console.log('Raw secret response:', response.SecretString);
    const secret = JSON.parse(response.SecretString);
    console.log('Parsed secret object:', secret);
    console.log('userPoolId value:', secret.userPoolId);
    
    return secret.userPoolId;
}


/**
 * Function to get the DynamoDB table name from the secrets manager.
 * @returns {Promise<string>} - The DynamoDB table name.
 */
const getDynamoDBSecret = async () => {
    let response;
    try {
        const secretName = await getSecretName('/n11795611-abhinavgandham-cab432/app/dynamodb-table-secret-name');
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: secretName,
            VersionStage: "AWSCURRENT",
        }))
    } catch (error) {
        console.error('Error getting DynamoDB secret:', error);
        throw error;
    }

    console.log('Raw secret response:', response.SecretString);
    const secret = JSON.parse(response.SecretString);
    console.log('Parsed secret object:', secret);
    console.log('tableName value:', secret.tableName);
    
    return secret.tableName;
}


/**
 * Function to get the S3 bucket name from the secrets manager.
 * @returns {Promise<string>} - The S3 bucket name.
 */
const getBucketSecret = async () => {
    let response;
    try {
        const secretName = await getSecretName('/n11795611-abhinavgandham-cab432/app/s3-bucket-secret-name');
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: secretName,
            VersionStage: "AWSCURRENT",
        }))
    } catch (error) {
        console.error('Error getting bucket secret:', error);
        throw error;
    }

    console.log('Raw secret response:', response.SecretString);
    const secret = JSON.parse(response.SecretString);
    console.log('Parsed secret object:', secret);
    console.log('bucketName value:', secret.bucketName);
    
    return secret.bucketName;
}




module.exports = { getCognitoClientSecret, getCognitoIdSecret, 
    getDynamoDBSecret, getBucketSecret, getUserPoolIdSecret };
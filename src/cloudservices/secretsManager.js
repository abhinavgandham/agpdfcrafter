const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const env = require('dotenv');
env.config();

// Initialise Secrets Manager client
const secretsManagerClient = new SecretsManagerClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
});

// Secret Names - using environment variables with fallbacks
const cognitioClientSecret = process.env.COGNITO_CLIENT_SECRET || "n11795611-cognitoSecret-assessment2";
const cognitioIdSecret = process.env.COGNITO_CLIENT_ID_SECRET || "n11795611-cognitoClientId-assessment2";
const userPoolIdSecret = process.env.USER_POOL_ID_SECRET || "n11795611-userPoolId-assessment2";
const dynamoDBSecret = process.env.DYNAMODB_TABLE_SECRET || "n11795611-dynamoDBTableName-assessment2";
const bucketSecret = process.env.S3_BUCKET_SECRET || "n11795611-bucketName-assessment2";

const getCognitoClientSecret = async () => {
    let response;
    try {
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: cognitioClientSecret,
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

const getCognitoIdSecret = async () => {
    let response;
    try {
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: cognitioIdSecret,
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

const getUserPoolIdSecret = async () => {
    let response;
    try {
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: userPoolIdSecret,
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


const getDynamoDBSecret = async () => {
    let response;
    try {
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: dynamoDBSecret,
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

const getBucketSecret = async () => {
    let response;
    try {
        response = await secretsManagerClient.send(new GetSecretValueCommand({
            SecretId: bucketSecret,
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
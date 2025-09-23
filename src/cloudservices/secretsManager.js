const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");
const { getParameterValue } = require("./parameterStore");
const env = require('dotenv');
env.config();

// Initialise Secrets Manager client
const secretsManagerClient = new SecretsManagerClient({
    region: process.env.AWS_REGION || "ap-southeast-2",
});

// Get secret names from Parameter Store
const getSecretName = async (paramName) => {
    try {
        return await getParameterValue(paramName);
    } catch (error) {
        console.error(`Error getting parameter ${paramName}:`, error);
        throw error;
    }
};

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
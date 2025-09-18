const { SecretsManagerClient, GetSecretValueCommand } = require("@aws-sdk/client-secrets-manager");

// Initialize Secrets Manager client
const secretsManagerClient = new SecretsManagerClient({
    region: "ap-southeast-2",
});

// Secret name
const cognitioClientSecret = "n11795611-cognitoSecret-assessment2";

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

module.exports = { getCognitoClientSecret };
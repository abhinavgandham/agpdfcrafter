const { CognitoIdentityProviderClient, GlobalSignOutCommand } = require("@aws-sdk/client-cognito-identity-provider");

const cognitoClient = new CognitoIdentityProviderClient({
    region: "ap-southeast-2",
});

/**
 * Function to logout the user from the application.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object containing the logout status.
 */
const logout = async (req, res) => {
    try {
        // Get the access token from the request
        const authHeader = req.headers['authorization'];
        const accessToken = authHeader && authHeader.split(' ')[1];

        // Checking if the access token is not present in the request header.
        if (!accessToken) {
            return res.status(400).json({
                success: false,
                message: 'Access token is required for logout'
            });
        }

        // Sign out from Cognito globally
        const signOutCommand = new GlobalSignOutCommand({
            AccessToken: accessToken
        });

        await cognitoClient.send(signOutCommand);

        res.status(200).json({
            success: true,
            message: 'Logged out successfully from all devices'
        });

    } catch (error) {
        console.error('Logout error:', error);
        
        // Handle specific Cognito errors
        if (error.name === 'NotAuthorizedException') {
            return res.status(401).json({
                success: false,
                message: 'Invalid or expired token'
            });
        } else if (error.name === 'UserNotFoundException') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to logout'
        });
    }
};

module.exports = { logout };
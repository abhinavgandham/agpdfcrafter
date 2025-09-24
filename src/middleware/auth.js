const jwt = require('aws-jwt-verify');
const { getCognitoIdSecret, getUserPoolIdSecret } = require('../cloudservices/secretsManager');

const dotenv = require('dotenv');
dotenv.config();

// Create JWT verifier for Cognito ID tokens
const createIdVerifier = async () => {
    const userPoolId = await getUserPoolIdSecret();
    const clientId = await getCognitoIdSecret();
    return jwt.CognitoJwtVerifier.create({
        userPoolId: userPoolId,
        tokenUse: "id",
        clientId: clientId,
    });
};

const authenticateToken = async (req, res, next) => {  
    try {
        const header = req.headers['authorization'];
        const token = header && header.split(' ')[1];

        // Check if there is no token in the authorization header
        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'No token provided'
            });
        }
        
        
        // Verify the Cognito ID token
        const idVerifier = await createIdVerifier();
        const payload = await idVerifier.verify(token);
        
        // Check user's role by looking at group membership
        let role = 'normal user'; // default
        
        // First try to get role from custom:Role attribute
        if (payload['custom:Role']) {
            role = payload['custom:Role'];
        }
        
        // If no custom:Role, check if user is in admin group
        if (role === 'normal user') {
            try {
                const { checkUserGroupMembership } = require('../controllers/cognitoController');
                const isAdmin = await checkUserGroupMembership(payload['cognito:username'], 'admin');
                if (isAdmin) {
                    role = 'admin';
                }
            } catch (error) {
                console.error('Error checking group membership:', error);
                // Continue with default role
            }
        }
        
        // Add user information to request object
        req.user = {
            id: payload.sub,
            username: payload['cognito:username'],
            email: payload.email,
            role: role,
            fullName: payload.name,
            tokenPayload: payload
        };

        next();
    } catch (error) {
        console.error('Token verification error:', error);

        switch (error.name) {
            case 'TokenExpiredError':
                return res.status(401).json({
                    success: false,
                    message: 'Token has expired'
                });
            case 'JsonWebTokenError':
                return res.status(403).json({
                    success: false,
                    message: 'Invalid token'
                });
            case 'NotBeforeError':
                return res.status(403).json({
                    success: false,
                    message: 'Token not active yet'
                });
            default:
                return res.status(403).json({
                    success: false,
                    message: 'Token verification failed'
                });
        }
    }
};

module.exports = {
    authenticateToken
};
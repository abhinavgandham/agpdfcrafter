const jwt = require('aws-jwt-verify');

const dotenv = require('dotenv');
dotenv.config();

// Cognito configuration
const userPoolId = "ap-southeast-2_8XCJUIAAd";
const clientId = "h5741pe9oeeg12e37me15045r";

// Create JWT verifier for Cognito ID tokens
const idVerifier = jwt.CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: "id",
    clientId: clientId,
});

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
        
        // Try to decode the token header to see the kid
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const header = JSON.parse(Buffer.from(tokenParts[0], 'base64').toString());
                console.log('Token header:', header);
                console.log('Key ID (kid):', header.kid);
            }
        } catch (e) {
            console.log('Could not decode token header:', e.message);
        }
        
        // Verify the Cognito ID token
        const payload = await idVerifier.verify(token);
        
        // Add user information to request object
        req.user = {
            id: payload.sub,
            username: payload['cognito:username'],
            email: payload.email,
            role: payload['custom:role'] || 'normal user',
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
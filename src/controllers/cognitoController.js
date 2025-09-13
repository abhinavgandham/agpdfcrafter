const { CognitoIdentityProviderClient, SignUpCommand, 
    InitiateAuthCommand, AuthFlowType, 
    ConfirmSignUpCommand, AdminUpdateUserAttributesCommand,
    AdminCreateUserCommand, AdminSetUserPasswordCommand} = require("@aws-sdk/client-cognito-identity-provider");
const jwt = require("aws-jwt-verify");
const crypto = require("crypto");

// Get values from your cognito.js configuration
const userPoolId = "ap-southeast-2_8XCJUIAAd";
const clientId = "h5741pe9oeeg12e37me15045r";
const clientSecret = "1qpg7pp1uk6bj3l6sl8qu4dig4c2kagubi103br662rrhhjlu4bm";

const cognitoClient = new CognitoIdentityProviderClient({
    region: "ap-southeast-2",
});

const secretHash = (clientId, clientSecret, username) => {
    const hasher = crypto.createHmac('sha256', clientSecret);
    hasher.update(`${username}${clientId}`);
    return hasher.digest('base64');
}

const accessVerifier = jwt.CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: "access",
    clientId: clientId,
});

const idVerifier = jwt.CognitoJwtVerifier.create({
    userPoolId: userPoolId,
    tokenUse: "id",
    clientId: clientId,
});

const register = async (req, res) => {
    try {
        const { username, password, email, fullName, role = "normal user" } = req.body;
        
        // Security: All new registrations are normal users by default
        // Admin roles must be assigned manually by existing admins

        // Validate required fields
        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and email are required'
            });
        }

        // Create user in Cognito
        const signUpCommand = new SignUpCommand({
            ClientId: clientId,
            Username: username,
            Password: password,
            SecretHash: secretHash(clientId, clientSecret, username),
            UserAttributes: [
                {
                    Name: 'email',
                    Value: email
                },
                {
                    Name: 'name',
                    Value: fullName || username
                },
                {
                    Name: 'custom:Role',
                    Value: role
                }
            ]
        });

        const result = await cognitoClient.send(signUpCommand);

        res.status(201).json({
            success: true,
            message: 'User registered successfully. Please check your email for verification.',
            data: {
                userSub: result.UserSub,
                codeDeliveryDetails: result.CodeDeliveryDetails
            }
        });

    } catch (error) {
        console.error('Registration error:', error);
        
        // Handle specific Cognito errors
        if (error.name === 'UsernameExistsException') {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        } else if (error.name === 'InvalidPasswordException') {
            return res.status(400).json({
                success: false,
                message: 'Password does not meet requirements'
            });
        } else if (error.name === 'InvalidParameterException') {
            return res.status(400).json({
                success: false,
                message: 'Invalid parameters provided'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during registration'
        });
    }
};

const confirmRegistration = async (req, res) => {
    try {
        const { username, confirmationCode } = req.body;

        if (!username || !confirmationCode) {
            return res.status(400).json({
                success: false,
                message: 'Username and confirmation code are required'
            });
        }

        const confirmSignUpCommand = new ConfirmSignUpCommand({
            ClientId: clientId,
            Username: username,
            ConfirmationCode: confirmationCode,
            SecretHash: secretHash(clientId, clientSecret, username)
        });

        await cognitoClient.send(confirmSignUpCommand);

        res.status(200).json({
            success: true,
            message: 'Email verification successful. You can now login.'
        });

    } catch (error) {
        console.error('Confirmation error:', error);
        
        if (error.name === 'CodeMismatchException') {
            return res.status(400).json({
                success: false,
                message: 'Invalid confirmation code'
            });
        } 
        if (error.name === 'ExpiredCodeException') {
            return res.status(400).json({
                success: false,
                message: 'Confirmation code has expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during confirmation'
        });
    }
};

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        const authCommand = new InitiateAuthCommand({
            AuthFlow: AuthFlowType.USER_PASSWORD_AUTH,
            AuthParameters: {
                USERNAME: username,
                PASSWORD: password,
                SECRET_HASH: secretHash(clientId, clientSecret, username),
            },
            ClientId: clientId,
        });

        const result = await cognitoClient.send(authCommand);

        if (!result.AuthenticationResult) {
            res.status(401).json({
                success: false,
                message: 'Authentication failed'
            }); 
        } else {
             // Verify the tokens
             const idTokenVerifyResult = await idVerifier.verify(result.AuthenticationResult.IdToken);
             
             res.status(200).json({
                 success: true,
                 message: 'Login successful',
                 data: {
                     user: {
                         id: idTokenVerifyResult.sub,
                         username: idTokenVerifyResult['cognito:username'],
                         email: idTokenVerifyResult.email,
                         role: idTokenVerifyResult['custom:Role'] || 'normal user',
                         fullName: idTokenVerifyResult.name
                     },
                     tokens: {
                         idToken: result.AuthenticationResult.IdToken,
                         accessToken: result.AuthenticationResult.AccessToken,
                         refreshToken: result.AuthenticationResult.RefreshToken
                     }
                 }
             });
        }

    } catch (error) {
        console.error('Login error:', error);
        
        if (error.name === 'NotAuthorizedException') {
            console.log()
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        } else if (error.name === 'UserNotConfirmedException') {
            return res.status(401).json({
                success: false,
                message: 'Please verify your email before logging in'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during login'
        });
    }
};

const createAdminUser = async (req, res) => {
    try {
        const { username, email, fullName, password } = req.body;
        const { role } = req.user;

        // Only existing admins can create new admin users
        if (role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Only admins can create admin users'
            });
        }

        if (!username || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username, email, and password are required'
            });
        }

        // Step 1: Create the user
        const createUserCommand = new AdminCreateUserCommand({
            UserPoolId: userPoolId,
            Username: username,
            UserAttributes: [
                {
                    Name: 'email',
                    Value: email
                },
                {
                    Name: 'name',
                    Value: fullName || username
                },
                {
                    Name: 'email_verified',
                    Value: 'true'
                },
                {
                    Name: 'custom:Role',
                    Value: 'admin'
                }
            ],
            TemporaryPassword: password,
            MessageAction: 'SUPPRESS' // Don't send welcome email
        });

        await cognitoClient.send(createUserCommand);

        // Step 2: Set permanent password
        const setPasswordCommand = new AdminSetUserPasswordCommand({
            UserPoolId: userPoolId,
            Username: username,
            Password: password,
            Permanent: true
        });

        await cognitoClient.send(setPasswordCommand);

        res.status(201).json({
            success: true,
            message: 'Admin user created successfully',
            data: {
                username,
                email,
                fullName: fullName || username,
                role: 'admin'
            }
        });

    } catch (error) {
        console.error('Create admin user error:', error);

        if (error.name === 'UsernameExistsException') {
            return res.status(409).json({
                success: false,
                message: 'Username already exists'
            });
        } else if (error.name === 'InvalidPasswordException') {
            return res.status(400).json({
                success: false,
                message: 'Password does not meet requirements'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during admin user creation'
        });
    }
};


const promoteToAdmin = async (req, res) => {
    try {
        const { username } = req.body;
        const { role } = req.user;

        // Only admins can promote users
        if (role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Only admins can promote users'
            });
        }

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        // Update user's role to admin in Cognito
        const updateUserAttributesCommand = new AdminUpdateUserAttributesCommand({
            UserPoolId: userPoolId,
            Username: username,
            UserAttributes: [
                {
                    Name: 'custom:Role',
                    Value: 'admin'
                }
            ]
        });

        await cognitoClient.send(updateUserAttributesCommand);

        res.status(200).json({
            success: true,
            message: 'User promoted to admin successfully'
        });

    } catch (error) {
        console.error('Promote to admin error:', error);

        if (error.name === 'UserNotFoundException') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during promote to admin'
        });
    }
}

const demoteFromAdmin = async (req, res) => {
    try {
        const { username } = req.body;
        const { role } = req.user;

        // Only admins can demote users
        if (role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'Unauthorized: Only admins can demote users'
            });
        }

        if (!username) {
            return res.status(400).json({
                success: false,
                message: 'Username is required'
            });
        }

        // Update user's role to normal user in Cognito
        const updateUserAttributesCommand = new AdminUpdateUserAttributesCommand({
            UserPoolId: userPoolId,
            Username: username,
            UserAttributes: [
                {
                    Name: 'custom:Role',
                    Value: 'normal user'
                }
            ]
        });
        await cognitoClient.send(updateUserAttributesCommand);

        res.status(200).json({
            success: true,
            message: 'User successfully demoted from admin.'
        });
    } catch (error) {
        console.error('Demote from admin error:', error);

        if (error.name === 'UserNotFoundException') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during demote from admin'
        });
    }
};

const removeUser = async (req, res) => {
    try {
        const { username } = req.body;
        const removeUserCommand = new AdminDeleteUserCommand({
            UserPoolId: userPoolId,
            Username: username
        });
        await cognitoClient.send(removeUserCommand);

        res.status(200).json({
            success: true,
            message: 'User removed successfully'
        });
    } catch (error) {
        console.error('Remove user error:', error);

        if (error.name === 'UserNotFoundException') {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during remove user'
        });
    }
}


module.exports = {
    register,
    confirmRegistration,
    login,
    createAdminUser,
    promoteToAdmin,
    demoteFromAdmin,
    removeUser
};
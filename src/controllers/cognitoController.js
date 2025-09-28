const { CognitoIdentityProviderClient, SignUpCommand, 
    InitiateAuthCommand, AuthFlowType, 
    ConfirmSignUpCommand,
    AdminCreateUserCommand, AdminSetUserPasswordCommand,
    AdminGetUserCommand, RespondToAuthChallengeCommand, ChallengeNameType, AdminAddUserToGroupCommand,
    AdminRemoveUserFromGroupCommand, AdminListGroupsForUserCommand} = require("@aws-sdk/client-cognito-identity-provider");
const jwt = require("aws-jwt-verify");
const crypto = require("crypto");
const { getCognitoClientSecret, getCognitoIdSecret, getUserPoolIdSecret } = require("../cloudservices/secretsManager");


/**
 * Getter function for Cognito client ID
 * @returns {Promise<string>} Cognito client ID
 */
const getClientId = async () => {
    return await getCognitoIdSecret();
}

/**
 * Getter function for Cognito user pool ID
 * @returns {Promise<string>} Cognito user pool ID
 */
const getUserPoolId = async () => {
    return await getUserPoolIdSecret();
}

/**
 * Getter function for cognito client name
 * @returns {Promise<string>} Cognito client name
 */
const getCognitoClientName = async () => {
    return await getCognitoClientSecret();
}

/**
 * Initialises the cognito client.
 */
const cognitoClient = new CognitoIdentityProviderClient({
    region: "ap-southeast-2",
});

/**
 * Function to generate a secret hash for the user.
 * @param {*} clientId - Cognito client ID
 * @param {*} clientSecret - Cognito client secret
 * @param {*} username - Username
 * @returns {string} Secret hash
 */
const secretHash = (clientId, clientSecret, username) => {
    const hasher = crypto.createHmac('sha256', clientSecret);
    hasher.update(`${username}${clientId}`);
    return hasher.digest('base64');
}

/**
 * Function to create a JWT verifier for the user.
 * @returns {Promise<jwt.CognitoJwtVerifier>} JWT verifier
 */
const createIdVerifier = async () => {
    const userPoolId = await getUserPoolId();
    const clientId = await getClientId();
    return jwt.CognitoJwtVerifier.create({
        userPoolId: userPoolId,
        tokenUse: "id",
        clientId: clientId,
    });
};

/**
 * Function to check if a user is a member of a specific group.
 * @param {string} username - The username to check
 * @param {string} groupName - The group name to check
 * @returns {Promise<boolean>} - True if user is in the group, false otherwise
 */
const checkUserGroupMembership = async (username, groupName) => {
    try {
        const userPoolId = await getUserPoolId();
        console.log(`Checking if user ${username} is in group ${groupName} in pool ${userPoolId}`);
        
        const listGroupsForUserCommand = new AdminListGroupsForUserCommand({
            UserPoolId: userPoolId,
            Username: username
        });
        
        const result = await cognitoClient.send(listGroupsForUserCommand);
        console.log(`User ${username} is in groups:`, result.Groups.map(g => g.GroupName));
        
        const isInGroup = result.Groups.some(group => group.GroupName === groupName);
        console.log(`User ${username} is in group ${groupName}: ${isInGroup}`);
        
        return isInGroup;
    } catch (error) {
        console.error('Error checking group membership:', error);
        return false;
    }
};

/**
 * Function to register a new user.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object
 */
const register = async (req, res) => {
    try {
        const { username, password, email, fullName, role = "normal user" } = req.body;

        // Validate required fields
        if (!username || !password || !email) {
            return res.status(400).json({
                success: false,
                message: 'Username, password, and email are required'
            });
        }

        const clientSecret = await getCognitoClientName();
        const clientId = await getClientId();

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

/**
 * Function to confirm a new user.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object
 */
const confirmRegistration = async (req, res) => {
    try {
        const { username, confirmationCode } = req.body;

        if (!username || !confirmationCode) {
            return res.status(400).json({
                success: false,
                message: 'Username and confirmation code are required'
            });
        }

        const clientSecret = await getCognitoClientName();
        const clientId = await getClientId();

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

/**
 * Function to login a user.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object
 */
const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        const clientSecret = await getCognitoClientName();
        const clientId = await getClientId();

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
        console.log('Cognito InitiateAuth result:', JSON.stringify(result, null, 2)); // Detailed debug log
        console.log('Cognito ChallengeName:', result.ChallengeName); // Debug log for challenge name
        
        const resultChallenge = result.ChallengeName;
        const resultSession = result.Session;

        // Handle MFA
        if (result.ChallengeName === ChallengeNameType.SOFTWARE_TOKEN_MFA) {
            return res.status(200).json({
                success: true,
                mfaRequired: true,
                challengeName: resultChallenge,
                session: resultSession,
                username: username,
                message: 'Please enter the code from your authenticator app.',
            })
        }

        // Handle Email OTP MFA
        if (result.ChallengeName === 'EMAIL_OTP') {
            return res.status(200).json({
                success: true,
                mfaRequired: true,
                challengeName: resultChallenge,
                session: resultSession,
                username: username,
                message: 'Please enter the code sent to your email.',
            })
        }
        if (!result.AuthenticationResult) {
            return res.status(401).json({
                success: false,
                message: 'Authentication failed'
            });
        }
        
        const idVerifier = await createIdVerifier();
        const idTokenVerifyResult = await idVerifier.verify(result.AuthenticationResult.IdToken);
        
        // Check user's role by looking at group membership
        let role = 'normal user'; // default
        
        try {
            const isAdmin = await checkUserGroupMembership(idTokenVerifyResult['cognito:username'], 'admin');
            if (isAdmin) {
                role = 'admin';
            }
        } catch (error) {
            console.error('Error checking group membership during login:', error);
            // Fall back to custom:Role attribute if group check fails
            role = idTokenVerifyResult['custom:Role'] || 'normal user';
        }

        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: idTokenVerifyResult.sub,
                    username: idTokenVerifyResult['cognito:username'],
                    email: idTokenVerifyResult.email,
                    role: role,
                    fullName: idTokenVerifyResult.name
                },
                tokens: {
                    idToken: result.AuthenticationResult.IdToken,
                    accessToken: result.AuthenticationResult.AccessToken,
                    refreshToken: result.AuthenticationResult.RefreshToken
                }
            }
        });

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

/**
 * Function to verify MFA.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object
 */
const verifyMFA = async (req, res) => {
    try {
        const { session, mfaCode, username, challengeName } = req.body;

        if (!session || !mfaCode || !username) {
            return res.status(400).json({
                success: false,
                message: 'Session, MFA code, and username are required'
            });
        }

        const clientSecret = await getCognitoClientName();
        const clientId = await getClientId();

        const respondCommand = new RespondToAuthChallengeCommand({
            ClientId: clientId,
            ChallengeName: challengeName || ChallengeNameType.SOFTWARE_TOKEN_MFA,
            Session: session,
            ChallengeResponses: {
                SOFTWARE_TOKEN_MFA_CODE: mfaCode,
                EMAIL_OTP_CODE: mfaCode,
                USERNAME: username,
                SECRET_HASH: secretHash(clientId, clientSecret, username)
            }
        });

        const result = await cognitoClient.send(respondCommand);

        if (result.AuthenticationResult) {
            // MFA verification successful
            const idVerifier = await createIdVerifier();
            const idTokenVerifyResult = await idVerifier.verify(result.AuthenticationResult.IdToken);
            
            // Check user's role by looking at group membership
            let role = 'normal user'; // default
            
            try {
                const isAdmin = await checkUserGroupMembership(idTokenVerifyResult['cognito:username'], 'admin');
                if (isAdmin) {
                    role = 'admin';
                }
            } catch (error) {
                console.error('Error checking group membership during MFA verification:', error);
                // Fall back to custom:Role attribute if group check fails
                role = idTokenVerifyResult['custom:Role'] || 'normal user';
            }
            
            res.status(200).json({
                success: true,
                message: 'MFA verification successful',
                data: {
                    user: {
                        id: idTokenVerifyResult.sub,
                        username: idTokenVerifyResult['cognito:username'],
                        email: idTokenVerifyResult.email,
                        role: role,
                        fullName: idTokenVerifyResult.name
                    },
                    tokens: {
                        idToken: result.AuthenticationResult.IdToken,
                        accessToken: result.AuthenticationResult.AccessToken,
                        refreshToken: result.AuthenticationResult.RefreshToken
                    }
                }
            });
        } else {
            res.status(400).json({
                success: false,
                message: 'MFA verification failed'
            });
        }

    } catch (error) {
        console.error('MFA verification error:', error);
        
        if (error.name === 'CodeMismatchException') {
            return res.status(400).json({
                success: false,
                message: 'Invalid authenticator code'
            });
        } else if (error.name === 'ExpiredCodeException') {
            return res.status(400).json({
                success: false,
                message: 'Authenticator code has expired'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Internal server error during MFA verification'
        });
    }
};

/**
 * Function to create a new admin user.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object
 */
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
        const userPoolId = await getUserPoolId();

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

/**
 * Function to promote a user to admin.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object
 */
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

        const userPoolId = await getUserPoolId();

        const addUserToGroupCommand = new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: username,
            GroupName: 'admin'
        });

        await cognitoClient.send(addUserToGroupCommand);

        try {
            const isAdmin = await checkUserGroupMembership(username, 'admin');
            console.log(`After promotion, user ${username} is admin: ${isAdmin}`);
        } catch (error) {
            console.error('Error testing group membership after promotion:', error);
        }

        res.status(200).json({
            success: true,
            message: 'User promoted to admin successfully. Please log out and log back in to see the updated role.'
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

/**
 * Function to demote a user from admin.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object
 */
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

        const userPoolId = await getUserPoolId();

        // Normal group is created by CloudFormation

        // NEW APPROACH: Remove user from admin group and add to normal group
        const removeUserFromGroupCommand = new AdminRemoveUserFromGroupCommand({
            UserPoolId: userPoolId,
            Username: username,
            GroupName: 'admin'
        });
        await cognitoClient.send(removeUserFromGroupCommand);

        const addUserToNormalGroupCommand = new AdminAddUserToGroupCommand({
            UserPoolId: userPoolId,
            Username: username,
            GroupName: 'normal'
        });
        await cognitoClient.send(addUserToNormalGroupCommand);

        try {
            await sendDemotionEmail(username, email);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue anyway - don't fail the demotion if email fails
        }

        res.status(200).json({
            success: true,
            message: 'User successfully demoted from admin. Please log out and log back in to see the updated role.'
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


module.exports = {
    register,
    confirmRegistration,
    login,
    createAdminUser,
    promoteToAdmin,
    demoteFromAdmin,
    verifyMFA,
    checkUserGroupMembership
};
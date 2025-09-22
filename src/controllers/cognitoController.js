const { CognitoIdentityProviderClient, SignUpCommand, 
    InitiateAuthCommand, AuthFlowType, 
    ConfirmSignUpCommand, AdminUpdateUserAttributesCommand,
    AdminCreateUserCommand, AdminSetUserPasswordCommand,
    AdminGetUserCommand, RespondToAuthChallengeCommand, ChallengeNameType, AssociateSoftwareTokenCommand,
    VerifySoftwareTokenCommand, AdminDeleteUserCommand} = require("@aws-sdk/client-cognito-identity-provider");
const { SESClient, SendEmailCommand } = require("@aws-sdk/client-ses");
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
 * Initialises the cognito client.
 */
const cognitoClient = new CognitoIdentityProviderClient({
    region: "ap-southeast-2",
});

/**
 * Initialises the SES client.
 */
const sesClient = new SESClient({
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

        const clientSecret = await getCognitoClientSecret();
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

        const clientSecret = await getCognitoClientSecret();
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

        const clientSecret = await getCognitoClientSecret();
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

        const clientSecret = await getCognitoClientSecret();
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
            
            res.status(200).json({
                success: true,
                message: 'MFA verification successful',
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
 * Function to get user details.
 * @param {*} username - Username of the user to get details for.
 * @returns {Promise<AdminGetUserCommandOutput>} - User details
 */
const getUserDetails = async (username) => {
    const userPoolId = await getUserPoolId();
    const userDetailsCommand = new AdminGetUserCommand({
        UserPoolId: userPoolId,
        Username: username
    });

    const userDetails = await cognitoClient.send(userDetailsCommand);

    return userDetails;
}

/**
 * Function to send a promotion email to the user.
 * @param {*} username - Username of the user to send the email to.
 * @param {*} email - Email of the user to send the email to.
 * @returns {Promise<void>} - Promise that resolves when the email is sent.
 */
const sendPromotionEmail = async (username, email) => {
    const sendEmailCommand = new SendEmailCommand({
        Source: "pdfconverter@cab432.com",
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Subject: {
                Data: "Congratulations! You have been promoted to admin",
                Charset: "UTF-8"
            },
            Body: {
                Text: {
                    Data: `Hi ${username}, you have been promoted to admin. You can now manage users and jobs.`,
                    Charset: "UTF-8"
                }
            }
        }
    })

    await sesClient.send(sendEmailCommand);
}

/**
 * Function to send a demotion email to the user.
 * @param {*} username - Username of the user to send the email to.
 * @param {*} email - Email of the user to send the email to.
 * @returns {Promise<void>} - Promise that resolves when the email is sent.
 */

const sendDemotionEmail = async (username, email) => {
    const sendEmailCommand = new SendEmailCommand({
        Source: "pdfconverter@cab432.com",
        Destination: {
            ToAddresses: [email]
        },
        Message: {
            Subject: {
                Data: "You have been demoted from admin",
                Charset: "UTF-8"
            },
            Body: {
                Text: {
                    Data: `Hi ${username}, you have been demoted from admin. You can no longer manage users and jobs.`,
                    Charset: "UTF-8"
                }
            }
        }
    })

    await sesClient.send(sendEmailCommand);
}

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

        const userDetails = await getUserDetails(username);

        const emailAttr = userDetails.UserAttributes.find(attr => attr.Name === 'email');
        if (!emailAttr) {
            return res.status(400).json({
                success: false,
                message: 'User email not found'
            });
        }
        const email = emailAttr.Value;

        const userPoolId = await getUserPoolId();

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

        // Send email before responding
        try {
            await sendPromotionEmail(username, email);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue anyway - don't fail the promotion if email fails
        }

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

        const userDetails = await getUserDetails(username);

        const emailAttr = userDetails.UserAttributes.find(attr => attr.Name === 'email');
        if (!emailAttr) {
            return res.status(400).json({
                success: false,
                message: 'User email not found'
            });
        }
        const email = emailAttr.Value;

        const userPoolId = await getUserPoolId();

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

        // Send email before responding
        try {
            await sendDemotionEmail(username, email);
        } catch (emailError) {
            console.error('Email sending failed:', emailError);
            // Continue anyway - don't fail the demotion if email fails
        }

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

module.exports = {
    register,
    confirmRegistration,
    login,
    createAdminUser,
    promoteToAdmin,
    demoteFromAdmin,
    verifyMFA
};
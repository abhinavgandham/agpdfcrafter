const { CognitoIdentityProviderClient, ListUsersCommand, AdminListGroupsForUserCommand } = require("@aws-sdk/client-cognito-identity-provider");

// Cognito configuration
const userPoolId = "ap-southeast-2_8XCJUIAAd";

const cognitoClient = new CognitoIdentityProviderClient({
    region: "ap-southeast-2",
});

/**
 * Function to check iff the user is in the admin group.
 * @param {*} username 
 * @returns {Promise<boolean>} - True if user is in the admin group, false otherwise
 */
const checkUserGroupMembership = async (username) => {
    try {
        const command = new AdminListGroupsForUserCommand({
            UserPoolId: userPoolId,
            Username: username
        });
        const result = await cognitoClient.send(command);
        return result.Groups.some(group => group.GroupName === 'admin');
    } catch (error) {
        console.error('Error checking group membership:', error);
        return false;
    }
};


/**
 * Function to get all users in the application.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object containing the users.
 */
const getAllUsers = async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized" });
        }

        // Fetch users from Cognito
        const listUsersCommand = new ListUsersCommand({
            UserPoolId: userPoolId
        });

        const result = await cognitoClient.send(listUsersCommand);

        // Transform Cognito users to our format
        const cleanUsers = await Promise.all(result.Users.map(async (user, index) => {
            const attributes = user.Attributes.reduce((acc, attr) => {
                acc[attr.Name] = attr.Value;
                return acc;
            }, {});

            // Check if user is in admin group
            const isAdmin = await checkUserGroupMembership(user.Username);
            const userRole = isAdmin ? 'admin' : 'normal user';

            return {
                id: index + 1, // Generate sequential ID since Cognito doesn't have numeric IDs
                username: user.Username,
                email: attributes.email || '',
                fullName: attributes.name || user.Username,
                role: userRole
            };
        }));

        // Sort users
        const { sortBy = 'id', order = 'asc' } = req.query;
        cleanUsers.sort((a, b) => {
            if (order === 'asc') {
                return a[sortBy] > b[sortBy] ? 1 : -1;
            } else {
                return a[sortBy] < b[sortBy] ? 1 : -1;
            }
        });

        return res.status(200).json(cleanUsers);

    } catch (error) {
        console.error('Error fetching users from Cognito:', error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};


/**
 * Function to get a user by their ID.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object containing the user.
 */
const getUserById = async (req, res) => {
    try {
        const { role } = req.user;
        if (role !== 'admin') {
            return res.status(403).json({ message: "Unauthorized" });
        }

        const { id } = req.params;

        // Fetch users from Cognito
        const listUsersCommand = new ListUsersCommand({
            UserPoolId: userPoolId
        });

        const result = await cognitoClient.send(listUsersCommand);

        // Find user by ID (which is the index + 1)
        const userIndex = Number(id) - 1;
        const user = result.Users[userIndex];

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        // Transform Cognito user to our format
        const attributes = user.Attributes.reduce((acc, attr) => {
            acc[attr.Name] = attr.Value;
            return acc;
        }, {});

        // Check if user is in admin group
        const isAdmin = await checkUserGroupMembership(user.Username);
        const userRole = isAdmin ? 'admin' : 'normal user';

        const cleanUser = {
            id: Number(id),
            username: user.Username,
            email: attributes.email || '',
            fullName: attributes.name || user.Username,
            role: userRole
        };

        return res.status(200).json(cleanUser);

    } catch (error) {
        console.error('Error fetching user from Cognito:', error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};


/**
 * Function to get the current user.
 * @param {*} req - Request object
 * @param {*} res - Response object
 * @returns {Promise<void>} - Response object containing the current loged in user..
 */
const getCurrentUser = async (req, res) => {
    try {
        // Return the current user info from the authenticated request
        const { id, username, email, role, fullName } = req.user;
        
        return res.status(200).json({
            id: id,
            username: username,
            email: email,
            fullName: fullName,
            role: role
        });

    } catch (error) {
        console.error('Error getting current user:', error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};

module.exports = {getAllUsers, getUserById, getCurrentUser};
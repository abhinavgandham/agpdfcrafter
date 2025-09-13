const { CognitoIdentityProviderClient, ListUsersCommand } = require("@aws-sdk/client-cognito-identity-provider");

// Cognito configuration
const userPoolId = "ap-southeast-2_8XCJUIAAd";

const cognitoClient = new CognitoIdentityProviderClient({
    region: "ap-southeast-2",
});

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
        const cleanUsers = result.Users.map((user, index) => {
            const attributes = user.Attributes.reduce((acc, attr) => {
                acc[attr.Name] = attr.Value;
                return acc;
            }, {});

            return {
                id: index + 1, // Generate sequential ID since Cognito doesn't have numeric IDs
                username: user.Username,
                email: attributes.email || '',
                fullName: attributes.name || user.Username,
                role: attributes['custom:Role'] || 'normal user'
            };
        });

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

        const cleanUser = {
            id: Number(id),
            username: user.Username,
            email: attributes.email || '',
            fullName: attributes.name || user.Username,
            role: attributes['custom:Role'] || 'normal user'
        };

        return res.status(200).json(cleanUser);

    } catch (error) {
        console.error('Error fetching user from Cognito:', error);
        return res.status(500).json({ message: "Internal Server Error." });
    }
};

module.exports = {getAllUsers, getUserById};
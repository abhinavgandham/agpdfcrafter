const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check if the username or password is not provided
        if (!username || !password) {
            return res.status(400).json({
                success: false,
                message: 'Username and password are required'
            });
        }

        // Read users from JSON file
        const usersPath = path.join(__dirname, '../../users.json');
        const usersData = JSON.parse(fs.readFileSync(usersPath, 'utf8'));

        // Find user by username
        const user = usersData.users.find(u => u.username === username);

        // Checking user credentials
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }

        // Comparing provided password to the stored hashed password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        // Checking if the password is invalid
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid username or password'
            });
        }
        // Creating the payload that gets sent to the server  
        const payload = {
            userId: user.id,
            username: user.username,
            role: user.role,
            email: user.email
        };

        const JWT_SECRET = process.env.JWT_SECRET_KEY;
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });

        // Return success response with token
        res.status(200).json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    username: user.username,
                    role: user.role,
                    email: user.email,
                    fullName: user.fullName
                },
                token: token
            }
        });

    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
};

module.exports = {
    login
};
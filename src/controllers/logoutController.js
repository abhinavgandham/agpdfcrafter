const jwt = require('jsonwebtoken');

const logout = async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            message: 'Logged out successfully'
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Failed to logout'
        })
    }
}

module.exports = { logout};
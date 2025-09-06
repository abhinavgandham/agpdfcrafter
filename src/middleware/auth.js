const jwt = require('jsonwebtoken');

const dotenv = require('dotenv');
dotenv.config();

const secretKey = process.env.JWT_SECRET_KEY;

const authenticateToken = (req, res, next) => {  
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];

    // Check if there is no token in the authrization header.
    if (!token) return res.status(401).json({message: 'Unauthorized'});

    // Verifying if the token matches the scret key for the user.
    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.status(403).json({message: 'Forbidden'});
        req.user = user;
        next();
    });
}

module.exports = {
    authenticateToken
}
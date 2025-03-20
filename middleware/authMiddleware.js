const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

const authMiddleware = (req, res, next) => {
    try {
        // Get the token from the cookie
        const token = req.cookies.jwt;
        
        if (!token) {
            req.flash('error', 'Unauthorized access. Please log in.');
            return res.redirect('/account/login');
        }

        // Verify token
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                console.log('JWT Verification Error:', err);
                req.flash('error', 'Invalid token. Please log in again.');
                return res.redirect('/account/login');
            }
        
            console.log('Decoded Token:', decoded);  // 🔍 Debugging output
        
            if (decoded.account_type !== 'Employee' && decoded.account_type !== 'Admin') {
                req.flash('error', 'Access denied. Insufficient privileges.');
                return res.redirect('/account/login');
            }
        
            req.user = decoded;
            next();
        });  
    } catch (error) {
        console.error('Authentication error:', error);
        req.flash('error', 'Something went wrong. Please try again.');
        return res.redirect('/account/login');
    }
};

module.exports = authMiddleware;
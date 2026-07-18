const express = require('express'); // Express app
const router = express.Router();    // Router logic

const jwt = require('jsonwebtoken'); // Enable JSON Web Tokens

// Method to authenticate our JWT
function authenticateJWT(req, res, next) {
    const authHeader = req.headers['authorization'];

    // Return a structured error when the authorization header is missing.
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: 'Authentication is required.'
        });
    }

    // Separate the authentication scheme from the JWT.
    const headerParts = authHeader.split(' ');

    // Verify that the header uses the expected Bearer token format.
    if (headerParts.length !== 2 || headerParts[0] !== 'Bearer') {
        return res.status(401).json({
            success: false,
            message: 'The authorization header must use the Bearer token format.'
        });
    }

    const token = headerParts[1];

    // Verify the token before allowing the request to continue.
    jwt.verify(token, process.env.JWT_SECRET, (err, verified) => {
        if (err) {
            return res.status(401).json({
                success: false,
                message: 'The authentication token is invalid or has expired.'
            });
        }

        // Store the decoded token so later middleware can check the user role.
        req.auth = verified;

        next();
    });
}

// Verifies that the authenticated user has administrative privileges.
function authorizeAdmin(req, res, next) {
    // Reject the request when the decoded token does not contain the admin role.
    if (!req.auth || req.auth.role !== 'admin') {
        return res.status(403).json({
            success: false,
            message: 'Administrator privileges are required.'
        });
    }

    next();
}

// This is where we import the controllers we will route
const tripsController = require('../controllers/trips');
const authController = require('../controllers/authentication');

// Define route for registration endpoint
router
    .route('/register')
    .post(authController.register);

// Define route for login endpoint
router
    .route('/login')
    .post(authController.login);

// Define route for our trips endpoint
router
    .route('/trips')
    .get(tripsController.tripsList)
    .post(
        authenticateJWT,
        authorizeAdmin,
        tripsController.tripsAddTrip
    );

// GET Method routes tripsFindByCode - requires parameter
// PUT Method routes tripsUpdateTrip - requires parameter
router
    .route('/trips/:tripCode')
    .get(tripsController.tripsFindByCode)
    .put(
        authenticateJWT,
        authorizeAdmin,
        tripsController.tripsUpdateTrip
    );

module.exports = router;
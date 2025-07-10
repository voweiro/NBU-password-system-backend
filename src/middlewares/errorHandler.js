const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
    logger.error(err.stack);

    if (err.name === 'ValidationError') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err.name === 'UnauthorizedError') {
        return res.status(401).json({
            success: false,
            message: 'Invalid token'
        });
    }

    // Handle authentication errors
    if (err.message === 'Invalid credentials') {
        return res.status(401).json({
            success: false,
            message: 'Invalid email or password'
        });
    }

    // Handle other common authentication/authorization errors
    if (err.message === 'Email already registered') {
        return res.status(409).json({
            success: false,
            message: err.message
        });
    }

    if (err.message === 'User not found') {
        return res.status(404).json({
            success: false,
            message: err.message
        });
    }

    if (err.message === 'Current password is incorrect') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    if (err.message === 'Invalid role specified') {
        return res.status(400).json({
            success: false,
            message: err.message
        });
    }

    return res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
};

module.exports = {
    errorHandler
};
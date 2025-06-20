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

    return res.status(500).json({
        success: false,
        message: 'Internal server error'
    });
};

module.exports = {
    errorHandler
}; 
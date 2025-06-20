const express = require('express');
const AuthController = require('../controllers/auth.controller');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// Public routes
router.post('/register', AuthController.register);
router.post('/login', AuthController.login);

// Protected routes
router.get('/me', auth, AuthController.getProfile);
router.get('/profile', auth, AuthController.getProfile);
router.post('/change-password', auth, AuthController.changePassword);

module.exports = router; 
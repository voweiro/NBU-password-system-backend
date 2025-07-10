const express = require('express');
const EmailController = require('../controllers/email.controller');
const { auth } = require('../middlewares/auth');

const router = express.Router();

// Test email service connection
router.get('/test-connection', auth, EmailController.testEmailService);

// Send test email
router.post('/send-test', auth, EmailController.sendTestEmail);

module.exports = router;
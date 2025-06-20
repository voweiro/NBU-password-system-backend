const express = require('express');
const ActivityController = require('../controllers/activity.controller');
const { auth, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Routes for admin and above
router.get('/', authorize('admin', 'super_admin', 'ultra_admin'), ActivityController.getAllActivities);
router.get('/my-activities', auth, ActivityController.getMyActivities);

module.exports = router; 
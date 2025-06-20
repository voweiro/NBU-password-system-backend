const express = require('express');
const SystemController = require('../controllers/system.controller');
const { auth, authorize } = require('../middlewares/auth');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Routes for all authenticated users
router.get('/', SystemController.getAllSystems);
router.get('/my-systems', SystemController.getMySystems);
router.get('/category/:category', SystemController.getSystemsByCategory);
router.get('/:id', SystemController.getSystem);

// Routes for admin and above
router.post('/', authorize('admin', 'super_admin', 'ultra_admin'), SystemController.createSystem);
router.put('/:id', authorize('admin', 'super_admin', 'ultra_admin'), SystemController.updateSystem);

// Routes for super_admin and ultra_admin only
router.delete('/:id', authorize('super_admin', 'ultra_admin'), SystemController.deleteSystem);

module.exports = router; 
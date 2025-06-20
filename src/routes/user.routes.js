const express = require('express');
const { auth, authorize } = require('../middlewares/auth');
const UserController = require('../controllers/user.controller');

const router = express.Router();

// All routes require authentication
router.use(auth);

// Routes for super_admin and ultra_admin only
router.get('/', authorize('super_admin', 'ultra_admin'), UserController.getAllUsers);
router.post('/', authorize('super_admin', 'ultra_admin'), UserController.createUser);

// Routes accessible by the user themselves or super_admin/ultra_admin
router.get('/:id', auth, UserController.getUser);
router.put('/:id', auth, UserController.updateUser);
router.delete('/:id', authorize('super_admin', 'ultra_admin'), UserController.deleteUser);

module.exports = router; 
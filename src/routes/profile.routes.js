const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../config/database');
const { auth } = require('../middlewares/auth');
const { logActivity } = require('../utils/logger');

const router = express.Router();

// Get user profile
router.get('/', auth, async (req, res) => {
    try {
        const userId = req.user.id;
        
        const query = `
            SELECT 
                id,
                email,
                full_name,
                role,
                departments,
                created_at,
                updated_at
            FROM entries 
            WHERE id = $1 AND type = 'user'
        `;
        
        const result = await db.query(query, [userId]);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = result.rows[0];
        
        res.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                full_name: user.full_name,
                role: user.role,
                departments: user.departments || [],
                created_at: user.created_at,
                updated_at: user.updated_at
            }
        });
        
    } catch (error) {
        console.error('Error fetching user profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Change password
router.post('/change-password', auth, async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;
        
        // Validation
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ 
                message: 'Current password and new password are required' 
            });
        }
        
        if (newPassword.length < 6) {
            return res.status(400).json({ 
                message: 'New password must be at least 6 characters long' 
            });
        }
        
        // Get current user data
        const userQuery = 'SELECT password FROM entries WHERE id = $1 AND type = $2';
        const userResult = await db.query(userQuery, [userId, 'user']);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        const user = userResult.rows[0];
        
        // Verify current password
        const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
        if (!isCurrentPasswordValid) {
            // Log failed password change attempt
            await logActivity(userId, 'password_change_failed', {
                reason: 'Invalid current password',
                ip_address: req.ip
            });
            
            return res.status(400).json({ 
                message: 'Current password is incorrect' 
            });
        }
        
        // Check if new password is different from current
        const isSamePassword = await bcrypt.compare(newPassword, user.password);
        if (isSamePassword) {
            return res.status(400).json({ 
                message: 'New password must be different from current password' 
            });
        }
        
        // Hash new password
        const saltRounds = 10;
        const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);
        
        // Update password in database
        const updateQuery = `
            UPDATE entries 
            SET password = $1, updated_at = CURRENT_TIMESTAMP 
            WHERE id = $2 AND type = 'user'
        `;
        
        await db.query(updateQuery, [hashedNewPassword, userId]);
        
        // Log successful password change
        await logActivity(userId, 'password_changed', {
            message: 'Password changed successfully',
            ip_address: req.ip
        });
        
        res.json({
            success: true,
            message: 'Password changed successfully'
        });
        
    } catch (error) {
        console.error('Error changing password:', error);
        
        // Log error
        if (req.user && req.user.id) {
            await logActivity(req.user.id, 'password_change_error', {
                error: error.message,
                ip_address: req.ip
            });
        }
        
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update profile information (optional - for future use)
router.put('/update', auth, async (req, res) => {
    try {
        const { full_name, departments } = req.body;
        const userId = req.user.id;
        
        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramCount = 1;
        
        if (full_name !== undefined) {
            updates.push(`full_name = $${paramCount}`);
            values.push(full_name);
            paramCount++;
        }
        
        if (departments !== undefined) {
            updates.push(`departments = $${paramCount}`);
            values.push(departments);
            paramCount++;
        }
        
        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }
        
        updates.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);
        
        const query = `
            UPDATE entries 
            SET ${updates.join(', ')}
            WHERE id = $${paramCount} AND type = 'user'
            RETURNING id, email, full_name, role, departments, updated_at
        `;
        
        const result = await db.query(query, values);
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }
        
        // Log profile update
        await logActivity(userId, 'profile_updated', {
            updated_fields: Object.keys(req.body),
            ip_address: req.ip
        });
        
        res.json({
            success: true,
            message: 'Profile updated successfully',
            user: result.rows[0]
        });
        
    } catch (error) {
        console.error('Error updating profile:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

module.exports = router;
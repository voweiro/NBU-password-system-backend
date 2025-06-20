const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const UserModel = require('../models/user.model');
const ActivityModel = require('../models/activity.model');

class AuthService {
    static async register(userData, ipAddress) {
        const existingUser = await UserModel.findByEmail(userData.email);
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // Prevent creation of ultra-admin through regular registration
        if (userData.role === 'ultra_admin') {
            throw new Error('Invalid role specified');
        }

        const user = await UserModel.create(userData);
        await ActivityModel.log(user.id, 'USER_REGISTERED', { email: user.email }, ipAddress);

        const token = this.generateToken(user);
        return { user, token };
    }

    static async login(email, password, ipAddress) {
        const user = await UserModel.findByEmail(email);
        if (!user) {
            throw new Error('Invalid credentials');
        }

        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            throw new Error('Invalid credentials');
        }

        const isUltraAdmin = user.role === 'ultra_admin';
        
        // Only log non-ultra-admin logins
        if (!isUltraAdmin) {
            await ActivityModel.log(user.id, 'USER_LOGIN', { email: user.email }, ipAddress);
        }

        const token = this.generateToken(user);
        return { user, token };
    }

    static generateToken(user) {
        const isUltraAdmin = user.role === 'ultra_admin';
        
        return jwt.sign(
            { 
                id: user.id, 
                email: user.email, 
                role: user.role,
                isHidden: isUltraAdmin // Add flag for frontend to handle ultra-admin differently
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );
    }

    static async changePassword(userId, oldPassword, newPassword, ipAddress) {
        const user = await UserModel.findById(userId, true); // Include ultra-admin in search
        if (!user) {
            throw new Error('User not found');
        }

        const isValidPassword = await bcrypt.compare(oldPassword, user.password);
        if (!isValidPassword) {
            throw new Error('Current password is incorrect');
        }

        await UserModel.updatePassword(userId, newPassword);
        
        // Only log password changes for non-ultra-admin users
        if (user.role !== 'ultra_admin') {
            await ActivityModel.log(userId, 'PASSWORD_CHANGED', {}, ipAddress);
        }

        return { message: 'Password updated successfully' };
    }
}

module.exports = AuthService; 
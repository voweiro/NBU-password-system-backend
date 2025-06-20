const SystemModel = require('../models/system.model');
const ActivityModel = require('../models/activity.model');
const UserModel = require('../models/user.model');

class SystemService {
    static async createSystem(systemData, userId, ipAddress) {
        const system = await SystemModel.create({
            ...systemData,
            created_by: userId
        });

        await ActivityModel.log(
            userId,
            'SYSTEM_CREATED',
            { systemId: system.id, name: system.name },
            ipAddress
        );

        return system;
    }

    static async updateSystem(id, updateData, userId, ipAddress) {
        const existingSystem = await SystemModel.findById(id);
        if (!existingSystem) {
            throw new Error('System not found');
        }

        const system = await SystemModel.update(id, updateData);
        
        await ActivityModel.log(
            userId,
            'SYSTEM_UPDATED',
            { systemId: system.id, name: system.name },
            ipAddress
        );

        return system;
    }

    static async deleteSystem(id, userId, ipAddress) {
        const system = await SystemModel.delete(id);
        if (!system) {
            throw new Error('System not found');
        }

        await ActivityModel.log(
            userId,
            'SYSTEM_DELETED',
            { systemId: id, name: system.name },
            ipAddress
        );

        return system;
    }

    static async getSystem(id, userId, ipAddress) {
        // Get the user's permissions
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        const system = await SystemModel.findByIdWithPassword(id);
        if (!system) {
            throw new Error('System not found');
        }

        // Check if user has access to this system
        // Admins and above have full access, normal users are restricted by categories
        const hasAccess = user.role === 'admin' || user.role === 'super_admin' || user.role === 'ultra_admin' || 
            (user.allowed_categories || []).includes(system.category);

        if (!hasAccess) {
            throw new Error('Not authorized to access this system');
        }

        // Log the system view activity
        await ActivityModel.log(
            userId,
            'SYSTEM_VIEWED',
            { systemId: system.id, name: system.name },
            ipAddress
        );

        return system;
    }

    static async getAllSystems() {
        return SystemModel.getAll();
    }

    static async getAccessibleSystems(userId) {
        // Get the user's permissions
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        console.log('Debug - User info:', {
            id: user.id,
            role: user.role,
            allowed_categories: user.allowed_categories
        });

        // Get all systems
        const allSystems = await SystemModel.getAll();
        console.log('Debug - Total systems found:', allSystems.length);
        console.log('Debug - All systems:', allSystems.map(s => ({ id: s.id, name: s.name, category: s.category })));

        // If user is admin or above, return all systems regardless of allowed_categories
        if (user.role === 'admin' || user.role === 'super_admin' || user.role === 'ultra_admin') {
            console.log('Debug - User is admin or above, returning all systems');
            return allSystems;
        }

        // For normal users, filter systems based on their allowed categories
        // Ensure allowed_categories is an array and handle null/undefined cases
        let allowedCategories = [];
        if (user.allowed_categories) {
            // If it's a string (from database), parse it
            if (typeof user.allowed_categories === 'string') {
                try {
                    // Remove the curly braces and split
                    allowedCategories = user.allowed_categories.replace(/[{}]/g, '').split(',').filter(Boolean);
                } catch (error) {
                    console.error('Debug - Error parsing allowed_categories:', error);
                    allowedCategories = [];
                }
            } else if (Array.isArray(user.allowed_categories)) {
                allowedCategories = user.allowed_categories;
            }
        }

        console.log('Debug - User allowed categories after processing:', allowedCategories);

        // Process allowed_subcategories
        let allowedSubcategories = {};
        if (user.allowed_subcategories) {
            if (typeof user.allowed_subcategories === 'string') {
                try {
                    allowedSubcategories = JSON.parse(user.allowed_subcategories);
                } catch (error) {
                    console.error('Debug - Error parsing allowed_subcategories:', error);
                    allowedSubcategories = {};
                }
            } else if (typeof user.allowed_subcategories === 'object') {
                allowedSubcategories = user.allowed_subcategories;
            }
        }

        console.log('Debug - User allowed subcategories after processing:', allowedSubcategories);

        const filteredSystems = allSystems.filter(system => {
            // First check if user has access to the category
            if (!allowedCategories.includes(system.category)) {
                return false;
            }

            // Then check if the system has a subcategory and if user has access to it
            if (system.subcategory && allowedSubcategories[system.category]) {
                return allowedSubcategories[system.category].includes(system.subcategory);
            }

            // If system has no subcategory or user has no subcategory restrictions for this category
            return true;
        });

        console.log('Debug - Filtered systems:', filteredSystems.map(s => ({ 
            id: s.id, 
            name: s.name, 
            category: s.category, 
            subcategory: s.subcategory 
        })));

        return filteredSystems;
    }

    static async getSystemsByCreator(userId) {
        return SystemModel.getByCreator(userId);
    }

    static async getSystemsByCategory(category) {
        return SystemModel.getByCategory(category);
    }
}

module.exports = SystemService;
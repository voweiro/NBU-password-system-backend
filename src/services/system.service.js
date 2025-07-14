const SystemModel = require('../models/system.model');
const ActivityModel = require('../models/activity.model');
const UserModel = require('../models/user.model');

class SystemService {
    // Helper function to extract allowed categories from user object
    static extractAllowedCategories(user) {
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
        return allowedCategories;
    }
    static async createSystem(systemData, userId, ipAddress) {
        // Get the user's permissions
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if admin has access to create system in this category
        if (user.role === 'admin') {
            const allowedCategories = this.extractAllowedCategories(user);
            
            // Check if admin has access to this category
            if (!allowedCategories.includes(systemData.category)) {
                throw new Error('Not authorized to create system in this category');
            }
        }

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

        // Get the user's permissions
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if user has access to update this system
        // Super_admin and ultra_admin have full access
        // Admins are restricted by their allowed categories
        if (user.role === 'admin') {
            const allowedCategories = this.extractAllowedCategories(user);
            
            // Check if admin has access to this system's category
            if (!allowedCategories.includes(existingSystem.category)) {
                throw new Error('Not authorized to update this system - category restriction');
            }

            // If updating the category, check if admin has access to the new category
            if (updateData.category && !allowedCategories.includes(updateData.category)) {
                throw new Error('Not authorized to change system to this category');
            }
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
        // First get the system to check its category
        const existingSystem = await SystemModel.findById(id);
        if (!existingSystem) {
            throw new Error('System not found');
        }

        // Get the user's permissions
        const user = await UserModel.findById(userId);
        if (!user) {
            throw new Error('User not found');
        }

        // Check if admin has access to delete this system
        if (user.role === 'admin') {
            const allowedCategories = this.extractAllowedCategories(user);
            
            // Check if admin has access to this system's category
            if (!allowedCategories.includes(existingSystem.category)) {
                throw new Error('Not authorized to delete this system - category restriction');
            }
        }

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
        // Admin role is restricted by allowed_categories
        // super_admin and ultra_admin have full access
        if (user.role === 'admin') {
            const allowedCategories = this.extractAllowedCategories(user);
            
            if (!allowedCategories.includes(system.category)) {
                throw new Error('Not authorized to access this system - category restriction');
            }
        } else if (!['super_admin', 'ultra_admin'].includes(user.role)) {
            // For normal users, check if they have access to this system's category
            const allowedCategories = this.extractAllowedCategories(user);
            
            if (!allowedCategories.includes(system.category)) {
                throw new Error('Not authorized to access this system');
            }
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

        // Get all systems
        const allSystems = await SystemModel.getAll();

        // If user is super_admin or ultra_admin, return all systems regardless of allowed_categories
        if (user.role === 'super_admin' || user.role === 'ultra_admin') {
            return allSystems;
        }
        
        // For admin and normal users, filter systems based on their allowed categories
        const allowedCategories = this.extractAllowedCategories(user);
        
        // Process allowed_subcategories
        let allowedSubcategories = {};
        if (user.allowed_subcategories) {
            if (typeof user.allowed_subcategories === 'string') {
                try {
                    allowedSubcategories = JSON.parse(user.allowed_subcategories);
                } catch (error) {
                    console.error('Error parsing allowed_subcategories:', error);
                    allowedSubcategories = {};
                }
            } else if (typeof user.allowed_subcategories === 'object') {
                allowedSubcategories = user.allowed_subcategories;
            }
        }

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

        return filteredSystems;
    }

    static async getSystemsByCreator(userId) {
        return SystemModel.getByCreator(userId);
    }

    static async getSystemsByCategory(category, userId) {
        // Get all accessible systems for the user
        const accessibleSystems = await this.getAccessibleSystems(userId);
        
        // Filter by the requested category
        return accessibleSystems.filter(system => system.category === category);
    }
}

module.exports = SystemService;
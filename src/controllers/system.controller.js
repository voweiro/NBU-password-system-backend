const SystemService = require('../services/system.service');

class SystemController {
    static async createSystem(req, res, next) {
        try {
            const system = await SystemService.createSystem(
                req.body,
                req.user.id,
                req.ip
            );
            
            res.status(201).json({
                success: true,
                data: system
            });
        } catch (error) {
            next(error);
        }
    }

    static async updateSystem(req, res, next) {
        try {
            const system = await SystemService.updateSystem(
                req.params.id,
                req.body,
                req.user.id,
                req.ip
            );
            
            res.json({
                success: true,
                data: system
            });
        } catch (error) {
            next(error);
        }
    }

    static async deleteSystem(req, res, next) {
        try {
            await SystemService.deleteSystem(
                req.params.id,
                req.user.id,
                req.ip
            );
            
            res.json({
                success: true,
                message: 'System deleted successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    static async getSystem(req, res, next) {
        try {
            const system = await SystemService.getSystem(
                req.params.id,
                req.user.id,
                req.ip
            );
            
            res.json({
                success: true,
                data: system
            });
        } catch (error) {
            next(error);
        }
    }

    static async getAllSystems(req, res, next) {
        try {
            const systems = await SystemService.getAccessibleSystems(req.user.id);
            
            res.json({
                success: true,
                data: systems
            });
        } catch (error) {
            next(error);
        }
    }

    static async getMySystems(req, res, next) {
        try {
            const systems = await SystemService.getSystemsByCreator(req.user.id);
            
            res.json({
                success: true,
                data: systems
            });
        } catch (error) {
            next(error);
        }
    }

    static async getSystemsByCategory(req, res, next) {
        try {
            const { category } = req.params;
            const allSystems = await SystemService.getAccessibleSystems(req.user.id);
            const systems = allSystems.filter(system => system.category === category);
            
            res.json({
                success: true,
                data: systems
            });
        } catch (error) {
            next(error);
        }
    }
}

module.exports = SystemController; 
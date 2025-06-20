const AuthService = require('../services/auth.service');

class AuthController {
    static async register(req, res, next) {
        try {
            const { user, token } = await AuthService.register(req.body, req.ip);
            
            // Remove sensitive data
            delete user.password;
            
            res.status(201).json({
                success: true,
                data: { user, token }
            });
        } catch (error) {
            next(error);
        }
    }

    static async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const { user, token } = await AuthService.login(email, password, req.ip);
            
            // Remove sensitive data
            delete user.password;
            
            res.json({
                success: true,
                data: { user, token }
            });
        } catch (error) {
            next(error);
        }
    }

    static async changePassword(req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;
            const result = await AuthService.changePassword(
                req.user.id,
                oldPassword,
                newPassword,
                req.ip
            );
            
            res.json({
                success: true,
                message: result.message
            });
        } catch (error) {
            next(error);
        }
    }

    static async getProfile(req, res) {
        // Remove sensitive data
        const user = { ...req.user };
        delete user.password;
        
        res.json({
            success: true,
            data: user
        });
    }
}

module.exports = AuthController;
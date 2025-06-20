const ActivityModel = require('../models/activity.model');
const UserModel = require('../models/user.model');

class ActivityController {
    static async getAllActivities(req, res, next) {
        try {
            // Check if the requester is an ultra-admin
            const isUltraAdmin = await UserModel.isUltraAdmin(req.user.id);
            
            // If ultra-admin, they can see all activities including other ultra-admins
            const activities = isUltraAdmin 
                ? await ActivityModel.getAllIncludingUltraAdmin()
                : await ActivityModel.getAll();

            res.json({
                success: true,
                data: activities
            });

        } catch (error) {
            next(error);
        }
    }

    static async getMyActivities(req, res, next) {
        try {
            // Ultra-admin activities are not logged, so this will return empty for them
            const activities = await ActivityModel.getByUserId(req.user.id);

            res.json({
                success: true,
                data: activities
            });

        } catch (error) {
            next(error);
        }
    }
}

module.exports = ActivityController;
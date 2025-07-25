const ActivityModel = require('../models/activity.model');
const UserModel = require('../models/user.model');

class ActivityController {
    static async getAllActivities(req, res, next) {
        try {
            // Check if the requester is an ultra-admin
            const isUltraAdmin = await UserModel.isUltraAdmin(req.user.id);
            
            // Get all activities without pagination
            const activities = isUltraAdmin 
                ? await ActivityModel.getAllIncludingUltraAdmin()
                : await ActivityModel.getAll();
                
            const totalCount = activities.length;

            res.json({
                success: true,
                data: activities,
                totalItems: totalCount
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
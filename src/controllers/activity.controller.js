const ActivityModel = require('../models/activity.model');
const UserModel = require('../models/user.model');

class ActivityController {
    static async getAllActivities(req, res, next) {
        try {
            // Check if the requester is an ultra-admin
            const isUltraAdmin = await UserModel.isUltraAdmin(req.user.id);
            
            // Get pagination parameters
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const offset = (page - 1) * limit;
            
            // Get activities and total count
            const activities = isUltraAdmin 
                ? await ActivityModel.getAllIncludingUltraAdmin(limit, offset)
                : await ActivityModel.getAll(limit, offset);
                
            const totalCount = isUltraAdmin
                ? await ActivityModel.getCountIncludingUltraAdmin()
                : await ActivityModel.getCount();
            
            const totalPages = Math.ceil(totalCount / limit);

            res.json({
                success: true,
                data: activities,
                pagination: {
                    currentPage: page,
                    totalPages,
                    totalItems: totalCount,
                    itemsPerPage: limit,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1
                }
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
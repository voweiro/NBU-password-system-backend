const db = require('../config/database');

class ActivityModel {
    static async log(userId, action, details, ipAddress, isUltraAdmin = false) {
        // Don't log any ultra-admin activities
        if (isUltraAdmin) {
            return null;
        }

        const result = await db.query(
            'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4) RETURNING *',
            [userId, action, details, ipAddress]
        );
        return result.rows[0];
    }

    static async getAll(limit = null, offset = 0) {
        let query = `SELECT al.*, u.email as user_email, u.role as user_role
             FROM activity_logs al 
             LEFT JOIN entries u ON al.user_id = u.id 
             WHERE u.role != 'ultra_admin' 
             AND u.type = 'user'
             ORDER BY al.created_at DESC`;
        
        const params = [];
        if (limit) {
            query += ` LIMIT $1 OFFSET $2`;
            params.push(limit, offset);
        }
        
        const result = await db.query(query, params);
        return result.rows;
    }

    static async getByUserId(userId) {
        // First check if user is ultra-admin
        const userCheck = await db.query(
            'SELECT role FROM entries WHERE id = $1 AND type = $2',
            [userId, 'user']
        );
        
        // If ultra-admin, return empty array
        if (userCheck.rows[0]?.role === 'ultra_admin') {
            return [];
        }

        const result = await db.query(
            `SELECT al.*, u.role as user_role 
             FROM activity_logs al 
             LEFT JOIN entries u ON al.user_id = u.id
             WHERE al.user_id = $1 
             AND u.role != 'ultra_admin' 
             AND u.type = 'user'
             ORDER BY al.created_at DESC`,
            [userId]
        );
        return result.rows;
    }

    static async getCount(excludeUltraAdmin = true) {
        const query = excludeUltraAdmin
            ? `SELECT COUNT(*) FROM activity_logs al 
               LEFT JOIN entries u ON al.user_id = u.id 
               WHERE u.role != 'ultra_admin' AND u.type = 'user'`
            : 'SELECT COUNT(*) FROM activity_logs';
            
        const result = await db.query(query);
        return parseInt(result.rows[0].count);
    }

    // Special method for ultra-admin to view all activities if needed
    static async getAllIncludingUltraAdmin(limit = null, offset = 0) {
        let query = `SELECT al.*, u.email as user_email, u.role as user_role
             FROM activity_logs al 
             LEFT JOIN entries u ON al.user_id = u.id 
             WHERE u.type = 'user'
             ORDER BY al.created_at DESC`;
        
        const params = [];
        if (limit) {
            query += ` LIMIT $1 OFFSET $2`;
            params.push(limit, offset);
        }
        
        const result = await db.query(query, params);
        return result.rows;
    }

    static async getCountIncludingUltraAdmin() {
        const result = await db.query(
            'SELECT COUNT(*) FROM activity_logs al LEFT JOIN entries u ON al.user_id = u.id WHERE u.type = \'user\''
        );
        return parseInt(result.rows[0].count);
    }
}

module.exports = ActivityModel;
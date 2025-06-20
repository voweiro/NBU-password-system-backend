const db = require('../config/database');
const bcrypt = require('bcrypt');

class UserModel {
    // Define available system categories
    static SYSTEM_CATEGORIES = ['web_software', 'database', 'network'];

    static async create({
        full_name,
        email,
        password,
        role,
        allowed_categories = [],
        allowed_subcategories = {}
    }) {
        // Validate system categories
        const validCategories = allowed_categories.filter(cat => 
            this.SYSTEM_CATEGORIES.includes(cat.toLowerCase())
        );

        const hashedPassword = await bcrypt.hash(password, 10);
        const query = `
            INSERT INTO entries (
                type,
                full_name,
                email,
                password,
                role,
                allowed_categories,
                allowed_subcategories
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id, type, full_name, email, role, allowed_categories, allowed_subcategories, created_at, updated_at
        `;

        const values = [
            'user',
            full_name,
            email,
            hashedPassword,
            role,
            validCategories,
            allowed_subcategories
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async update(id, {
        full_name,
        email,
        password,
        role,
        allowed_categories,
        allowed_subcategories
    }) {
        // Validate system categories if provided
        const validCategories = allowed_categories ? allowed_categories.filter(cat => 
            this.SYSTEM_CATEGORIES.includes(cat.toLowerCase())
        ) : undefined;

        let query = `
            UPDATE entries 
            SET full_name = $1,
                email = $2,
                role = $3
        `;
        const values = [full_name, email, role];

        // Add allowed categories to update if provided
        if (validCategories) {
            query += `, allowed_categories = $${values.length + 1}`;
            values.push(validCategories);
        }

        // Add allowed subcategories to update if provided
        if (allowed_subcategories) {
            query += `, allowed_subcategories = $${values.length + 1}`;
            values.push(allowed_subcategories);
        }

        // Add password to update if provided and not empty
        if (password && password.trim() !== '') {
            const hashedPassword = await bcrypt.hash(password, 10);
            query += `, password = $${values.length + 1}`;
            values.push(hashedPassword);
        }

        query += `, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length + 1} AND type = $${values.length + 2} RETURNING id, type, full_name, email, role, allowed_categories, allowed_subcategories, created_at, updated_at`;
        values.push(id, 'user');

        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT 
                u.id,
                u.type,
                u.full_name,
                u.email,
                u.role,
                u.allowed_categories,
                u.allowed_subcategories,
                u.created_at,
                u.updated_at
            FROM entries u
            WHERE u.id = $1 AND u.type = 'user'
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findByEmail(email) {
        const query = `
            SELECT 
                u.id,
                u.type,
                u.full_name,
                u.email,
                u.password,
                u.role,
                u.allowed_categories,
                u.allowed_subcategories,
                u.created_at,
                u.updated_at
            FROM entries u
            WHERE u.email = $1 AND u.type = 'user'
        `;
        const result = await db.query(query, [email]);
        return result.rows[0];
    }

    static async findAll() {
        const query = `
            SELECT 
                u.id,
                u.type,
                u.full_name,
                u.email,
                u.role,
                u.allowed_categories,
                u.allowed_subcategories,
                u.created_at,
                u.updated_at
            FROM entries u
            WHERE u.type = 'user' AND u.role != 'ultra_admin'
            ORDER BY u.created_at DESC
        `;
        const result = await db.query(query);
        return result.rows;
    }

    static async delete(id) {
        return db.query('BEGIN')
            .then(async () => {
                // First check if user is ultra_admin
                const userQuery = 'SELECT role FROM entries WHERE id = $1 AND type = $2';
                const userResult = await db.query(userQuery, [id, 'user']);
                
                if (!userResult.rows[0] || userResult.rows[0].role === 'ultra_admin') {
                    await db.query('ROLLBACK');
                    return null;
                }

                // Delete related activity logs first
                const deleteLogsQuery = 'DELETE FROM activity_logs WHERE user_id = $1';
                await db.query(deleteLogsQuery, [id]);

                // Then delete the user
                const deleteUserQuery = 'DELETE FROM entries WHERE id = $1 AND type = $2 RETURNING *';
                const result = await db.query(deleteUserQuery, [id, 'user']);

                await db.query('COMMIT');
                return result.rows[0];
            })
            .catch(async (error) => {
                await db.query('ROLLBACK');
                throw error;
            });
    }

    static async validatePassword(user, password) {
        return bcrypt.compare(password, user.password);
    }

    static async getAllUsers() {
        return this.findAll();
    }

    static async isUltraAdmin(userId) {
        const query = `
            SELECT role
            FROM entries
            WHERE id = $1 AND type = 'user'
        `;
        const result = await db.query(query, [userId]);
        return result.rows[0]?.role === 'ultra_admin';
    }
}

module.exports = UserModel;
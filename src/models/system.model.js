const db = require('../config/database');
const crypto = require('crypto');

// Encryption key and IV configuration
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error('ENCRYPTION_KEY must be exactly 32 characters long');
}

const IV_LENGTH = 16;

class SystemModel {
    static encrypt(text) {
        if (!text) return null;
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
        let encrypted = cipher.update(text);
        encrypted = Buffer.concat([encrypted, cipher.final()]);
        return iv.toString('hex') + ':' + encrypted.toString('hex');
    }

    static decrypt(text) {
        if (!text) return null;
        try {
            const textParts = text.split(':');
            const iv = Buffer.from(textParts.shift(), 'hex');
            const encryptedText = Buffer.from(textParts.join(':'), 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
            let decrypted = decipher.update(encryptedText);
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            return decrypted.toString();
        } catch (error) {
            console.error('Decryption error:', error);
            return null;
        }
    }

    static async create({
        name,
        description,
        category,
        subcategory,
        username,
        password,
        url,
        notes,
        created_by
    }) {
        const encryptedPassword = this.encrypt(password);
        const query = `
            INSERT INTO entries (
                type,
                name,
                description,
                category,
                subcategory,
                username,
                password,
                url,
                notes,
                created_by
            )
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
            RETURNING *
        `;

        const values = [
            'system',
            name,
            description,
            category,
            subcategory,
            username,
            encryptedPassword,
            url,
            notes,
            created_by
        ];
        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async update(id, {
        name,
        description,
        category,
        subcategory,
        username,
        password,
        url,
        notes
    }) {
        const encryptedPassword = this.encrypt(password);
        const query = `
            UPDATE entries
            SET name = $1,
                description = $2,
                category = $3,
                subcategory = $4,
                username = $5,
                password = $6,
                url = $7,
                notes = $8,
                updated_at = CURRENT_TIMESTAMP
            WHERE id = $9 AND type = 'system'
            RETURNING *
        `;

        const values = [
            name,
            description,
            category,
            subcategory,
            username,
            encryptedPassword,
            url,
            notes,
            id
        ];

        const result = await db.query(query, values);
        return result.rows[0];
    }

    static async findById(id) {
        const query = `
            SELECT 
                s.id,
                s.type,
                s.name,
                s.description,
                s.category,
                s.subcategory,
                s.username,
                s.url,
                s.notes,
                s.created_by,
                s.created_at,
                s.updated_at,
                u.email as created_by_email
            FROM entries s
            LEFT JOIN entries u ON s.created_by = u.id
            WHERE s.id = $1 AND s.type = 'system'
        `;
        const result = await db.query(query, [id]);
        return result.rows[0];
    }

    static async findAll() {
        const query = `
            SELECT 
                s.id,
                s.type,
                s.name,
                s.description,
                s.category,
                s.subcategory,
                s.username,
                s.url,
                s.notes,
                s.created_by,
                s.created_at,
                s.updated_at,
                u.email as created_by_email
            FROM entries s
            LEFT JOIN entries u ON s.created_by = u.id
            WHERE s.type = 'system'
            ORDER BY s.created_at DESC
        `;
        const result = await db.query(query);
        console.log('Found systems:', result.rows.length);
        return result.rows;
    }

    static async findByCategory(category) {
        const query = `
            SELECT s.*, u.email as created_by_email
            FROM entries s
            LEFT JOIN entries u ON s.created_by = u.id
            WHERE s.type = 'system' AND s.category = $1
            ORDER BY s.subcategory, s.name
        `;
        const result = await db.query(query, [category]);
        return result.rows;
    }

    static async findBySubcategory(category, subcategory) {
        const query = `
            SELECT s.*, u.email as created_by_email
            FROM entries s
            LEFT JOIN entries u ON s.created_by = u.id
            WHERE s.type = 'system' AND s.category = $1 AND s.subcategory = $2
            ORDER BY s.name
        `;
        const result = await db.query(query, [category, subcategory]);
        return result.rows;
    }

    static async delete(id) {
        const query = 'DELETE FROM entries WHERE id = $1 AND type = $2 RETURNING *';
        const result = await db.query(query, [id, 'system']);
        return result.rows[0];
    }

    static async getAccessibleSystems(userId) {
        const query = `
            SELECT s.*, u.email as created_by_email
            FROM entries s
            LEFT JOIN entries u ON s.created_by = u.id
            WHERE s.type = 'system'
            AND (
                s.created_by = $1
                OR EXISTS (
                    SELECT 1 FROM entries creator
                    WHERE creator.id = s.created_by
                    AND creator.role = 'ultra_admin'
                )
            )
            ORDER BY s.category, s.subcategory, s.name
        `;
        const result = await db.query(query, [userId]);
        return result.rows;
    }

    static async grantAccess(userId, systemId) {
        const query = `
            INSERT INTO user_system_access (user_id, system_id)
            VALUES ($1, $2)
            ON CONFLICT (user_id, system_id) DO NOTHING
            RETURNING *
        `;
        const result = await db.query(query, [userId, systemId]);
        return result.rows[0];
    }

    static async revokeAccess(userId, systemId) {
        const query = `
            DELETE FROM user_system_access
            WHERE user_id = $1 AND system_id = $2
            RETURNING *
        `;
        const result = await db.query(query, [userId, systemId]);
        return result.rows[0];
    }

    static async getAll() {
        return this.findAll();
    }

    // Add a method to get system with password
    static async findByIdWithPassword(id) {
        const query = `
            SELECT 
                s.id,
                s.type,
                s.name,
                s.description,
                s.category,
                s.subcategory,
                s.username,
                s.password,
                s.url,
                s.notes,
                s.created_by,
                s.created_at,
                s.updated_at,
                u.email as created_by_email
            FROM entries s
            LEFT JOIN entries u ON s.created_by = u.id
            WHERE s.id = $1 AND s.type = 'system'
        `;
        const result = await db.query(query, [id]);
        const system = result.rows[0];
        if (system && system.password) {
            system.password = this.decrypt(system.password);
        }
        return system;
    }
}

module.exports = SystemModel; 
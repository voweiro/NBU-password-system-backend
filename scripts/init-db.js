require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcrypt');
const db = require('../src/config/database');

const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: {
        rejectUnauthorized: false
    }
});

async function initializeDatabase() {
    const client = await pool.connect();
    try {
        console.log('Starting database initialization...');

        // Read the schema file
        const schemaPath = path.join(__dirname, '..', 'src', 'config', 'schema.sql');
        const schema = await fs.readFile(schemaPath, 'utf8');

        // Execute schema
        await client.query('BEGIN');
        
        console.log('Creating database schema...');
        await client.query(schema);

        // Create ultra admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const ultraAdminQuery = `
            INSERT INTO entries (
                type,
                email,
                password,
                role,
                full_name,
                departments
            )
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id
        `;
        const ultraAdminResult = await db.query(ultraAdminQuery, [
            'Ultra Admin',
            'ultra@nbu.edu.ng',
            hashedPassword,
            'ultra_admin',
            ['network', 'web_software', 'database']
        ]);
        const ultraAdminId = ultraAdminResult.rows[0].id;

        // Create some example systems
        const systemsData = [
            // Network Systems
            {
                name: 'VPN Access',
                description: 'Main VPN access for remote work',
                category: 'network',
                subcategory: 'vpn_services',
                username: 'vpn_admin',
                password: 'vpn123',
                url: 'https://vpn.nbu.edu.ng'
            },
            {
                name: 'Cloudflare DNS',
                description: 'DNS management for university domains',
                category: 'network',
                subcategory: 'dns_management',
                username: 'dns_admin',
                password: 'dns123',
                url: 'https://dash.cloudflare.com'
            },
            // Web Systems
            {
                name: 'GitHub Organization',
                description: 'University GitHub organization account',
                category: 'web_software',
                subcategory: 'development_tools',
                username: 'github_admin',
                password: 'git123',
                url: 'https://github.com/nbu'
            },
            {
                name: 'WordPress Admin',
                description: 'Main university website CMS',
                category: 'web_software',
                subcategory: 'cms_platforms',
                username: 'wp_admin',
                password: 'wp123',
                url: 'https://nbu.edu.ng/wp-admin'
            },
            // Database Systems
            {
                name: 'Production PostgreSQL',
                description: 'Main production database server',
                category: 'database',
                subcategory: 'sql_databases',
                username: 'pg_admin',
                password: 'pg123',
                url: 'postgresql://db.nbu.edu.ng'
            },
            {
                name: 'MongoDB Atlas',
                description: 'NoSQL database for research projects',
                category: 'database',
                subcategory: 'nosql_databases',
                username: 'mongo_admin',
                password: 'mongo123',
                url: 'https://cloud.mongodb.com'
            }
        ];

        // Insert systems
        for (const system of systemsData) {
            const systemQuery = `
                INSERT INTO systems (
                    name,
                    description,
                    category,
                    subcategory,
                    username,
                    password,
                    url
                ) VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING id
            `;
            const result = await db.query(systemQuery, [
                system.name,
                system.description,
                system.category,
                system.subcategory,
                system.username,
                system.password,
                system.url
            ]);

            // Grant access to ultra admin
            await db.query(
                'INSERT INTO user_system_access (user_id, system_id) VALUES ($1, $2)',
                [ultraAdminId, result.rows[0].id]
            );
        }

        await client.query('COMMIT');
        
        console.log('Database initialization completed successfully!');
        console.log('\nInitial ultra admin credentials:');
        console.log('Email: ultra@nbu.edu.ng');
        console.log('Password: admin123');
        console.log('\nIMPORTANT: Please change these credentials immediately after first login!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error initializing database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
        process.exit();
    }
}

initializeDatabase().catch(console.error); 
require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Database connection configuration
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

async function createTables() {
    const client = await pool.connect();
    try {
        console.log('Starting database setup...');

        // Begin transaction
        await client.query('BEGIN');

        console.log('Creating user_role enum type...');
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE user_role AS ENUM ('ultra_admin', 'super_admin', 'admin', 'user');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        console.log('Creating system_category enum type...');
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE system_category AS ENUM ('web_software', 'database', 'network');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        console.log('Creating entry_type enum type...');
        await client.query(`
            DO $$ BEGIN
                CREATE TYPE entry_type AS ENUM ('user', 'system');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);

        console.log('Creating unified entries table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS entries (
                id SERIAL PRIMARY KEY,
                type entry_type NOT NULL,
                email VARCHAR(255) UNIQUE,
                password VARCHAR(255),
                role user_role,
                full_name VARCHAR(200),
                departments TEXT[] DEFAULT '{}',
                name VARCHAR(255),
                description TEXT,
                username VARCHAR(255),
                category system_category,
                subcategory VARCHAR(50),
                url TEXT,
                notes TEXT,
                created_by INTEGER REFERENCES entries(id),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Creating activity_logs table...');
        await client.query(`
            CREATE TABLE IF NOT EXISTS activity_logs (
                id SERIAL PRIMARY KEY,
                user_id INTEGER REFERENCES entries(id),
                action VARCHAR(255) NOT NULL,
                details JSONB,
                ip_address VARCHAR(45),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Creating updated_at trigger function...');
        await client.query(`
            CREATE OR REPLACE FUNCTION update_updated_at_column()
            RETURNS TRIGGER AS $$
            BEGIN
                NEW.updated_at = CURRENT_TIMESTAMP;
                RETURN NEW;
            END;
            $$ language 'plpgsql'
        `);

        console.log('Creating triggers...');
        // Drop existing triggers if they exist
        await client.query(`
            DROP TRIGGER IF EXISTS update_entries_updated_at ON entries;
        `);

        // Create new triggers
        await client.query(`
            CREATE TRIGGER update_entries_updated_at
                BEFORE UPDATE ON entries
                FOR EACH ROW
                EXECUTE FUNCTION update_updated_at_column();
        `);

        // Create initial ultra admin user
        console.log('Creating initial ultra admin user...');
        const hashedPassword = await bcrypt.hash('ultraadmin123', 10);
        await client.query(`
            INSERT INTO entries (type, email, password, role, full_name)
            VALUES ($1, $2, $3, $4, $5)
            ON CONFLICT (email) DO NOTHING
        `, ['user', 'ultra.admin@nbu.edu', hashedPassword, 'ultra_admin', 'Ultra Administrator']);

        // Commit transaction
        await client.query('COMMIT');

        console.log('\nDatabase setup completed successfully!');
        console.log('\nInitial ultra admin credentials:');
        console.log('Email: ultra.admin@nbu.edu');
        console.log('Password: ultraadmin123');
        console.log('\nIMPORTANT: Please change these credentials immediately after first login!');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error setting up database:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
createTables().catch(error => {
    console.error('Failed to set up database:', error);
    process.exit(1);
}); 
require('dotenv').config();
const db = require('../src/config/database');

async function updateTableStructure() {
    try {
        console.log('Starting table structure update...');
        
        // Begin transaction
        await db.query('BEGIN');

        // Add allowed_categories column
        console.log('Adding allowed_categories column...');
        await db.query(`
            ALTER TABLE entries 
            ADD COLUMN IF NOT EXISTS allowed_categories system_category[] DEFAULT '{}'::system_category[]
        `);

        // Add allowed_subcategories column
        console.log('Adding allowed_subcategories column...');
        await db.query(`
            ALTER TABLE entries 
            ADD COLUMN IF NOT EXISTS allowed_subcategories jsonb DEFAULT '{}'::jsonb
        `);

        // Commit transaction
        await db.query('COMMIT');
        console.log('Table structure updated successfully');
    } catch (error) {
        await db.query('ROLLBACK');
        console.error('Error updating table structure:', error);
    } finally {
        // Close the database connection
        try {
            await db.pool.end();
            console.log('Database connection closed');
        } catch (err) {
            console.error('Error closing database connection:', err);
        }
        process.exit();
    }
}

// Run the update
console.log('Initializing database update...');
updateTableStructure(); 
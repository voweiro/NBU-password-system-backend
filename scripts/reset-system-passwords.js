const { Pool } = require('pg');
require('dotenv').config();

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

async function resetSystemPasswords() {
    try {
        console.log('🔄 Starting system password reset...');
        
        // Reset all system passwords to null
        const result = await pool.query(
            "UPDATE entries SET password = NULL WHERE type = 'system' RETURNING id, name"
        );
        
        const resetCount = result.rows.length;
        console.log(`✅ Successfully reset passwords for ${resetCount} systems:`);
        result.rows.forEach(system => {
            console.log(`   - ${system.name} (ID: ${system.id})`);
        });
        
        console.log('\n📝 Note: System administrators will need to set new passwords for these systems.');
    } catch (error) {
        console.error('❌ Error resetting passwords:', error.message);
    } finally {
        // Close the pool
        await pool.end();
    }
}

// Run the reset function
resetSystemPasswords(); 
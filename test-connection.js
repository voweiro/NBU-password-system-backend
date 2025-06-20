require('dotenv').config();
const { Pool } = require('pg');

console.log('Testing database connection...');
console.log('Environment variables:');
console.log('DB_USER:', process.env.DB_USER);
console.log('DB_HOST:', process.env.DB_HOST);
console.log('DB_NAME:', process.env.DB_NAME);
console.log('DB_PORT:', process.env.DB_PORT);
console.log('DB_PASSWORD:', process.env.DB_PASSWORD ? '***SET***' : 'NOT SET');

// Try different connection configurations
const connectionConfigs = [
    {
        name: 'Standard Supabase Pooler',
        config: {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: process.env.DB_PORT,
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            max: 20
        }
    },
    {
        name: 'Direct Supabase Connection',
        config: {
            user: process.env.DB_USER,
            host: process.env.DB_HOST.replace('.pooler', ''),
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: 5432,
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            max: 20
        }
    },
    {
        name: 'Alternative Pooler Port',
        config: {
            user: process.env.DB_USER,
            host: process.env.DB_HOST,
            database: process.env.DB_NAME,
            password: process.env.DB_PASSWORD,
            port: 5432,
            ssl: {
                rejectUnauthorized: false
            },
            connectionTimeoutMillis: 10000,
            idleTimeoutMillis: 30000,
            max: 20
        }
    }
];

async function testConnection(config, name) {
    const pool = new Pool(config);
    
    try {
        console.log(`\n🔍 Testing ${name}...`);
        console.log(`   Host: ${config.host}:${config.port}`);
        
        const client = await pool.connect();
        console.log(`✅ ${name} - Successfully connected!`);
        
        // Test a simple query
        const result = await client.query('SELECT NOW() as current_time, version() as version');
        console.log(`✅ ${name} - Query test successful:`, result.rows[0]);
        
        client.release();
        await pool.end();
        return true;
        
    } catch (error) {
        console.error(`❌ ${name} - Connection failed:`, error.message);
        if (error.code) {
            console.error(`   Error code: ${error.code}`);
        }
        await pool.end();
        return false;
    }
}

async function runTests() {
    console.log('\n🚀 Starting connection tests...\n');
    
    for (const connectionConfig of connectionConfigs) {
        const success = await testConnection(connectionConfig.config, connectionConfig.name);
        if (success) {
            console.log(`\n🎉 Found working connection: ${connectionConfig.name}`);
            console.log('You can use this configuration in your .env file:');
            console.log(`DB_HOST=${connectionConfig.config.host}`);
            console.log(`DB_PORT=${connectionConfig.config.port}`);
            return;
        }
    }
    
    console.log('\n❌ All connection attempts failed.');
    console.log('\n💡 Troubleshooting suggestions:');
    console.log('1. Check your Supabase project settings');
    console.log('2. Verify the connection string from Supabase dashboard');
    console.log('3. Check if your IP is whitelisted in Supabase');
    console.log('4. Try using the direct connection string from Supabase');
    console.log('5. Check your firewall/network settings');
}

runTests().catch(error => {
    console.error('Test runner error:', error);
    process.exit(1);
}); 
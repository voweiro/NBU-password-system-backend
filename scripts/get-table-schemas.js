require('dotenv').config();
const { Pool } = require('pg');

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

async function getTableSchemas() {
    const client = await pool.connect();
    try {
        console.log('Connecting to database...');
        console.log('Database:', process.env.DB_NAME);
        console.log('Host:', process.env.DB_HOST);
        console.log('\n' + '='.repeat(80));
        console.log('DATABASE SCHEMA INFORMATION');
        console.log('='.repeat(80));

        // Get all tables in the current database
        const tablesQuery = `
            SELECT 
                table_name,
                table_type
            FROM information_schema.tables 
            WHERE table_schema = 'public'
            ORDER BY table_name;
        `;
        
        const tablesResult = await client.query(tablesQuery);
        console.log(`\nFound ${tablesResult.rows.length} tables:\n`);

        for (const table of tablesResult.rows) {
            console.log(`\n${'─'.repeat(60)}`);
            console.log(`TABLE: ${table.table_name.toUpperCase()} (${table.table_type})`);
            console.log(`${'─'.repeat(60)}`);

            // Get columns for each table
            const columnsQuery = `
                SELECT 
                    column_name,
                    data_type,
                    character_maximum_length,
                    is_nullable,
                    column_default,
                    ordinal_position
                FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = $1
                ORDER BY ordinal_position;
            `;
            
            const columnsResult = await client.query(columnsQuery, [table.table_name]);
            
            console.log('\nCOLUMNS:');
            console.log('┌─────┬─────────────────────┬─────────────────────┬──────────┬─────────────────────┐');
            console.log('│ #   │ Column Name         │ Data Type           │ Nullable │ Default             │');
            console.log('├─────┼─────────────────────┼─────────────────────┼──────────┼─────────────────────┤');
            
            columnsResult.rows.forEach((column, index) => {
                const pos = (index + 1).toString().padEnd(3);
                const name = column.column_name.padEnd(19);
                let dataType = column.data_type;
                if (column.character_maximum_length) {
                    dataType += `(${column.character_maximum_length})`;
                }
                dataType = dataType.padEnd(19);
                const nullable = column.is_nullable.padEnd(8);
                const defaultVal = (column.column_default || 'NULL').padEnd(19);
                
                console.log(`│ ${pos} │ ${name} │ ${dataType} │ ${nullable} │ ${defaultVal} │`);
            });
            
            console.log('└─────┴─────────────────────┴─────────────────────┴──────────┴─────────────────────┘');

            // Get constraints for each table
            const constraintsQuery = `
                SELECT 
                    tc.constraint_name,
                    tc.constraint_type,
                    kcu.column_name,
                    ccu.table_name AS foreign_table_name,
                    ccu.column_name AS foreign_column_name
                FROM information_schema.table_constraints tc
                LEFT JOIN information_schema.key_column_usage kcu
                    ON tc.constraint_name = kcu.constraint_name
                    AND tc.table_schema = kcu.table_schema
                LEFT JOIN information_schema.constraint_column_usage ccu
                    ON ccu.constraint_name = tc.constraint_name
                    AND ccu.table_schema = tc.table_schema
                WHERE tc.table_schema = 'public'
                AND tc.table_name = $1
                ORDER BY tc.constraint_type, tc.constraint_name;
            `;
            
            const constraintsResult = await client.query(constraintsQuery, [table.table_name]);
            
            if (constraintsResult.rows.length > 0) {
                console.log('\nCONSTRAINTS:');
                constraintsResult.rows.forEach(constraint => {
                    let constraintInfo = `• ${constraint.constraint_type}: ${constraint.constraint_name}`;
                    if (constraint.column_name) {
                        constraintInfo += ` (${constraint.column_name})`;
                    }
                    if (constraint.foreign_table_name) {
                        constraintInfo += ` → ${constraint.foreign_table_name}.${constraint.foreign_column_name}`;
                    }
                    console.log(constraintInfo);
                });
            }

            // Get indexes for each table
            const indexesQuery = `
                SELECT 
                    indexname,
                    indexdef
                FROM pg_indexes 
                WHERE schemaname = 'public'
                AND tablename = $1
                ORDER BY indexname;
            `;
            
            const indexesResult = await client.query(indexesQuery, [table.table_name]);
            
            if (indexesResult.rows.length > 0) {
                console.log('\nINDEXES:');
                indexesResult.rows.forEach(index => {
                    console.log(`• ${index.indexname}`);
                    console.log(`  ${index.indexdef}`);
                });
            }
        }

        // Get custom types (enums)
        console.log(`\n\n${'='.repeat(80)}`);
        console.log('CUSTOM TYPES (ENUMS)');
        console.log('='.repeat(80));
        
        const enumsQuery = `
            SELECT 
                t.typname as enum_name,
                e.enumlabel as enum_value
            FROM pg_type t 
            JOIN pg_enum e ON t.oid = e.enumtypid  
            JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
            WHERE n.nspname = 'public'
            ORDER BY t.typname, e.enumsortorder;
        `;
        
        const enumsResult = await client.query(enumsQuery);
        
        if (enumsResult.rows.length > 0) {
            let currentEnum = '';
            enumsResult.rows.forEach(row => {
                if (row.enum_name !== currentEnum) {
                    if (currentEnum !== '') console.log('');
                    console.log(`\n${row.enum_name.toUpperCase()}:`);
                    currentEnum = row.enum_name;
                }
                console.log(`  • ${row.enum_value}`);
            });
        } else {
            console.log('\nNo custom types found.');
        }

        console.log(`\n\n${'='.repeat(80)}`);
        console.log('SCHEMA EXPORT COMPLETE');
        console.log('='.repeat(80));
        
    } catch (error) {
        console.error('Error retrieving table schemas:', error.message);
        console.error('Stack trace:', error.stack);
    } finally {
        client.release();
        await pool.end();
    }
}

// Run the script
if (require.main === module) {
    getTableSchemas()
        .then(() => {
            console.log('\nSchema retrieval completed successfully.');
            process.exit(0);
        })
        .catch(error => {
            console.error('Script failed:', error.message);
            process.exit(1);
        });
}

module.exports = { getTableSchemas };
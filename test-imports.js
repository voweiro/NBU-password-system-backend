console.log('Testing module imports...');

try {
    console.log('Testing auth routes...');
    const authRoutes = require('./src/routes/auth.routes');
    console.log('✓ auth.routes imported successfully');
} catch (error) {
    console.error('✗ Error importing auth.routes:', error.message);
}

try {
    console.log('Testing user routes...');
    const userRoutes = require('./src/routes/user.routes');
    console.log('✓ user.routes imported successfully');
} catch (error) {
    console.error('✗ Error importing user.routes:', error.message);
}

try {
    console.log('Testing system routes...');
    const systemRoutes = require('./src/routes/system.routes');
    console.log('✓ system.routes imported successfully');
} catch (error) {
    console.error('✗ Error importing system.routes:', error.message);
}

try {
    console.log('Testing activity routes...');
    const activityRoutes = require('./src/routes/activity.routes');
    console.log('✓ activity.routes imported successfully');
} catch (error) {
    console.error('✗ Error importing activity.routes:', error.message);
}

console.log('Import test completed.'); 
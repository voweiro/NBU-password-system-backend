const fs = require('fs');
const path = require('path');
const readline = require('readline');
const crypto = require('crypto');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const generateSecretKey = () => {
    return crypto.randomBytes(32).toString('hex');
};

const questions = [
    {
        name: 'DB_USER',
        message: 'Enter database username:',
        default: 'postgres'
    },
    {
        name: 'DB_PASSWORD',
        message: 'Enter database password:',
        default: 'your_password_here'
    },
    {
        name: 'DB_NAME',
        message: 'Enter database name:',
        default: 'password_management'
    },
    {
        name: 'DB_HOST',
        message: 'Enter database host:',
        default: 'localhost'
    },
    {
        name: 'DB_PORT',
        message: 'Enter database port:',
        default: '5432'
    }
];

const envPath = path.join(__dirname, '..', '.env');
const envExamplePath = path.join(__dirname, '..', '.env.example');

const askForOverwrite = () => {
    return new Promise((resolve) => {
        rl.question('An .env file already exists. Do you want to overwrite it? (y/N): ', (answer) => {
            resolve(answer.toLowerCase() === 'y');
        });
    });
};

// Check if .env already exists
if (fs.existsSync(envPath)) {
    askForOverwrite().then(shouldOverwrite => {
        if (!shouldOverwrite) {
            console.log('Keeping existing .env file. Exiting...');
            process.exit(0);
        } else {
            setup();
        }
    });
} else {
    setup();
}

// Create .env file with default values
const envContent = `# Database Configuration
DB_USER=postgres.wsmlrdsdhxgaukrwhbtq
DB_HOST=aws-0-us-east-1.pooler.supabase.com
DB_NAME=postgres
DB_PASSWORD=Emmanuel070@
DB_PORT=5432

# Encryption Configuration
ENCRYPTION_KEY=0123456789abcdef0123456789abcdef

# Server Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# CORS Configuration
CORS_ORIGIN=https://nbu-password-system-frontend.vercel.app/

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=100

# Logging
LOG_LEVEL=info

# Email Configuration
# Options: 'gmail', 'smtp', or leave empty for test mode
EMAIL_SERVICE=
EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=noreply@passwordmanager.com

# SMTP Configuration (only needed if EMAIL_SERVICE=smtp)
SMTP_HOST=
SMTP_PORT=587
SMTP_SECURE=false
`;

const askQuestion = (question) => {
    return new Promise((resolve) => {
        rl.question(`${question.message} (${question.default}): `, (answer) => {
            resolve(answer || question.default);
        });
    });
};

const setup = async () => {
    console.log('\nPassword Management System - Environment Setup\n');
    
    let finalEnvContent = envContent;
    
    // Generate encryption key
    const encryptionKey = crypto.randomBytes(32).toString('hex');
    finalEnvContent = finalEnvContent.replace('${crypto.randomBytes(32).toString(\'hex\')}', encryptionKey);
    
    try {
        fs.writeFileSync(envPath, finalEnvContent);
        console.log('✅ .env file created successfully!');
        console.log('📝 Environment configured with existing database credentials');
        console.log('🔑 A new encryption key has been generated');
    } catch (error) {
        console.error('❌ Error creating .env file:', error.message);
        process.exit(1);
    }

    rl.close();
};

setup();
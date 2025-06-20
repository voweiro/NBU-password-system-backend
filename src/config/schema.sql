-- Drop existing tables if they exist
DROP TABLE IF EXISTS activity_logs;
DROP TABLE IF EXISTS entries;

-- Create enum for user roles
CREATE TYPE user_role AS ENUM ('ultra_admin', 'super_admin', 'admin', 'user');

-- Create enum for system categories
CREATE TYPE system_category AS ENUM ('web_software', 'database', 'network');

-- Create enum for entry types
CREATE TYPE entry_type AS ENUM ('user', 'system');

-- Create unified table for users and systems
CREATE TABLE entries (
    id SERIAL PRIMARY KEY,
    type entry_type NOT NULL,
    -- User fields
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255),
    role user_role,
    full_name VARCHAR(200),
    departments TEXT[] DEFAULT '{}',
    allowed_categories system_category[] DEFAULT '{}',
    -- System fields
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
);

-- Create activity_logs table for logging
CREATE TABLE activity_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES entries(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_entries_type ON entries(type);
CREATE INDEX idx_entries_category ON entries(category);
CREATE INDEX idx_entries_subcategory ON entries(subcategory);
CREATE INDEX idx_entries_role ON entries(role);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
CREATE TRIGGER update_entries_updated_at
    BEFORE UPDATE ON entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 
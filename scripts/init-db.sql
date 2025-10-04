-- 🗄️ Database Initialization Script untuk MyHome
-- Script ini akan dijalankan saat container PostgreSQL pertama kali dibuat

-- Create database if not exists (biasanya sudah dibuat oleh POSTGRES_DB)
-- CREATE DATABASE IF NOT EXISTS db_myhome;

-- Set timezone
SET timezone = 'Asia/Jakarta';

-- Create extensions yang mungkin diperlukan
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE db_myhome TO myhome;

-- Log initialization
DO $$
BEGIN
    RAISE NOTICE 'MyHome database initialized successfully at %', NOW();
END $$;

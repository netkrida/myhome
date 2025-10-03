#!/usr/bin/env node

/**
 * Environment Validation Script for MyHome
 * Validates environment variables at runtime before starting the application
 */

const { z } = require('zod');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logError(message) {
  log('red', `❌ ERROR: ${message}`);
}

function logSuccess(message) {
  log('green', `✅ ${message}`);
}

function logWarning(message) {
  log('yellow', `⚠️  WARNING: ${message}`);
}

function logInfo(message) {
  log('blue', `ℹ️  ${message}`);
}

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: z.string().url('DATABASE_URL must be a valid database URL'),
  DIRECT_URL: z.string().url().optional(),
  AUTH_SECRET: z.string().min(32, 'AUTH_SECRET must be at least 32 characters long'),
  NEXTAUTH_URL: z.string().url('NEXTAUTH_URL must be a valid URL'),
  AUTH_DISCORD_ID: z.string().optional(),
  AUTH_DISCORD_SECRET: z.string().optional(),
  PORT: z.string().regex(/^\d+$/, 'PORT must be a number').default('3000'),
  HOST: z.string().default('0.0.0.0'),
});

// Optional environment variables
const optionalEnvSchema = z.object({
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z.string().optional(),
  POSTGRES_DB: z.string().optional(),
  POSTGRES_USER: z.string().optional(),
  POSTGRES_PASSWORD: z.string().optional(),
});

function validateEnvironment() {
  logInfo('Starting environment validation...');
  
  const errors = [];
  const warnings = [];
  
  try {
    // Validate required environment variables
    const env = envSchema.parse(process.env);
    logSuccess('Required environment variables are valid');
    
    // Check for production-specific requirements
    if (env.NODE_ENV === 'production') {
      // Check AUTH_SECRET strength
      if (env.AUTH_SECRET.length < 64) {
        warnings.push('AUTH_SECRET should be at least 64 characters for production');
      }
      
      // Check NEXTAUTH_URL is HTTPS in production
      if (!env.NEXTAUTH_URL.startsWith('https://')) {
        warnings.push('NEXTAUTH_URL should use HTTPS in production');
      }
      
      // Check database URL is not using default/placeholder values
      if (env.DATABASE_URL.includes('placeholder')) {
        errors.push('DATABASE_URL contains placeholder values');
      }
    }
    
    // Validate optional environment variables
    const optionalEnv = optionalEnvSchema.parse(process.env);
    
    // Check for common misconfigurations
    if (optionalEnv.CLOUDINARY_API_SECRET && optionalEnv.CLOUDINARY_API_SECRET.includes('[') && optionalEnv.CLOUDINARY_API_SECRET.includes(']')) {
      warnings.push('CLOUDINARY_API_SECRET appears to contain placeholder brackets');
    }
    
    if (optionalEnv.MIDTRANS_SERVER_KEY && optionalEnv.MIDTRANS_SERVER_KEY.includes('[') && optionalEnv.MIDTRANS_SERVER_KEY.includes(']')) {
      warnings.push('MIDTRANS_SERVER_KEY appears to contain placeholder brackets');
    }
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      error.errors.forEach(err => {
        errors.push(`${err.path.join('.')}: ${err.message}`);
      });
    } else {
      errors.push(`Unexpected error: ${error.message}`);
    }
  }
  
  // Display results
  console.log('\n' + '='.repeat(50));
  logInfo('Environment Validation Results');
  console.log('='.repeat(50));
  
  if (errors.length > 0) {
    logError('Environment validation failed!');
    console.log('\nErrors:');
    errors.forEach(error => {
      console.log(`  • ${error}`);
    });
  } else {
    logSuccess('Environment validation passed!');
  }
  
  if (warnings.length > 0) {
    console.log('\nWarnings:');
    warnings.forEach(warning => {
      logWarning(warning);
    });
  }
  
  // Environment summary
  console.log('\nEnvironment Summary:');
  console.log(`  • NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  • PORT: ${process.env.PORT || '3000'}`);
  console.log(`  • HOST: ${process.env.HOST || '0.0.0.0'}`);
  console.log(`  • NEXTAUTH_URL: ${process.env.NEXTAUTH_URL || 'not set'}`);
  console.log(`  • DATABASE_URL: ${process.env.DATABASE_URL ? 'set' : 'not set'}`);
  console.log(`  • AUTH_SECRET: ${process.env.AUTH_SECRET ? 'set' : 'not set'}`);
  
  // Optional services
  const optionalServices = [];
  if (process.env.CLOUDINARY_API_SECRET) optionalServices.push('Cloudinary');
  if (process.env.MIDTRANS_SERVER_KEY) optionalServices.push('Midtrans');
  if (process.env.AUTH_DISCORD_ID) optionalServices.push('Discord OAuth');
  
  if (optionalServices.length > 0) {
    console.log(`  • Optional services: ${optionalServices.join(', ')}`);
  }
  
  console.log('='.repeat(50) + '\n');
  
  // Exit with error code if validation failed
  if (errors.length > 0) {
    logError('Environment validation failed. Please fix the errors above.');
    process.exit(1);
  }
  
  if (warnings.length > 0) {
    logWarning(`Environment validation passed with ${warnings.length} warning(s).`);
  }
  
  logSuccess('Environment is ready for MyHome application!');
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateEnvironment();
}

module.exports = { validateEnvironment };

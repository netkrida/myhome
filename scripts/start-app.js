#!/usr/bin/env node

/**
 * Application Startup Script for MyHome
 * Validates environment and starts the Next.js application
 */

const { spawn } = require('child_process');
const path = require('path');

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m'
};

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logInfo(message) {
  log('blue', `ℹ️  ${message}`);
}

function logSuccess(message) {
  log('green', `✅ ${message}`);
}

function logError(message) {
  log('red', `❌ ${message}`);
}

function logWarning(message) {
  log('yellow', `⚠️  ${message}`);
}

async function validateEnvironment() {
  return new Promise((resolve, reject) => {
    logInfo('Validating environment variables...');
    
    const validateScript = path.join(__dirname, 'validate-env.js');
    const validator = spawn('node', [validateScript], {
      stdio: 'inherit',
      env: process.env
    });
    
    validator.on('close', (code) => {
      if (code === 0) {
        logSuccess('Environment validation completed successfully');
        resolve();
      } else {
        logError('Environment validation failed');
        reject(new Error(`Environment validation failed with code ${code}`));
      }
    });
    
    validator.on('error', (error) => {
      logError(`Failed to run environment validation: ${error.message}`);
      reject(error);
    });
  });
}

async function startApplication() {
  logInfo('Starting MyHome Next.js application...');
  
  const app = spawn('node', ['server.js'], {
    stdio: 'inherit',
    env: process.env
  });
  
  app.on('error', (error) => {
    logError(`Failed to start application: ${error.message}`);
    process.exit(1);
  });
  
  app.on('close', (code) => {
    if (code !== 0) {
      logError(`Application exited with code ${code}`);
      process.exit(code);
    }
  });
  
  // Handle graceful shutdown
  process.on('SIGTERM', () => {
    logInfo('Received SIGTERM, shutting down gracefully...');
    app.kill('SIGTERM');
  });
  
  process.on('SIGINT', () => {
    logInfo('Received SIGINT, shutting down gracefully...');
    app.kill('SIGINT');
  });
}

async function main() {
  try {
    // Display startup banner
    console.log('\n' + '='.repeat(60));
    log('cyan', '🏠 MyHome Application Startup');
    log('cyan', '   Domain: myhome.co.id');
    log('cyan', `   Environment: ${process.env.NODE_ENV || 'development'}`);
    log('cyan', `   Port: ${process.env.PORT || '3000'}`);
    console.log('='.repeat(60) + '\n');
    
    // Skip validation if explicitly disabled
    if (process.env.SKIP_ENV_VALIDATION === 'true') {
      logWarning('Environment validation is disabled (SKIP_ENV_VALIDATION=true)');
      logWarning('This should only be used during development or build processes');
    } else {
      // Validate environment variables
      await validateEnvironment();
    }
    
    // Start the application
    await startApplication();
    
  } catch (error) {
    logError(`Startup failed: ${error.message}`);
    process.exit(1);
  }
}

// Run if this script is executed directly
if (require.main === module) {
  main();
}

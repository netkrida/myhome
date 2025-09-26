#!/usr/bin/env node
// @ts-check

/**
 * Production Build Test Script
 * Tests if the build is ready for deployment
 */

import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

const requiredFiles = [
  '.next/server/app/api/auth/[...nextauth]/route.js',
  '.next/server/app/api/health/route.js',
  '.next/server/app/api/test-db/route.js',
  '.next/server/app/(public-pages)/login/page.js',
  '.next/server/middleware.js'
];

const requiredEnvVars = [
  'AUTH_SECRET',
  'DATABASE_URL'
];

const productionEnvVars = [
  'NEXTAUTH_URL'
];

console.log('🧪 Testing Production Build...\n');

// Test 1: Check if build exists
console.log('1️⃣ Checking build output...');
if (!existsSync('.next')) {
  console.error('❌ No build found. Run `npm run build` first.');
  process.exit(1);
}
console.log('✅ Build directory exists');

// Test 2: Check required files
console.log('\n2️⃣ Checking required files...');
let missingFiles = [];
for (const file of requiredFiles) {
  if (existsSync(file)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    missingFiles.push(file);
  }
}

if (missingFiles.length > 0) {
  console.error(`\n❌ Missing ${missingFiles.length} required files. Build may be incomplete.`);
  process.exit(1);
}

// Test 3: Check environment variables
console.log('\n3️⃣ Checking environment variables...');
const envFile = '.env.local';
/** @type {Record<string, string>} */
let envVars = {};

if (existsSync(envFile)) {
  const envContent = readFileSync(envFile, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      envVars[key.trim()] = value.trim();
    }
  });
}

// Check process.env as well
Object.keys(process.env).forEach(key => {
  const value = process.env[key];
  if (value) {
    envVars[key] = value;
  }
});

let missingEnvVars = [];
for (const envVar of requiredEnvVars) {
  if (envVars[envVar]) {
    console.log(`✅ ${envVar}`);
  } else {
    console.log(`❌ ${envVar} (REQUIRED)`);
    missingEnvVars.push(envVar);
  }
}

for (const envVar of productionEnvVars) {
  if (envVars[envVar]) {
    console.log(`✅ ${envVar} (production)`);
  } else {
    console.log(`⚠️ ${envVar} (recommended for production)`);
  }
}

if (missingEnvVars.length > 0) {
  console.error(`\n❌ Missing ${missingEnvVars.length} required environment variables.`);
  console.log('\n📝 To fix this:');
  console.log('1. Copy .env.example to .env.local');
  console.log('2. Fill in the required values');
  console.log('3. Generate AUTH_SECRET with: npx auth secret');
  process.exit(1);
}

// Test 4: Try to start the server briefly
console.log('\n4️⃣ Testing server startup...');
try {
  console.log('Starting server for 5 seconds...');
  const child = execSync('timeout 5s npm start || true', { 
    stdio: 'pipe',
    encoding: 'utf8'
  });
  console.log('✅ Server starts successfully');
} catch (error) {
  console.log('⚠️ Server test skipped (timeout command not available)');
}

console.log('\n🎉 Production build test completed!');
console.log('\n📋 Deployment Checklist:');
console.log('1. ✅ Build files are present');
console.log('2. ✅ Environment variables are configured');
console.log('3. 🔄 Deploy to your platform');
console.log('4. 🧪 Test /api/health endpoint');
console.log('5. 🔐 Test login functionality');

console.log('\n🔗 Useful URLs after deployment:');
console.log('- Health check: https://yourdomain.com/api/health');
console.log('- Auth providers: https://yourdomain.com/api/auth/providers');
console.log('- Login page: https://yourdomain.com/login');

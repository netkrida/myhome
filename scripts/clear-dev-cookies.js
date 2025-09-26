#!/usr/bin/env node

/**
 * Clear development cookies script
 * Run this when you have cookie/session issues in development
 */

console.log('🧹 Clearing development cookies and session data...\n');

console.log('📋 Manual steps to clear cookies:');
console.log('1. Open browser Developer Tools (F12)');
console.log('2. Go to Application/Storage tab');
console.log('3. Clear these items:');
console.log('   - Cookies for localhost:3000');
console.log('   - Local Storage');
console.log('   - Session Storage');
console.log('');

console.log('🔧 Or use these browser shortcuts:');
console.log('- Chrome/Edge: Ctrl+Shift+Delete → Clear browsing data');
console.log('- Firefox: Ctrl+Shift+Delete → Clear recent history');
console.log('');

console.log('🍪 Specific cookies to look for and delete:');
console.log('- authjs.session-token');
console.log('- authjs.csrf-token');
console.log('- authjs.callback-url');
console.log('- next-auth.session-token');
console.log('- __Secure-next-auth.session-token');
console.log('');

console.log('🔄 After clearing cookies:');
console.log('1. Restart your dev server: npm run dev');
console.log('2. Go to http://localhost:3000/login');
console.log('3. Login with fresh session');
console.log('');

console.log('✅ This should resolve cookie naming conflicts!');

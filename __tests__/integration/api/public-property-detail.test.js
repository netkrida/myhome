/**
 * Test for Public Property Detail API
 * Tests the GET /api/public/properties/[id] endpoint
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';

/**
 * Simple test runner
 */
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, testFn) {
    this.tests.push({ name, testFn });
  }

  async run() {
    console.log('🧪 Running Public Property Detail API Tests\n');
    
    for (const { name, testFn } of this.tests) {
      try {
        console.log(`⏳ ${name}`);
        await testFn();
        console.log(`✅ ${name} - PASSED\n`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${name} - FAILED`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log(`📊 Test Results: ${this.passed} passed, ${this.failed} failed`);
    
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

/**
 * Helper function to make HTTP requests
 */
async function makeRequest(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const data = await response.json();
  return { response, data };
}

/**
 * Helper function to assert conditions
 */
function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

// Initialize test runner
const runner = new TestRunner();

// Test 1: Invalid property ID format
runner.test('Should return 400 for invalid property ID format', async () => {
  const { response, data } = await makeRequest(`${BASE_URL}/api/public/properties/invalid-id`);
  
  assert(response.status === 400, `Expected status 400, got ${response.status}`);
  assert(data.success === false, 'Expected success to be false');
  assert(data.error === 'Invalid property ID format', `Expected error message about invalid ID format, got: ${data.error}`);
});

// Test 2: Non-existent property ID
runner.test('Should return 404 for non-existent property', async () => {
  const nonExistentId = 'clm0000000000000000000000'; // Valid CUID format but non-existent
  const { response, data } = await makeRequest(`${BASE_URL}/api/public/properties/${nonExistentId}`);
  
  assert(response.status === 404, `Expected status 404, got ${response.status}`);
  assert(data.success === false, 'Expected success to be false');
  assert(data.error.includes('not found'), `Expected error message about not found, got: ${data.error}`);
});

// Test 3: Valid property ID with approved property (requires seeded data)
runner.test('Should return property details for valid approved property', async () => {
  // This test requires at least one approved property in the database
  // First, let's try to get a list of public properties to find a valid ID
  const { data: listData } = await makeRequest(`${BASE_URL}/api/public/properties?limit=1`);
  
  if (!listData.success || !listData.data.properties.length) {
    console.log('   ⚠️  Skipping test - No approved properties found in database');
    return;
  }

  const propertyId = listData.data.properties[0].id;
  const { response, data } = await makeRequest(`${BASE_URL}/api/public/properties/${propertyId}`);
  
  assert(response.status === 200, `Expected status 200, got ${response.status}`);
  assert(data.success === true, 'Expected success to be true');
  assert(data.data, 'Expected data property to exist');
  
  const property = data.data;
  
  // Validate property structure
  assert(property.id, 'Property should have an ID');
  assert(property.name, 'Property should have a name');
  assert(property.propertyType, 'Property should have a propertyType');
  assert(property.description, 'Property should have a description');
  assert(Array.isArray(property.roomTypes), 'Property should have roomTypes array');
  assert(typeof property.totalRooms === 'number', 'Property should have totalRooms number');
  assert(typeof property.availableRooms === 'number', 'Property should have availableRooms number');
  
  // Validate location structure
  assert(property.location, 'Property should have location');
  assert(property.location.fullAddress, 'Property should have fullAddress');
  assert(typeof property.location.latitude === 'number', 'Property should have latitude');
  assert(typeof property.location.longitude === 'number', 'Property should have longitude');
  
  // Validate arrays
  assert(Array.isArray(property.facilities), 'Property should have facilities array');
  assert(Array.isArray(property.rules), 'Property should have rules array');
  assert(Array.isArray(property.images), 'Property should have images array');
  assert(Array.isArray(property.rooms), 'Property should have rooms array');
  
  // Validate room structure if rooms exist
  if (property.rooms.length > 0) {
    const room = property.rooms[0];
    assert(room.id, 'Room should have an ID');
    assert(room.roomNumber, 'Room should have a roomNumber');
    assert(room.roomType, 'Room should have a roomType');
    assert(typeof room.monthlyPrice === 'number', 'Room should have monthlyPrice number');
    assert(typeof room.isAvailable === 'boolean', 'Room should have isAvailable boolean');
    assert(Array.isArray(room.facilities), 'Room should have facilities array');
    assert(Array.isArray(room.images), 'Room should have images array');
  }
  
  console.log(`   📋 Property: ${property.name} (${property.rooms.length} rooms, ${property.images.length} images)`);
});

// Test 4: Response time should be reasonable
runner.test('Should respond within reasonable time', async () => {
  const startTime = Date.now();
  
  // Use a non-existent ID to test response time without depending on data
  const nonExistentId = 'clm0000000000000000000000';
  await makeRequest(`${BASE_URL}/api/public/properties/${nonExistentId}`);
  
  const endTime = Date.now();
  const responseTime = endTime - startTime;
  
  assert(responseTime < 5000, `Response time should be under 5 seconds, got ${responseTime}ms`);
  console.log(`   ⏱️  Response time: ${responseTime}ms`);
});

// Test 5: Should handle concurrent requests
runner.test('Should handle concurrent requests', async () => {
  const nonExistentId = 'clm0000000000000000000000';
  const promises = [];
  
  // Make 5 concurrent requests
  for (let i = 0; i < 5; i++) {
    promises.push(makeRequest(`${BASE_URL}/api/public/properties/${nonExistentId}`));
  }
  
  const results = await Promise.all(promises);
  
  // All should return 404
  results.forEach((result, index) => {
    assert(result.response.status === 404, `Request ${index + 1} should return 404`);
  });
  
  console.log('   🔄 All 5 concurrent requests handled successfully');
});

// Run all tests
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Check if this file is being run directly
if (process.argv[1] === __filename) {
  runner.run().catch(console.error);
}

export { TestRunner, makeRequest, assert };

// Test script to debug solution submission
const API_BASE_URL = 'http://localhost:4000/api/v1';

async function testSolutionSubmission() {
  try {
    // Test 1: Try to create solution without auth (should fail)
    console.log('Testing solution creation without auth...');
    const response1 = await fetch(`${API_BASE_URL}/solutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId: 'e31e3185-9c41-482a-a23b-af391b0b2cae',
        title: 'Test Solution',
        content: 'This is a test solution with enough content to pass validation.'
      })
    });
    
    console.log('Response 1 (no auth):', response1.status, await response1.text());
    
    // Test 2: Check what happens with invalid thread ID
    console.log('\nTesting with invalid thread ID...');
    const response2 = await fetch(`${API_BASE_URL}/solutions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        threadId: 'invalid-uuid',
        title: 'Test Solution',
        content: 'This is a test solution with enough content to pass validation.'
      })
    });
    
    console.log('Response 2 (invalid UUID):', response2.status, await response2.text());
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSolutionSubmission(); 
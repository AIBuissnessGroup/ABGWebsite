// Test the API endpoint directly
const apiUrl = 'http://localhost:3000/api/interviews/slots?date=2025-09-24';

async function testInterviewsAPI() {
  try {
    console.log('🔍 Testing interviews API endpoint...\n');
    console.log(`📡 Calling: ${apiUrl}`);
    
    const response = await fetch(apiUrl, {
      headers: {
        'Cookie': 'next-auth.session-token=test' // This won't work but let's see the error
      }
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Response headers:`, Object.fromEntries(response.headers.entries()));
    
    const responseText = await response.text();
    console.log(`📊 Response body:`, responseText);
    
    if (response.ok) {
      const data = JSON.parse(responseText);
      console.log(`✅ API returned ${data.length} slots`);
    } else {
      console.log(`❌ API returned error: ${response.status}`);
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

testInterviewsAPI();
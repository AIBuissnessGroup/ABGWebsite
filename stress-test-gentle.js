#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration - More reasonable for stress testing
const BASE_URL = 'localhost:3000';
const CONCURRENT_REQUESTS = 5; // Much lower to avoid overwhelming
const TOTAL_REQUESTS = 50; // Smaller total for quick testing
const REQUEST_TIMEOUT = 15000; // 15 seconds
const BATCH_DELAY = 500; // 500ms delay between batches

// Generate random email
function generateRandomEmail() {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'test.com', 'example.com'];
  const randomString = Math.random().toString(36).substring(7);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 10000);
  return `stresstest_${randomString}_${timestamp}_${random}@${domain}`;
}

// Generate random name
function generateRandomName() {
  const firstNames = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma', 'Alex', 'Maria'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
  const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
  return `${firstName} ${lastName}`;
}

// Make a single subscription request
function makeSubscriptionRequest() {
  return new Promise((resolve) => {
    const email = generateRandomEmail();
    const name = generateRandomName();
    const source = 'stress_test_gentle';
    
    const postData = JSON.stringify({
      email,
      name,
      source
    });

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/newsletter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData),
        'User-Agent': 'StressTest/1.0'
      },
      timeout: REQUEST_TIMEOUT
    };

    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            responseTime,
            email,
            response: response.message || response.error,
            error: null,
            data: response
          });
        } catch (parseError) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            responseTime,
            email,
            response: data.substring(0, 200), // Limit response length
            error: `Parse error: ${parseError.message}`,
            data: null
          });
        }
      });
    });

    req.on('error', (error) => {
      const responseTime = Date.now() - startTime;
      resolve({
        success: false,
        statusCode: 0,
        responseTime,
        email,
        response: null,
        error: error.message,
        data: null
      });
    });

    req.on('timeout', () => {
      req.destroy();
      const responseTime = Date.now() - startTime;
      resolve({
        success: false,
        statusCode: 0,
        responseTime,
        email,
        response: null,
        error: 'Request timeout',
        data: null
      });
    });

    req.write(postData);
    req.end();
  });
}

// Test duplicate email handling
async function testDuplicateEmail() {
  console.log('\n🔄 Testing duplicate email handling...');
  
  const testEmail = `duplicate_test_${Date.now()}@test.com`;
  const testData = {
    email: testEmail,
    name: 'Duplicate Test User',
    source: 'duplicate_test'
  };

  // First request
  const result1 = await makeRequestWithData(testData);
  console.log(`   First request: ${result1.success ? '✅' : '❌'} - ${result1.response}`);

  // Second request with same email
  const result2 = await makeRequestWithData(testData);
  console.log(`   Second request: ${result2.success ? '✅' : '❌'} - ${result2.response}`);

  return { first: result1, second: result2 };
}

// Make request with specific data
function makeRequestWithData(data) {
  return new Promise((resolve) => {
    const postData = JSON.stringify(data);

    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/newsletter',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: REQUEST_TIMEOUT
    };

    const startTime = Date.now();
    
    const req = http.request(options, (res) => {
      const responseTime = Date.now() - startTime;
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          resolve({
            success: res.statusCode === 200,
            statusCode: res.statusCode,
            responseTime,
            response: response.message || response.error,
            error: null
          });
        } catch (parseError) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            responseTime,
            response: data,
            error: `Parse error: ${parseError.message}`
          });
        }
      });
    });

    req.on('error', (error) => {
      resolve({
        success: false,
        statusCode: 0,
        responseTime: Date.now() - startTime,
        response: null,
        error: error.message
      });
    });

    req.write(postData);
    req.end();
  });
}

// Run stress test
async function runStressTest() {
  console.log('🚀 Starting Gentle Newsletter Subscription Stress Test');
  console.log(`📊 Configuration:`);
  console.log(`   - Base URL: ${BASE_URL}`);
  console.log(`   - Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`   - Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`   - Request Timeout: ${REQUEST_TIMEOUT}ms`);
  console.log(`   - Batch Delay: ${BATCH_DELAY}ms`);
  console.log('');

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: {},
    responseTimes: [],
    statusCodes: {},
    errorDetails: []
  };

  const startTime = Date.now();
  let completed = 0;

  // Process requests in batches with delays
  for (let batch = 0; batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS); batch++) {
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - batch * CONCURRENT_REQUESTS);
    const promises = [];

    console.log(`\n📦 Processing batch ${batch + 1}/${Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS)} (${batchSize} requests)`);

    for (let i = 0; i < batchSize; i++) {
      promises.push(makeSubscriptionRequest());
    }

    const batchResults = await Promise.all(promises);
    
    batchResults.forEach((result, index) => {
      results.total++;
      results.responseTimes.push(result.responseTime);
      
      // Track status codes
      results.statusCodes[result.statusCode] = (results.statusCodes[result.statusCode] || 0) + 1;
      
      if (result.success) {
        results.successful++;
        console.log(`   ✅ Request ${completed + index + 1}: ${result.responseTime}ms - ${result.response}`);
      } else {
        results.failed++;
        const errorKey = result.error || `HTTP ${result.statusCode}`;
        results.errors[errorKey] = (results.errors[errorKey] || 0) + 1;
        
        // Store detailed error info
        results.errorDetails.push({
          email: result.email,
          statusCode: result.statusCode,
          error: result.error,
          response: result.response
        });
        
        console.log(`   ❌ Request ${completed + index + 1}: ${result.responseTime}ms - ${result.error || result.response}`);
      }
    });

    completed += batchSize;
    
    // Progress indicator
    const progress = (completed / TOTAL_REQUESTS * 100).toFixed(1);
    console.log(`📈 Progress: ${completed}/${TOTAL_REQUESTS} (${progress}%)`);

    // Delay between batches (except for the last batch)
    if (batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS) - 1) {
      console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
      await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
    }
  }

  // Test duplicate email handling
  const duplicateTest = await testDuplicateEmail();

  const totalTime = Date.now() - startTime;
  
  // Calculate statistics
  const avgResponseTime = results.responseTimes.reduce((a, b) => a + b, 0) / results.responseTimes.length;
  const maxResponseTime = Math.max(...results.responseTimes);
  const minResponseTime = Math.min(...results.responseTimes);
  const requestsPerSecond = (results.total / (totalTime / 1000)).toFixed(2);

  // Sort response times for percentiles
  const sortedTimes = results.responseTimes.sort((a, b) => a - b);
  const p50 = sortedTimes[Math.floor(sortedTimes.length * 0.5)];
  const p95 = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
  const p99 = sortedTimes[Math.floor(sortedTimes.length * 0.99)];

  console.log('\n\n🎯 Stress Test Results');
  console.log('='.repeat(60));
  console.log(`📊 Overall Performance:`);
  console.log(`   Total Requests: ${results.total}`);
  console.log(`   Successful: ${results.successful} (${(results.successful/results.total*100).toFixed(1)}%)`);
  console.log(`   Failed: ${results.failed} (${(results.failed/results.total*100).toFixed(1)}%)`);
  console.log(`   Total Time: ${(totalTime/1000).toFixed(2)}s`);
  console.log(`   Requests/sec: ${requestsPerSecond}`);
  console.log('');
  
  console.log(`⏱️  Response Times:`);
  console.log(`   Average: ${avgResponseTime.toFixed(2)}ms`);
  console.log(`   Min: ${minResponseTime}ms`);
  console.log(`   Max: ${maxResponseTime}ms`);
  console.log(`   50th percentile: ${p50}ms`);
  console.log(`   95th percentile: ${p95}ms`);
  console.log(`   99th percentile: ${p99}ms`);
  console.log('');

  console.log(`📈 Status Codes:`);
  Object.entries(results.statusCodes).forEach(([code, count]) => {
    console.log(`   ${code}: ${count} (${(count/results.total*100).toFixed(1)}%)`);
  });
  console.log('');

  if (Object.keys(results.errors).length > 0) {
    console.log(`❌ Error Summary:`);
    Object.entries(results.errors).forEach(([error, count]) => {
      console.log(`   ${error}: ${count}`);
    });
    console.log('');
  }

  // Show first few detailed errors if any
  if (results.errorDetails.length > 0) {
    console.log(`🔍 Error Details (first 5):`);
    results.errorDetails.slice(0, 5).forEach((error, index) => {
      console.log(`   ${index + 1}. ${error.email}`);
      console.log(`      Status: ${error.statusCode}`);
      console.log(`      Error: ${error.error || 'N/A'}`);
      console.log(`      Response: ${error.response || 'N/A'}`);
      console.log('');
    });
  }

  // Duplicate email test results
  console.log(`🔄 Duplicate Email Test:`);
  console.log(`   First request: ${duplicateTest.first.success ? '✅' : '❌'} (${duplicateTest.first.statusCode})`);
  console.log(`   Second request: ${duplicateTest.second.success ? '✅' : '❌'} (${duplicateTest.second.statusCode})`);
  console.log('');

  // Performance assessment
  const successRate = results.successful / results.total;
  const avgResponseTimeThreshold = 1000; // 1 second
  const p95Threshold = 3000; // 3 seconds

  console.log(`🔍 Performance Assessment:`);
  if (successRate >= 0.95) {
    console.log(`   ✅ Success Rate: Excellent (${(successRate*100).toFixed(1)}%)`);
  } else if (successRate >= 0.80) {
    console.log(`   ⚠️  Success Rate: Good (${(successRate*100).toFixed(1)}%)`);
  } else {
    console.log(`   ❌ Success Rate: Poor (${(successRate*100).toFixed(1)}%)`);
  }

  if (avgResponseTime <= avgResponseTimeThreshold) {
    console.log(`   ✅ Average Response Time: Good (${avgResponseTime.toFixed(2)}ms)`);
  } else {
    console.log(`   ⚠️  Average Response Time: Slow (${avgResponseTime.toFixed(2)}ms)`);
  }

  if (p95 <= p95Threshold) {
    console.log(`   ✅ 95th Percentile: Good (${p95}ms)`);
  } else {
    console.log(`   ⚠️  95th Percentile: Slow (${p95}ms)`);
  }

  // Recommendations
  console.log(`\n💡 Recommendations:`);
  if (successRate < 0.95) {
    console.log(`   • Consider implementing connection pooling in the API`);
    console.log(`   • Add rate limiting to prevent overwhelming the database`);
    console.log(`   • Review database connection handling`);
  }
  if (avgResponseTime > avgResponseTimeThreshold) {
    console.log(`   • Optimize database queries`);
    console.log(`   • Consider adding database indexes`);
    console.log(`   • Review MongoDB connection configuration`);
  }
  if (results.failed > 0) {
    console.log(`   • Implement retry logic in the client`);
    console.log(`   • Add better error handling in the API`);
    console.log(`   • Monitor server resources during high load`);
  }

  console.log('\n✨ Stress test completed!');
}

// Check if server is running
function checkServer() {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/api/newsletter',
      method: 'GET',
      timeout: 5000
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

// Main execution
async function main() {
  console.log('🔍 Checking if server is running...');
  const serverRunning = await checkServer();
  
  if (!serverRunning) {
    console.log('❌ Server is not running on localhost:3000');
    console.log('Please start your development server or check if the service is running');
    console.log('Try: npm run dev  or  systemctl status abg-website.service');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  await runStressTest();
}

main().catch(console.error);

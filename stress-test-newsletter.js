#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Configuration
const BASE_URL = 'abgumich.orge'; // Change to your deployed URL if testing production
const CONCURRENT_REQUESTS = 50;
const TOTAL_REQUESTS = 500;
const REQUEST_TIMEOUT = 10000; // 10 seconds

// Generate random email
function generateRandomEmail() {
  const domains = ['gmail.com', 'yahoo.com', 'outlook.com', 'test.com', 'example.com'];
  const randomString = Math.random().toString(36).substring(7);
  const domain = domains[Math.floor(Math.random() * domains.length)];
  return `test_${randomString}_${Date.now()}@${domain}`;
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
    const source = Math.random() > 0.5 ? 'stress_test' : 'website';
    
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
            email,
            response: response.message || response.error,
            error: null
          });
        } catch (parseError) {
          resolve({
            success: false,
            statusCode: res.statusCode,
            responseTime,
            email,
            response: data,
            error: `Parse error: ${parseError.message}`
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
        error: error.message
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
        error: 'Request timeout'
      });
    });

    req.write(postData);
    req.end();
  });
}

// Run stress test
async function runStressTest() {
  console.log('🚀 Starting Newsletter Subscription Stress Test');
  console.log(`📊 Configuration:`);
  console.log(`   - Base URL: ${BASE_URL}`);
  console.log(`   - Total Requests: ${TOTAL_REQUESTS}`);
  console.log(`   - Concurrent Requests: ${CONCURRENT_REQUESTS}`);
  console.log(`   - Request Timeout: ${REQUEST_TIMEOUT}ms`);
  console.log('');

  const results = {
    total: 0,
    successful: 0,
    failed: 0,
    errors: {},
    responseTimes: [],
    statusCodes: {}
  };

  const startTime = Date.now();
  let completed = 0;

  // Process requests in batches
  for (let batch = 0; batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS); batch++) {
    const batchSize = Math.min(CONCURRENT_REQUESTS, TOTAL_REQUESTS - batch * CONCURRENT_REQUESTS);
    const promises = [];

    for (let i = 0; i < batchSize; i++) {
      promises.push(makeSubscriptionRequest());
    }

    const batchResults = await Promise.all(promises);
    
    batchResults.forEach(result => {
      results.total++;
      results.responseTimes.push(result.responseTime);
      
      // Track status codes
      results.statusCodes[result.statusCode] = (results.statusCodes[result.statusCode] || 0) + 1;
      
      if (result.success) {
        results.successful++;
      } else {
        results.failed++;
        const errorKey = result.error || `HTTP ${result.statusCode}`;
        results.errors[errorKey] = (results.errors[errorKey] || 0) + 1;
      }
      
      completed++;
      
      // Progress indicator
      if (completed % 50 === 0 || completed === TOTAL_REQUESTS) {
        const progress = (completed / TOTAL_REQUESTS * 100).toFixed(1);
        process.stdout.write(`\r📈 Progress: ${completed}/${TOTAL_REQUESTS} (${progress}%)`);
      }
    });

    // Small delay between batches to avoid overwhelming the server
    if (batch < Math.ceil(TOTAL_REQUESTS / CONCURRENT_REQUESTS) - 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

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
  console.log('='.repeat(50));
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
    console.log(`❌ Errors:`);
    Object.entries(results.errors).forEach(([error, count]) => {
      console.log(`   ${error}: ${count}`);
    });
    console.log('');
  }

  // Performance assessment
  const successRate = results.successful / results.total;
  const avgResponseTimeThreshold = 2000; // 2 seconds
  const p95Threshold = 5000; // 5 seconds

  console.log(`🔍 Performance Assessment:`);
  if (successRate >= 0.99) {
    console.log(`   ✅ Success Rate: Excellent (${(successRate*100).toFixed(1)}%)`);
  } else if (successRate >= 0.95) {
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
    console.log('Please start your development server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running\n');
  await runStressTest();
}

main().catch(console.error);

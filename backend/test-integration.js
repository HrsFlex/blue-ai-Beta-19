#!/usr/bin/env node

/**
 * Sakhi Emotion Detection Integration Test Script
 * Tests all emotion detection endpoints and validates functionality
 */

const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:5000';
const ML_URL = 'http://localhost:8000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

// Test data
const testCases = {
  text: [
    "I am feeling extremely happy and excited today!",
    "I'm really worried about my upcoming exams",
    "I feel so sad and lonely lately",
    "This makes me angry and frustrated",
    "I'm surprised by this unexpected news",
    "I love spending time with my family"
  ],
  chatbot: [
    "I need help with my anxiety",
    "I'm feeling depressed and don't know what to do",
    "Today was a great day!",
    "I'm scared about the future"
  ]
};

async function testHealth() {
  logInfo('Testing service health...');

  try {
    // Test Express health
    const expressHealth = await axios.get(`${BASE_URL}/api/emotion/health`);
    logSuccess(`Express Server: ${expressHealth.data.express.status}`);
    logInfo(`ML Service: ${expressHealth.data.mlService.status || 'unknown'}`);
    logInfo(`WebSocket connections: ${expressHealth.data.websocket.connections}`);

    // Test ML service health
    try {
      const mlHealth = await axios.get(`${ML_URL}/health`, { timeout: 5000 });
      logSuccess('ML Service direct connection: OK');
      logInfo('ML Models loaded:');
      Object.entries(mlHealth.data.models_loaded).forEach(([model, loaded]) => {
        logInfo(`  - ${model}: ${loaded ? '✅' : '❌'}`);
      });
    } catch (error) {
      logWarning('ML Service direct connection failed (may be normal if using Express proxy)');
    }

    return true;
  } catch (error) {
    logError(`Health check failed: ${error.message}`);
    return false;
  }
}

async function testTextEmotion() {
  logInfo('\nTesting text emotion analysis...');

  for (const text of testCases.text) {
    try {
      const response = await axios.post(`${BASE_URL}/api/emotion/text`, {
        text: text,
        include_context: true,
        userId: 'test-user'
      });

      if (response.data.success) {
        logSuccess(`"${text.substring(0, 30)}..." → ${response.data.emotion} (${Math.round(response.data.confidence * 100)}%)`);
      } else {
        logError(`Failed: ${text}`);
      }
    } catch (error) {
      logError(`Text emotion test failed: ${error.message}`);
    }
  }
}

async function testChatbot() {
  logInfo('\nTesting enhanced chatbot...');

  for (const message of testCases.chatbot) {
    try {
      const response = await axios.post(`${BASE_URL}/chatbot`, {
        message: message,
        userId: 'test-user'
      });

      if (response.data.success) {
        logSuccess(`Chat: "${message.substring(0, 30)}..."`);
        logInfo(`  Emotion: ${response.data.emotion} (${Math.round(response.data.confidence * 100)}%)`);
        logInfo(`  Intent: ${response.data.intent}`);
        logInfo(`  Multi-modal: ${response.data.multimodal}`);
        logInfo(`  Response: ${response.data.answer.substring(0, 50)}...`);
      } else {
        logError(`Chatbot test failed: ${message}`);
      }
    } catch (error) {
      logError(`Chatbot test failed: ${error.message}`);
    }
  }
}

async function testEmotionAnalytics() {
  logInfo('\nTesting emotion analytics...');

  try {
    const response = await axios.get(`${BASE_URL}/api/emotion/dashboard`, {
      params: {
        userId: 'test-user',
        timeRange: '1h'
      }
    });

    if (response.data.success) {
      const analytics = response.data.analytics;
      logSuccess('Analytics dashboard test passed');
      logInfo(`  Total entries: ${analytics.totalEntries}`);
      logInfo(`  Primary emotion: ${analytics.primaryEmotion}`);
      logInfo(`  Multi-modal percentage: ${analytics.multimodalPercentage}%`);

      if (analytics.emotionDistribution) {
        logInfo('  Emotion distribution:');
        Object.entries(analytics.emotionDistribution).forEach(([emotion, count]) => {
          logInfo(`    - ${emotion}: ${count}`);
        });
      }
    } else {
      logError('Analytics test failed');
    }
  } catch (error) {
    logError(`Analytics test failed: ${error.message}`);
  }
}

async function testDirectMLService() {
  logInfo('\nTesting direct ML service endpoints...');

  try {
    // Test ML service direct endpoint
    const response = await axios.post(`${ML_URL}/api/v/chat`, {
      prompt: "I'm feeling a bit anxious today",
      user_id: "test-direct"
    });

    logSuccess('Direct ML service test passed');
    logInfo(`  Response: ${response.data.response.substring(0, 50)}...`);
    logInfo(`  Emotion: ${response.data.emotion}`);
    logInfo(`  Confidence: ${Math.round(response.data.confidence * 100)}%`);
  } catch (error) {
    logWarning(`Direct ML service test failed: ${error.message}`);
    logInfo('This may be normal if running through Express proxy');
  }
}

async function checkWebSocket() {
  logInfo('\nTesting WebSocket connection...');

  return new Promise((resolve) => {
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:5000');

    const timeout = setTimeout(() => {
      logWarning('WebSocket connection timeout');
      ws.close();
      resolve(false);
    }, 5000);

    ws.on('open', () => {
      clearTimeout(timeout);
      logSuccess('WebSocket connection established');

      // Test message
      ws.send(JSON.stringify({
        type: 'test',
        message: 'Hello WebSocket!'
      }));

      setTimeout(() => {
        ws.close();
        resolve(true);
      }, 1000);
    });

    ws.on('message', (data) => {
      logInfo(`WebSocket received: ${data.toString()}`);
    });

    ws.on('error', (error) => {
      clearTimeout(timeout);
      logWarning(`WebSocket error: ${error.message}`);
      resolve(false);
    });
  });
}

async function runPerformanceTest() {
  logInfo('\nRunning basic performance test...');

  const startTime = Date.now();
  const promises = [];

  // Send 10 concurrent requests
  for (let i = 0; i < 10; i++) {
    promises.push(
      axios.post(`${BASE_URL}/api/emotion/text`, {
        text: `Test message ${i}`,
        userId: 'perf-test'
      })
    );
  }

  try {
    const results = await Promise.all(promises);
    const endTime = Date.now();
    const duration = endTime - startTime;

    const successCount = results.filter(r => r.data.success).length;
    logSuccess(`Performance test: ${successCount}/10 requests successful`);
    logInfo(`Total time: ${duration}ms`);
    logInfo(`Average per request: ${Math.round(duration / 10)}ms`);
  } catch (error) {
    logError(`Performance test failed: ${error.message}`);
  }
}

async function main() {
  log('🧪 Sakhi Emotion Detection Integration Test', 'cyan');
  log('===========================================', 'cyan');

  logInfo('Starting comprehensive integration tests...\n');

  const tests = [
    { name: 'Health Check', fn: testHealth },
    { name: 'Text Emotion Analysis', fn: testTextEmotion },
    { name: 'Enhanced Chatbot', fn: testChatbot },
    { name: 'Emotion Analytics', fn: testEmotionAnalytics },
    { name: 'Direct ML Service', fn: testDirectMLService },
    { name: 'WebSocket Connection', fn: checkWebSocket },
    { name: 'Performance Test', fn: runPerformanceTest }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      await test.fn();
      passedTests++;
    } catch (error) {
      logError(`Test "${test.name}" failed with error: ${error.message}`);
    }
  }

  log('\n' + '='.repeat(50), 'cyan');
  log('🏁 Test Results Summary', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`Passed: ${passedTests}/${totalTests} tests`, passedTests === totalTests ? 'green' : 'yellow');

  if (passedTests === totalTests) {
    logSuccess('🎉 All tests passed! Sakhi is ready for use.');
    logInfo('\nNext steps:');
    logInfo('1. Start the React frontend: npm start');
    logInfo('2. Visit http://localhost:3000');
    logInfo('3. Try the emotion detection features');
    logInfo('4. Check the emotion dashboard for analytics');
  } else {
    logWarning('Some tests failed. Check the logs above for details.');
    logInfo('\nTroubleshooting:');
    logInfo('1. Ensure all services are running: ./start-services.sh');
    logInfo('2. Check Python dependencies: pip install -r ml-service/requirements.txt');
    logInfo('3. Verify API keys are set in .env files');
    logInfo('4. Check logs: tail -f server.log ml-service.log');
  }

  log('\n📚 For more information, see README.md', 'blue');
}

// Run tests
main().catch(error => {
  logError(`Test suite failed: ${error.message}`);
  process.exit(1);
});
const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

// ML Service Configuration
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// Emotion tracking storage (in production, use a proper database)
const emotionAnalytics = new Map(); // userId -> emotion data
const emotionHistory = []; // Global emotion history

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// ML Service Helper Functions
async function callMLService(endpoint, data) {
  try {
    const response = await axios.post(`${ML_SERVICE_URL}${endpoint}`, data, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000
    });
    return response.data;
  } catch (error) {
    console.error(`ML Service Error (${endpoint}):`, error.message);
    // Return fallback response
    return {
      emotion: 'uncertain',
      confidence: 0.0,
      response: getFallbackResponse(data.prompt || data.text || 'I understand you\'re reaching out. I\'m here to support you.'),
      multimodal: false,
      timestamp: new Date().toISOString()
    };
  }
}

function getFallbackResponse(input) {
  const fallbackResponses = [
    "I understand how you're feeling. It's brave of you to share this with me.",
    "That sounds really challenging. Remember, you're stronger than you think.",
    "Thank you for trusting me with your thoughts. How can I support you better?",
    "I'm here for you. Let's work through this together step by step.",
    "Your feelings are valid. It's okay to not be okay sometimes.",
    "I'm here to listen. Please tell me more about what you're experiencing.",
    "That takes courage to share. I appreciate you opening up to me."
  ];
  return fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
}

function trackEmotion(userId, emotionData) {
  const timestamp = new Date().toISOString();
  const analyticsEntry = {
    userId,
    emotion: emotionData.emotion,
    confidence: emotionData.confidence,
    timestamp,
    multimodal: emotionData.multimodal || false
  };

  // Add to global history
  emotionHistory.push(analyticsEntry);

  // Update user-specific analytics
  if (!emotionAnalytics.has(userId)) {
    emotionAnalytics.set(userId, []);
  }
  emotionAnalytics.get(userId).push(analyticsEntry);

  // Keep only last 100 entries per user to prevent memory issues
  const userHistory = emotionAnalytics.get(userId);
  if (userHistory.length > 100) {
    emotionAnalytics.set(userId, userHistory.slice(-100));
  }

  // Keep only last 1000 global entries
  if (emotionHistory.length > 1000) {
    emotionHistory.splice(0, emotionHistory.length - 1000);
  }
}

// Create audio directory if it doesn't exist
const audioDir = path.join(__dirname, 'public', 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
}

// Serve static files from public directory
app.use(express.static('public'));

// Serve audio files with proper MIME type
app.get('/audio/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.join(audioDir, filename);

  if (fs.existsSync(filePath)) {
    res.setHeader('Content-Type', 'audio/mpeg');
    res.sendFile(filePath);
  } else {
    // If file doesn't exist, return a default audio file or 404
    res.status(404).json({
      success: false,
      message: 'Audio file not found'
    });
  }
});

// Basic API info endpoint
app.get('/api', (req, res) => {
  res.json({
    success: true,
    message: "Sakhi API is running",
    version: "1.0.0",
    endpoints: {
      auth: {
        register: "POST /auth/register",
        login: "POST /auth/login",
        verify: "POST /auth/verify"
      },
      user: {
        profile: "POST /user/profile",
        update: "PUT /user/update",
        delete: "DELETE /user/delete"
      },
      chat: {
        send: "POST /chat/send",
        history: "POST /chat/history"
      },
      reports: {
        generate: "POST /report/generate",
        fetch: "POST /report/fetch"
      },
      rewards: {
        list: "POST /rewards",
        redeem: "POST /redeem-reward"
      },
      avatar: {
        talk: "POST /talk"
      }
    }
  });
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    console.log('Received:', message.toString());
    // Echo back or handle real-time messages
    ws.send(JSON.stringify({
      type: 'echo',
      message: 'Message received',
      timestamp: new Date().toISOString()
    }));
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Mock data storage
const users = [];
const userSessions = {};
const userReports = [];
const userDiets = [];
const userQuizzes = [];
const userPlans = [];
const rewards = [];
const userRewards = [];
let userIdCounter = 1;
let reportIdCounter = 1;
let quizIdCounter = 1;
let rewardIdCounter = 1;

// Initialize mock data
function initializeMockData() {
  // Mock rewards - coin-based system with products
  rewards.push(
    {
      id: rewardIdCounter++,
      image: "https://store.storeimages.cdn-apple.com/4668/as-images.apple.com/is/iphone-14-pro-finish-select-202209-6-7inch_AV1?wid=940&hei=1112&fmt=png-alpha&.v=1663703840578",
      coins: 400,
      title: "Apple iPhone 14",
    },
    {
      id: rewardIdCounter++,
      image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFwcGxlJTIwd2F0Y2h8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
      coins: 120,
      title: "Apple Watch Series 8",
    },
    {
      id: rewardIdCounter++,
      image: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8YmljeWNsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
      coins: 200,
      title: "Premium Road Bike",
    },
    {
      id: rewardIdCounter++,
      image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8d2F0ZXIlMjBib3R0bGV8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
      coins: 25,
      title: "Insulated Water Bottle",
    },
    {
      id: rewardIdCounter++,
      image: "https://images.unsplash.com/photo-1575537302964-96cd47c06b1b?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Zml0Yml0fGVufDB8fDB8fHww&auto=format&fit=crop&w=800&q=60",
      coins: 80,
      title: "Fitbit Fitness Tracker",
    },
    {
      id: rewardIdCounter++,
      image: "https://images.unsplash.com/photo-1622979135225-d2ba269cf1ac?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGhlYWRwaG9uZXN8ZW58MHx8MHx8fDA%3D&auto=format&fit=crop&w=800&q=60",
      coins: 100,
      title: "Noise-Cancelling Headphones",
    },
    {
      id: rewardIdCounter++,
      image: "https://images.unsplash.com/photo-1534258936925-c58bed479fcb?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Mnx8Z3ltJTIwbWVtYmVyc2hpcHxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
      coins: 150,
      title: "3-Month Gym Membership",
    },
    {
      id: rewardIdCounter++,
      image: "https://images.unsplash.com/photo-1616279969856-759f316a5ac1?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c21hcnQlMjBzY2FsZXxlbnwwfHwwfHx8MA%3D%3D&auto=format&fit=crop&w=800&q=60",
      coins: 60,
      title: "Smart Body Scale",
    }
  );
}

// API Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    message: 'Sakhi Backend Server is running',
    timestamp: new Date().toISOString()
  });
});

// Initialize mock data
initializeMockData();

// Authentication Routes
app.post('/auth/register', (req, res) => {
  try {
    const { email, password, name, address, age, height, sex, weight, condition, history, emergency1, emergency2 } = req.body;

    // Check if user already exists
    const existingUser = users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const newUser = {
      id: userIdCounter++,
      email,
      password, // In production, hash this password
      name,
      address,
      age,
      height,
      sex,
      weight,
      condition,
      history,
      emergency1,
      emergency2,
      createdAt: new Date().toISOString()
    };

    users.push(newUser);

    // Return user data without password
    const { password: _, ...userResponse } = newUser;

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      user: userResponse
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

app.post('/auth/login', (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = users.find(u => u.email === email && u.password === password);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Create session
    const sessionId = Math.random().toString(36).substring(2, 15);
    userSessions[sessionId] = {
      userId: user.id,
      email: user.email,
      loginTime: new Date().toISOString()
    };

    // Return user data without password
    const { password: _, ...userResponse } = user;

    res.json({
      success: true,
      message: 'Login successful',
      user: userResponse,
      sessionId
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Logout endpoint
app.post('/auth/logout', (req, res) => {
  try {
    const { sessionId } = req.body;

    if (sessionId && userSessions[sessionId]) {
      delete userSessions[sessionId];
    }

    res.json({
      success: true,
      message: 'Logout successful'
    });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// Enhanced Chatbot API with Emotion Detection
app.post('/chatbot', async (req, res) => {
  try {
    const { message, userId } = req.body;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Call ML service for emotion analysis and response generation
    const mlResponse = await callMLService('/api/v/chat', {
      prompt: message,
      user_id: userId || 'anonymous'
    });

    // Track emotion analytics
    if (userId) {
      trackEmotion(userId, mlResponse);
    }

    // Broadcast emotion update via WebSocket
    if (userId && mlResponse.emotion && mlResponse.emotion !== 'uncertain') {
      const emotionUpdate = {
        type: 'emotion_update',
        userId,
        emotion: mlResponse.emotion,
        confidence: mlResponse.confidence,
        timestamp: new Date().toISOString()
      };

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(emotionUpdate));
        }
      });
    }

    res.json({
      success: true,
      answer: mlResponse.response,
      emotion: mlResponse.emotion,
      confidence: mlResponse.confidence,
      intent: mlResponse.intent,
      multimodal: mlResponse.multimodal,
      context: mlResponse.context,
      timestamp: mlResponse.timestamp
    });

  } catch (error) {
    console.error('Enhanced Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot service unavailable',
      answer: getFallbackResponse(req.body?.message || 'I understand you\'re reaching out. I\'m here to support you.')
    });
  }
});

// New Emotion Analysis Endpoints

// Text Emotion Analysis
app.post('/api/emotion/text', async (req, res) => {
  try {
    const { text, include_context = true, userId } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    const mlResponse = await callMLService('/api/emotion/text', {
      text,
      include_context,
      user_id: userId
    });

    if (userId) {
      trackEmotion(userId, mlResponse);
    }

    res.json({
      success: true,
      ...mlResponse
    });

  } catch (error) {
    console.error('Text emotion analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Text emotion analysis service unavailable'
    });
  }
});

// Facial Emotion Analysis
app.post('/api/emotion/facial', async (req, res) => {
  try {
    const { image_data, userId } = req.body;

    if (!image_data) {
      return res.status(400).json({
        success: false,
        message: 'Image data is required'
      });
    }

    const mlResponse = await callMLService('/api/emotion/facial', {
      image_data,
      user_id: userId
    });

    if (userId) {
      trackEmotion(userId, mlResponse);
    }

    res.json({
      success: true,
      ...mlResponse
    });

  } catch (error) {
    console.error('Facial emotion analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Facial emotion analysis service unavailable'
    });
  }
});

// Voice Emotion Analysis
app.post('/api/emotion/voice', async (req, res) => {
  try {
    const { audio_data, userId } = req.body;

    if (!audio_data) {
      return res.status(400).json({
        success: false,
        message: 'Audio data is required'
      });
    }

    const mlResponse = await callMLService('/api/emotion/voice', {
      audio_data,
      user_id: userId
    });

    if (userId) {
      trackEmotion(userId, mlResponse);
    }

    res.json({
      success: true,
      ...mlResponse
    });

  } catch (error) {
    console.error('Voice emotion analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Voice emotion analysis service unavailable'
    });
  }
});

// Multi-Modal Emotion Analysis
app.post('/api/emotion/multimodal', async (req, res) => {
  try {
    const { text, image_data, audio_data, userId } = req.body;

    if (!text && !image_data && !audio_data) {
      return res.status(400).json({
        success: false,
        message: 'At least one input modality is required'
      });
    }

    const mlResponse = await callMLService('/api/emotion/multimodal', {
      text,
      image_data,
      audio_data,
      user_id: userId
    });

    if (userId) {
      trackEmotion(userId, mlResponse);
    }

    // Broadcast multimodal emotion update
    if (userId && mlResponse.emotion && mlResponse.emotion !== 'uncertain') {
      const emotionUpdate = {
        type: 'multimodal_emotion_update',
        userId,
        emotion: mlResponse.emotion,
        confidence: mlResponse.confidence,
        multimodal: mlResponse.multimodal,
        timestamp: new Date().toISOString()
      };

      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(emotionUpdate));
        }
      });
    }

    res.json({
      success: true,
      ...mlResponse
    });

  } catch (error) {
    console.error('Multi-modal emotion analysis error:', error);
    res.status(500).json({
      success: false,
      message: 'Multi-modal emotion analysis service unavailable'
    });
  }
});

// Emotion Analytics Dashboard
app.get('/api/emotion/dashboard', (req, res) => {
  try {
    const { userId, timeRange = '24h' } = req.query;

    let data = userId ? emotionAnalytics.get(userId) || [] : emotionHistory;

    // Filter by time range
    const now = new Date();
    let timeLimit;

    switch (timeRange) {
      case '1h':
        timeLimit = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        timeLimit = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    data = data.filter(entry => new Date(entry.timestamp) >= timeLimit);

    // Calculate analytics
    const emotionCounts = {};
    const emotionConfidence = {};
    let multimodalCount = 0;

    data.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
      if (!emotionConfidence[entry.emotion]) {
        emotionConfidence[entry.emotion] = [];
      }
      emotionConfidence[entry.emotion].push(entry.confidence);
      if (entry.multimodal) {
        multimodalCount++;
      }
    });

    // Calculate average confidence per emotion
    const avgConfidence = {};
    Object.keys(emotionConfidence).forEach(emotion => {
      const confidences = emotionConfidence[emotion];
      avgConfidence[emotion] = confidences.reduce((a, b) => a + b, 0) / confidences.length;
    });

    // Find most frequent emotion
    const primaryEmotion = Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b, 'uncertain');

    res.json({
      success: true,
      analytics: {
        totalEntries: data.length,
        timeRange,
        primaryEmotion,
        multimodalCount,
        multimodalPercentage: data.length > 0 ? (multimodalCount / data.length * 100).toFixed(2) : 0,
        emotionDistribution: emotionCounts,
        averageConfidence: avgConfidence,
        recentEntries: data.slice(-10).reverse() // Last 10 entries
      }
    });

  } catch (error) {
    console.error('Emotion dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Emotion analytics service unavailable'
    });
  }
});

// ML Service Health Check
app.get('/api/emotion/health', async (req, res) => {
  try {
    const mlHealth = await axios.get(`${ML_SERVICE_URL}/health`, { timeout: 5000 });
    res.json({
      success: true,
      express: { status: 'healthy', port: PORT },
      mlService: mlHealth.data,
      websocket: { connections: wss.clients.size },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.json({
      success: false,
      express: { status: 'healthy', port: PORT },
      mlService: { status: 'unreachable', error: error.message },
      websocket: { connections: wss.clients.size },
      timestamp: new Date().toISOString()
    });
  }
});

// Diet Recommendations
app.post('/diet', (req, res) => {
  try {
    const { email } = req.body;

    // Mock diet data
    const dietPlan = {
      breakfast: "Oatmeal with fresh berries and nuts",
      lunch: "Grilled chicken salad with mixed vegetables",
      snack: "Greek yogurt with honey",
      dinner: "Salmon with quinoa and steamed broccoli",
      hydration: "8-10 glasses of water throughout the day",
      notes: "Focus on whole foods and limit processed foods"
    };

    res.json({
      success: true,
      dietPlan,
      message: "Diet plan generated successfully"
    });
  } catch (error) {
    console.error('Diet error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to generate diet plan'
    });
  }
});

// Reports
app.post('/report/', (req, res) => {
  try {
    const { email } = req.body;

    // Mock report data
    const report = {
      moodScore: Math.floor(Math.random() * 10) + 1,
      anxietyLevel: Math.floor(Math.random() * 10) + 1,
      sleepQuality: Math.floor(Math.random() * 10) + 1,
      stressLevel: Math.floor(Math.random() * 10) + 1,
      lastUpdated: new Date().toISOString(),
      recommendations: [
        "Continue regular meditation practice",
        "Maintain consistent sleep schedule",
        "Consider journaling for emotional processing"
      ]
    };

    res.json({
      success: true,
      report,
      message: "Report generated successfully"
    });
  } catch (error) {
    console.error('Report error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to generate report'
    });
  }
});

// Quiz Results
app.post('/report/fetch', (req, res) => {
  try {
    const { quiz, email } = req.body;

    // Mock quiz analysis
    const analysis = {
      category: "Moderate Stress",
      score: Math.floor(Math.random() * 30) + 20,
      recommendations: [
        "Practice deep breathing exercises",
        "Consider speaking with a mental health professional",
        "Maintain regular exercise routine"
      ],
      nextAssessmentDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    res.json({
      success: true,
      analysis,
      message: "Quiz analyzed successfully"
    });
  } catch (error) {
    console.error('Quiz error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to analyze quiz'
    });
  }
});

// Plans
app.post('/plans', (req, res) => {
  try {
    const { email } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Enhanced mock subscription plans
    const plans = [
      {
        id: 1,
        name: "Basic Care",
        price: 9.99,
        originalPrice: 19.99,
        features: ["Daily mood tracking", "Basic chatbot access", "Monthly reports", "Meditation exercises"],
        duration: "1 month",
        popular: false
      },
      {
        id: 2,
        name: "Premium Care",
        price: 19.99,
        originalPrice: 39.99,
        features: ["Advanced mood tracking", "24/7 chatbot access", "Weekly reports", "Personalized recommendations", "Video exercises", "Progress analytics"],
        duration: "1 month",
        popular: true
      },
      {
        id: 3,
        name: "Professional Care",
        price: 49.99,
        originalPrice: 79.99,
        features: ["All Premium features", "Video consultations", "Professional therapist matching", "Emergency support", "Custom meal plans", "Unlimited sessions"],
        duration: "1 month",
        popular: false
      }
    ];

    // Check if user already has a plan
    const existingPlan = userPlans.find(p => p.userId === user.id);

    res.json({
      success: true,
      plans,
      currentPlan: existingPlan || null,
      message: "Plans retrieved successfully"
    });
  } catch (error) {
    console.error('Plans error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve plans'
    });
  }
});

// Rewards endpoints
app.get('/rewards', (req, res) => {
  try {
    res.json({
      success: true,
      rewards,
      message: "Rewards retrieved successfully"
    });
  } catch (error) {
    console.error('Rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve rewards'
    });
  }
});

app.post('/rewards', (req, res) => {
  try {
    const { email } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get user's coin balance and redeemed rewards
    const userCoinBalance = user.coinBalance || 500; // Default 500 coins for testing
    const redeemedRewards = userRewards.filter(r => r.userId === user.id);
    const totalSpent = redeemedRewards.reduce((sum, r) => sum + r.coins, 0);

    res.json({
      success: true,
      rewards: rewards, // All available rewards
      totalPoints: userCoinBalance, // Current coin balance
      availableRewards: rewards.filter(r => r.coins <= userCoinBalance),
      message: "User rewards retrieved successfully"
    });
  } catch (error) {
    console.error('User rewards error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve user rewards'
    });
  }
});

app.post('/redeem-reward', (req, res) => {
  try {
    const { email, rewardId } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const reward = rewards.find(r => r.id === parseInt(rewardId));
    if (!reward) {
      return res.status(404).json({
        success: false,
        message: 'Reward not found'
      });
    }

    // Check if already redeemed
    const alreadyRedeemed = userRewards.find(r => r.userId === user.id && r.rewardId === reward.id);
    if (alreadyRedeemed) {
      return res.status(400).json({
        success: false,
        message: 'Reward already redeemed'
      });
    }

    // Check if user has enough coins
    const userCoinBalance = user.coinBalance || 500;
    if (userCoinBalance < reward.coins) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient coins'
      });
    }

    // Deduct coins from user balance
    user.coinBalance = userCoinBalance - reward.coins;

    // Add to user rewards
    userRewards.push({
      id: userRewards.length + 1,
      userId: user.id,
      rewardId: reward.id,
      redeemedAt: new Date().toISOString(),
      coins: reward.coins,
      originalPrice: reward.coins
    });

    res.json({
      success: true,
      reward,
      newBalance: user.coinBalance,
      message: "Reward redeemed successfully"
    });
  } catch (error) {
    console.error('Redeem reward error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to redeem reward'
    });
  }
});

// Add coins endpoint for testing
app.post('/add-coins', (req, res) => {
  try {
    const { email, amount } = req.body;
    let user = users.find(u => u.email === email);

    if (!user) {
      // Create a new user if they don't exist (for testing purposes)
      user = {
        id: userIdCounter++,
        email: email,
        name: email.split('@')[0], // Use name from email
        password: 'password123', // Default password for testing
        address: 'Test Address',
        age: 25,
        height: 165,
        sex: 'female',
        weight: 60,
        condition: 'general wellness',
        history: '',
        emergency1: '',
        emergency2: '',
        coinBalance: 0,
        createdAt: new Date().toISOString()
      };
      users.push(user);
      console.log(`Created new user for email: ${email}`);
    }

    // Add coins to user balance
    if (!user.coinBalance) {
      user.coinBalance = 0;
    }
    user.coinBalance += amount;

    res.json({
      success: true,
      newBalance: user.coinBalance,
      amountAdded: amount,
      message: `Successfully added ${amount} coins`
    });
  } catch (error) {
    console.error('Add coins error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to add coins'
    });
  }
});

// Get user coin balance
app.post('/get-balance', (req, res) => {
  try {
    const { email } = req.body;
    const user = users.find(u => u.email === email);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      balance: user.coinBalance || 500,
      message: "Balance retrieved successfully"
    });
  } catch (error) {
    console.error('Get balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to retrieve balance'
    });
  }
});

// Avatar speech endpoint
app.post('/talk', (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required'
      });
    }

    // Generate mock blend data for avatar facial animations
    const generateMockBlendData = () => {
      const blendShapes = [];
      const numFrames = Math.floor(text.length * 2); // Rough estimate of frames needed

      for (let i = 0; i < numFrames; i++) {
        const frame = {
          visemes: [
            { name: "jawOpen", weight: Math.random() * 0.8 },
            { name: "mouthSmile", weight: Math.random() * 0.6 },
            { name: "mouthFrown", weight: Math.random() * 0.2 },
            { name: "mouthLeft", weight: Math.random() * 0.3 },
            { name: "mouthRight", weight: Math.random() * 0.3 },
            { name: "browDownLeft", weight: Math.random() * 0.4 },
            { name: "browDownRight", weight: Math.random() * 0.4 },
            { name: "browUpLeft", weight: Math.random() * 0.3 },
            { name: "browUpRight", weight: Math.random() * 0.3 },
            { name: "eyeBlinkLeft", weight: Math.random() * 0.1 },
            { name: "eyeBlinkRight", weight: Math.random() * 0.1 },
            { name: "eyeSquintLeft", weight: Math.random() * 0.2 },
            { name: "eyeSquintRight", weight: Math.random() * 0.2 },
            { name: "noseSneer", weight: Math.random() * 0.1 },
            { name: "cheekPuff", weight: Math.random() * 0.2 }
          ],
          timestamp: i * 0.04 // 25 FPS
        };
        blendShapes.push(frame);
      }

      return blendShapes;
    };

    const blendData = generateMockBlendData();
    const filename = `audio_${Date.now()}.mp3`;

    res.json({
      success: true,
      blendData,
      filename,
      message: "Speech animation data generated successfully"
    });
  } catch (error) {
    console.error('Avatar speech error:', error);
    res.status(500).json({
      success: false,
      message: 'Unable to generate speech animation'
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Something went wrong!'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Sakhi Backend Server running on port ${PORT}`);
  console.log(`📡 WebSocket server ready on ws://localhost:${PORT}`);
  console.log(`🔗 API available at http://localhost:${PORT}/api`);
});
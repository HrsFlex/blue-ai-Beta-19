const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const http = require('http');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

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
  // Mock rewards
  rewards.push(
    { id: rewardIdCounter++, name: "Meditation Master", description: "Complete 7 days of meditation", points: 100, icon: "🧘" },
    { id: rewardIdCounter++, name: "Wellness Warrior", description: "Maintain mood score above 7 for a week", points: 150, icon: "⚔️" },
    { id: rewardIdCounter++, name: "Healthy Habits Hero", description: "Log meals for 30 days straight", points: 200, icon: "🥗" },
    { id: rewardIdCounter++, name: "Mindfulness Mentor", description: "Complete all mindfulness exercises", points: 250, icon: "🧠" },
    { id: rewardIdCounter++, name: "Stress Slayer", description: "Reduce stress levels by 50%", points: 300, icon: "🗡️" }
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

// Chatbot API
app.post('/chatbot', (req, res) => {
  try {
    const { message } = req.body;

    // Simulate AI companion response
    const responses = [
      "I understand how you're feeling. It's brave of you to share this with me.",
      "That sounds really challenging. Remember, you're stronger than you think.",
      "Thank you for trusting me with your thoughts. How can I support you better?",
      "I'm here for you. Let's work through this together step by step.",
      "Your feelings are valid. It's okay to not be okay sometimes."
    ];

    const aiResponse = responses[Math.floor(Math.random() * responses.length)];

    // Simulate processing delay
    setTimeout(() => {
      res.json({
        success: true,
        answer: aiResponse,
        timestamp: new Date().toISOString()
      });
    }, 1000);

  } catch (error) {
    console.error('Chatbot error:', error);
    res.status(500).json({
      success: false,
      message: 'Chatbot service unavailable'
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

    // Get user's earned rewards
    const earnedRewards = userRewards.filter(r => r.userId === user.id);
    const totalPoints = earnedRewards.reduce((sum, r) => sum + r.points, 0);

    res.json({
      success: true,
      rewards: earnedRewards,
      totalPoints,
      availableRewards: rewards,
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

    // Add to user rewards
    userRewards.push({
      id: userRewards.length + 1,
      userId: user.id,
      rewardId: reward.id,
      redeemedAt: new Date().toISOString(),
      points: reward.points
    });

    res.json({
      success: true,
      reward,
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
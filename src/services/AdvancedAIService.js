import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfig } from '../config/aiConfig';

class AdvancedAIService {
  constructor() {
    this.config = getAIConfig();
    this.isInitialized = false;
    this.genAI = null;
    this.model = null;
    this.sessionHistory = [];
    this.userSessions = new Map();
    this.initializeAI();
  }

  async initializeAI() {
    try {
      if (!this.config.isMock && this.config.apiKey) {
        this.genAI = new GoogleGenerativeAI(this.config.apiKey);
        this.model = this.genAI.getGenerativeModel({
          model: `gemini-${this.config.model.version}`,
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
          safetySettings: [
            {
              category: "HARM_CATEGORY_HARASSMENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_HATE_SPEECH",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            },
            {
              category: "HARM_CATEGORY_DANGEROUS_CONTENT",
              threshold: "BLOCK_MEDIUM_AND_ABOVE"
            }
          ]
        });
        this.isInitialized = true;
        console.log('✅ Advanced AI Service initialized successfully');
      } else {
        console.warn('⚠️ Using mock AI service for development');
      }
    } catch (error) {
      console.error('❌ Failed to initialize AI service:', error);
      this.isInitialized = false;
    }
  }

  // Advanced sentiment analysis with crisis detection
  async analyzeSentiment(text, userId = null) {
    try {
      if (!this.isInitialized || this.config.isMock) {
        return this.getMockSentimentAnalysis(text);
      }

      const sentimentPrompt = `
        Analyze the emotional sentiment and crisis level of this text. Provide a comprehensive analysis including:

        1. Sentiment score (-100 to 100, where -100 is extremely negative, 0 is neutral, 100 is extremely positive)
        2. Crisis level (0-5, where 0=no crisis, 1=mild distress, 2=moderate distress, 3=severe distress, 4=high risk, 5=immediate crisis)
        3. Primary emotions detected (list of emotions)
        4. Risk indicators (suicide, self-harm, harm to others, etc.)
        5. Urgency level (low, medium, high, critical)
        6. Recommended intervention level

        Text to analyze: "${text}"

        Respond in JSON format with these exact keys:
        {
          "sentimentScore": number,
          "crisisLevel": number,
          "emotions": ["emotion1", "emotion2"],
          "riskIndicators": ["indicator1", "indicator2"],
          "urgency": "low|medium|high|critical",
          "interventionLevel": "selfCare|support|professional|emergency"
        }
      `;

      const result = await this.model.generateContent(sentimentPrompt);
      const response = result.response;
      const analysisText = response.text();

      // Parse JSON response
      let analysis;
      try {
        // Extract JSON from response (in case there's extra text)
        const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          analysis = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        console.error('Failed to parse sentiment analysis:', parseError);
        return this.getMockSentimentAnalysis(text);
      }

      // Validate and sanitize analysis
      return {
        sentimentScore: Math.max(-100, Math.min(100, analysis.sentimentScore || 0)),
        crisisLevel: Math.max(0, Math.min(5, analysis.crisisLevel || 0)),
        emotions: Array.isArray(analysis.emotions) ? analysis.emotions : ['neutral'],
        riskIndicators: Array.isArray(analysis.riskIndicators) ? analysis.riskIndicators : [],
        urgency: ['low', 'medium', 'high', 'critical'].includes(analysis.urgency) ? analysis.urgency : 'low',
        interventionLevel: ['selfCare', 'support', 'professional', 'emergency'].includes(analysis.interventionLevel)
          ? analysis.interventionLevel : 'selfCare'
      };

    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return this.getMockSentimentAnalysis(text);
    }
  }

  // Generate personalized response based on sentiment analysis
  async generatePersonalizedResponse(text, sentimentAnalysis, userId = null) {
    try {
      if (!this.isInitialized || this.config.isMock) {
        return this.generateMockResponse(sentimentAnalysis);
      }

      // Get user session context
      const userSession = this.getUserSession(userId);

      const responsePrompt = `
        You are Sakhi, an advanced mental health AI companion. Based on the sentiment analysis, generate a personalized response.

        User Input: "${text}"
        Sentiment Analysis: ${JSON.stringify(sentimentAnalysis, null, 2)}
        Session Context: ${JSON.stringify(userSession, null, 2)}

        Guidelines:
        - If crisisLevel >= 4: Immediately provide crisis resources and emergency contacts
        - If crisisLevel >= 3: Strongly recommend professional help and provide specific resources
        - If crisisLevel >= 2: Provide supportive activities and check if they want professional resources
        - If sentimentScore < -30: Offer gentle activities and emotional support
        - If sentimentScore > 30: Provide positive reinforcement and wellness maintenance

        Generate a warm, empathetic response that:
        1. Acknowledges their feelings
        2. Provides appropriate support based on crisis level
        3. Suggests specific, actionable next steps
        4. Maintains a caring, supportive tone
        5. Uses appropriate emojis for warmth

        Keep response under 200 words and conversational.
      `;

      const result = await this.model.generateContent(responsePrompt);
      return result.response.text();

    } catch (error) {
      console.error('Response generation error:', error);
      return this.generateMockResponse(sentimentAnalysis);
    }
  }

  // Generate personalized activity recommendations
  async generateActivityRecommendations(sentimentAnalysis, userPreferences = {}) {
    try {
      if (!this.isInitialized || this.config.isMock) {
        return this.getMockActivityRecommendations(sentimentAnalysis);
      }

      const activityPrompt = `
        Based on the user's emotional state, generate personalized activity recommendations.

        Sentiment Analysis: ${JSON.stringify(sentimentAnalysis, null, 2)}
        User Preferences: ${JSON.stringify(userPreferences, null, 2)}

        Generate 3-5 activity recommendations that are:
        1. Appropriate for their crisis level
        2. Evidence-based for mental wellness
        3. Specific and actionable
        4. Personalized to their emotional state

        For each activity include:
        - Title (engaging and positive)
        - Description (what to do and why it helps)
        - Duration (how long to do it)
        - Difficulty (easy, medium, hard)
        - Mood impact (what emotions it targets)

        Format as JSON array of activity objects.
      `;

      const result = await this.model.generateContent(activityPrompt);
      const response = result.response.text();

      try {
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          return JSON.parse(jsonMatch[0]);
        }
      } catch (parseError) {
        console.error('Failed to parse activity recommendations:', parseError);
      }

      return this.getMockActivityRecommendations(sentimentAnalysis);

    } catch (error) {
      console.error('Activity recommendation error:', error);
      return this.getMockActivityRecommendations(sentimentAnalysis);
    }
  }

  // Generate crisis response and resources
  generateCrisisResponse(sentimentAnalysis) {
    const responses = {
      5: {
        message: "🚨 **IMMEDIATE CRISIS SUPPORT NEEDED** 🚨\n\nI'm very concerned about your safety right now. Please reach out immediately:\n\n📞 **Emergency Services**: 911\n📱 **Crisis Hotline**: 988\n💬 **Crisis Text Line**: Text HOME to 741741\n\nYou matter, and people want to help you through this. Please reach out now - you don't have to face this alone.",
        resources: [
          { name: "988 Suicide & Crisis Lifeline", phone: "988", available: "24/7" },
          { name: "Crisis Text Line", text: "HOME to 741741", available: "24/7" },
          { name: "Emergency Services", phone: "911", available: "24/7" }
        ],
        emergencyLevel: "immediate"
      },
      4: {
        message: "🚨 **HIGH PRIORITY - PROFESSIONAL HELP NEEDED** 🚨\n\nI'm concerned about your wellbeing. Please reach out to a mental health professional today:\n\n📞 **988 Crisis Line**: 988\n🏥 **Emergency Room**: Go to nearest ER\n👨‍⚕️ **Therapist**: Contact immediately\n\nYour safety is the top priority. These feelings are treatable, and professionals can help.",
        resources: [
          { name: "988 Suicide & Crisis Lifeline", phone: "988", available: "24/7" },
          { name: "National Alliance on Mental Illness", phone: "1-800-950-NAMI", available: "Mon-Fri 10am-10pm ET" },
          { name: "Emergency Services", phone: "911", available: "24/7" }
        ],
        emergencyLevel: "high"
      },
      3: {
        message: "💙 **PROFESSIONAL SUPPORT RECOMMENDED** 💙\n\nIt sounds like you're going through a really difficult time. I strongly recommend speaking with a mental health professional who can provide specialized support:\n\n👨‍⚕️ **Therapist/Counselor**: Find one today\n📱 **Therapy Apps**: BetterHelp, Talkspace\n🏥 **Doctor**: Your primary care physician\n\nYou don't have to carry this alone. Professional help can make a real difference.",
        resources: [
          { name: "Psychology Today Therapist Finder", url: "https://www.psychologytoday.com/us/therapists" },
          { name: "BetterHelp Online Therapy", url: "https://www.betterhelp.com" },
          { name: "National Suicide Prevention Lifeline", phone: "1-800-273-8255", available: "24/7" }
        ],
        emergencyLevel: "professional"
      }
    };

    return responses[sentimentAnalysis.crisisLevel] || responses[2];
  }

  // User session management
  getUserSession(userId) {
    if (!userId) return { isNewUser: true, sessionCount: 0 };

    if (!this.userSessions.has(userId)) {
      this.userSessions.set(userId, {
        sessionCount: 0,
        lastVisit: null,
        totalInteractions: 0,
        moodHistory: [],
        activitiesCompleted: [],
        crisisEvents: []
      });
    }

    return this.userSessions.get(userId);
  }

  updateUserSession(userId, updates) {
    const session = this.getUserSession(userId);
    Object.assign(session, updates);
    this.userSessions.set(userId, session);
  }

  // Mock methods for development
  getMockSentimentAnalysis(text) {
    const lowerText = text.toLowerCase();

    // Crisis detection keywords
    const crisisKeywords = {
      suicide: ['kill myself', 'want to die', 'suicide', 'end my life', 'kill myself', 'want to kill', 'end it all'],
      selfHarm: ['hurt myself', 'cut myself', 'self harm', 'harm myself'],
      depression: ['depressed', 'hopeless', 'worthless', 'pointless', 'no reason', 'better off dead'],
      anxiety: ['anxious', 'panic', 'overwhelmed', 'can\'t breathe', 'racing heart']
    };

    let crisisLevel = 0;
    let riskIndicators = [];
    let sentimentScore = 0;

    // Check for crisis indicators
    for (const [type, keywords] of Object.entries(crisisKeywords)) {
      for (const keyword of keywords) {
        if (lowerText.includes(keyword)) {
          if (type === 'suicide') crisisLevel = 5;
          else if (type === 'selfHarm') crisisLevel = 4;
          else if (type === 'depression') crisisLevel = 3;
          else if (type === 'anxiety') crisisLevel = 2;

          riskIndicators.push(type);
          sentimentScore -= 30;
          break;
        }
      }
    }

    // Basic sentiment analysis
    const positiveWords = ['happy', 'good', 'great', 'better', 'amazing', 'wonderful', 'love', 'excited'];
    const negativeWords = ['sad', 'bad', 'angry', 'frustrated', 'upset', 'hurt', 'pain', 'lonely', 'empty'];

    for (const word of positiveWords) {
      if (lowerText.includes(word)) sentimentScore += 20;
    }

    for (const word of negativeWords) {
      if (lowerText.includes(word)) sentimentScore -= 20;
    }

    // Determine urgency and intervention
    let urgency = 'low';
    let interventionLevel = 'selfCare';

    if (crisisLevel >= 4) {
      urgency = 'critical';
      interventionLevel = 'emergency';
    } else if (crisisLevel >= 3) {
      urgency = 'high';
      interventionLevel = 'professional';
    } else if (crisisLevel >= 2 || sentimentScore < -30) {
      urgency = 'medium';
      interventionLevel = 'support';
    }

    return {
      sentimentScore: Math.max(-100, Math.min(100, sentimentScore)),
      crisisLevel,
      emotions: crisisLevel > 0 ? ['distressed', 'anxious'] : (sentimentScore < 0 ? ['sad', 'down'] : ['neutral']),
      riskIndicators,
      urgency,
      interventionLevel
    };
  }

  generateMockResponse(sentimentAnalysis) {
    if (sentimentAnalysis.crisisLevel >= 4) {
      return this.generateCrisisResponse(sentimentAnalysis).message;
    }

    if (sentimentAnalysis.crisisLevel >= 3) {
      return "I'm really concerned about you right now. It sounds like you're carrying a heavy burden, and I want you to know that professional help is available and can make a real difference. Would you like me to help you find mental health resources in your area? 💙";
    }

    if (sentimentAnalysis.sentimentScore < -30) {
      return "I can hear that you're going through a difficult time. Your feelings are completely valid, and I'm here to support you. Let me suggest some gentle activities that might help lift your mood even a little. Sometimes small steps can make a big difference. 🌱";
    }

    if (sentimentAnalysis.sentimentScore > 30) {
      return "It's wonderful to hear that you're feeling good! I'm glad things are going well for you. Remember to keep nurturing your mental wellness, even when you're feeling positive. What's been bringing you joy lately? ✨";
    }

    return "Thank you for sharing with me. I'm here to support you through whatever you're experiencing. Your feelings matter, and I'm committed to helping you on your wellness journey. What would be most helpful for you right now? 🌟";
  }

  getMockActivityRecommendations(sentimentAnalysis) {
    const baseActivities = [
      {
        title: "Mindful Breathing",
        description: "Take 5 deep breaths, focusing on the sensation of air entering and leaving your body. This activates your parasympathetic nervous system.",
        duration: "5 minutes",
        difficulty: "easy",
        moodImpact: ["calm", "relaxed", "centered"]
      },
      {
        title: "Gratitude Journaling",
        description: "Write down 3 things you're grateful for, no matter how small. This shifts focus to positive aspects of life.",
        duration: "10 minutes",
        difficulty: "easy",
        moodImpact: ["positive", "appreciative", "hopeful"]
      },
      {
        title: "Short Walk",
        description: "Take a 10-15 minute walk outside. Movement releases endorphins and fresh air can clear your mind.",
        duration: "15 minutes",
        difficulty: "medium",
        moodImpact: ["energized", "clear-headed", "refreshed"]
      },
      {
        title: "Listen to Uplifting Music",
        description: "Put on a song that makes you feel good or energized. Music can instantly shift your emotional state.",
        duration: "3-5 minutes",
        difficulty: "easy",
        moodImpact: ["energized", "happy", "motivated"]
      },
      {
        title: "Progressive Muscle Relaxation",
        description: "Tense and release each muscle group from toes to head. Releases physical tension and mental stress.",
        duration: "10 minutes",
        difficulty: "medium",
        moodImpact: ["relaxed", "calm", "physically released"]
      }
    ];

    if (sentimentAnalysis.crisisLevel >= 3) {
      return [
        {
          title: "Contact Crisis Support",
          description: "Reach out to 988 or a trusted friend/family member immediately. You don't have to face this alone.",
          duration: "Immediate",
          difficulty: "easy",
          moodImpact: ["supported", "safe", "connected"]
        },
        {
          title: "Grounding Exercise",
          description: "Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, 1 you can taste. This brings you to the present moment.",
          duration: "2 minutes",
          difficulty: "easy",
          moodImpact: ["grounded", "present", "calm"]
        }
      ];
    }

    return baseActivities.slice(0, 4);
  }

  // Export session data for storage
  exportUserSession(userId) {
    return this.getUserSession(userId);
  }

  // Health check
  async healthCheck() {
    return {
      status: this.isInitialized ? 'healthy' : 'unhealthy',
      model: this.config.model.name,
      provider: this.config.model.provider,
      isMock: this.config.isMock,
      activeUsers: this.userSessions.size
    };
  }
}

export default new AdvancedAIService();
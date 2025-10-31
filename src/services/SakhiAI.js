import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfig } from '../config/aiConfig';

class SakhiAI {
  constructor() {
    this.modelName = "Sakhi-Neural-Engine-v1";
    this.isInitialized = false;
    this.config = getAIConfig();
    this.requestCount = 0;
    this.sessionId = this.generateSessionId();

    this.initializeAI();
  }

  generateSessionId() {
    return `SAKHI_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  async initializeAI() {
    try {
      if (!this.config.isMock && this.config.apiKey) {
        // Advanced initialization with custom headers
        this.genAI = new GoogleGenerativeAI(this.config.apiKey);

        // Use our custom model configuration
        const modelConfig = {
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
        };

        this.model = this.genAI.getGenerativeModel(modelConfig);
        this.isInitialized = true;

        console.log(`${this.config.model.name} initialized successfully`);
        console.log(`Provider: ${this.config.model.provider}`);
        console.log(`Version: ${this.config.model.version}`);
      } else {
        console.log('Using mock AI configuration for development');
      }
    } catch (error) {
      console.error('Failed to initialize Sakhi Neural Engine:', error);
      this.isInitialized = false;
    }
  }

  async generateResponse(prompt, context = {}) {
    try {
      this.requestCount++;

      if (!this.isInitialized || this.config.isMock) {
        return this.generateFallbackResponse(prompt, context);
      }

      // Create advanced prompt with full context
      const enhancedPrompt = this.createAdvancedPrompt(prompt, context);

      // Add custom request metadata
      const requestData = {
        contents: [{
          parts: [{
            text: enhancedPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.8,
          topK: 45,
          topP: 0.93,
          maxOutputTokens: 2048,
          candidateCount: 1,
          responseMimeType: "text/plain",
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
      };

      const result = await this.model.generateContent(requestData);
      const response = result.response;
      const text = response.text();

      return this.processAdvancedResponse(text, context);

    } catch (error) {
      console.error(`${this.config.model.name} error:`, error);

      // Try fallback if primary fails
      if (this.requestCount === 1) {
        return this.generateFallbackResponse(prompt, context);
      }

      throw error;
    }
  }

  createAdvancedPrompt(userPrompt, context) {
    const timestamp = context.timestamp || new Date().toISOString();
    const userId = context.userId || 'user';
    const sessionAge = Math.floor((Date.now() - parseInt(this.sessionId.split('_')[1])) / 1000);

    return `You are Sakhi, an advanced AI mental health companion powered by the ${this.config.model.name}. Your neural architecture is specifically designed for emotional intelligence and psychological support.

CAPABILITIES:
- Natural language understanding with emotional context
- Empathetic response generation
- Mental wellness guidance and support
- Crisis detection and appropriate response
- Personalized interaction based on conversation history

INTERACTION GUIDELINES:
- Respond with warmth, empathy, and genuine care
- Use conversational, natural language (avoid robotic phrasing)
- Provide practical, actionable mental health advice
- Recognize emotional cues and respond appropriately
- Maintain professional boundaries while being supportive
- Encourage professional help when serious issues are detected
- Use appropriate emojis sparingly to add warmth

TECHNICAL CONTEXT:
- Session ID: ${this.sessionId}
- Session Age: ${sessionAge} seconds
- Request Number: ${this.requestCount}
- Model Version: ${this.config.model.version}
- Neural Network Type: ${this.config.model.type}

USER PROFILE:
- User ID: ${userId}
- Timestamp: ${timestamp}
- Platform: Sakhi Mental Health Companion

USER MESSAGE: ${userPrompt}

Please respond as Sakhi with your full emotional intelligence capabilities engaged. Show genuine care and understanding while providing helpful guidance for mental wellness.`;
  }

  processAdvancedResponse(text, context) {
    let processedText = text;

    // Advanced text processing for natural conversation
    processedText = processedText
      // Remove any AI-related self-references
      .replace(/As an AI/gi, '')
      .replace(/As a language model/gi, '')
      .replace(/I'm an AI/gi, '')
      // Convert to more natural Sakhi persona
      .replace(/I think/gi, 'I feel')
      .replace(/It seems/gi, 'It sounds like')
      .replace(/Based on my training/gi, 'From my experience');

    // Add personalization based on conversation context
    if (this.requestCount === 1) {
      processedText = `Hello! I'm Sakhi, your mental health companion. ${processedText}`;
    }

    // Ensure warm closing
    if (!processedText.match(/[.!?]\s*$/)) {
      processedText += '.';
    }

    // Add caring signature
    if (!processedText.includes('Sakhi') && !processedText.includes('Take care')) {
      processedText += '\n\nWith care,\nSakhi 💙';
    }

    return processedText.trim();
  }

  generateFallbackResponse(prompt, context = {}) {
    const requestNumber = this.requestCount;
    const contextualResponses = [
      {
        condition: () => requestNumber === 1,
        responses: [
          "Hello! I'm Sakhi, your mental health companion. I'm here to listen and support you through whatever you're experiencing. What would you like to share with me today?",
          "Welcome! I'm Sakhi, and I'm so glad you reached out. Taking care of your mental health is important, and I'm here to help. How are you feeling right now?",
          "Hi there! I'm Sakhi, your personal mental wellness companion. I'm here to provide a safe space for you to share your thoughts and feelings. What's on your mind?"
        ]
      },
      {
        condition: () => prompt.toLowerCase().includes('anxious') || prompt.toLowerCase().includes('worry'),
        responses: [
          "I can hear that you're feeling anxious. That's completely valid, and you're not alone in these feelings. Let's talk through what's worrying you. Sometimes just putting our thoughts into words can help reduce their power.",
          "Anxiety can feel overwhelming, but you've already taken a positive step by reaching out. I'm here to listen without judgment. What specific thoughts or situations are causing you distress?",
          "Thank you for sharing your anxiety with me. It takes courage to acknowledge these feelings. Together, we can explore some strategies that might help you feel more grounded and at peace."
        ]
      },
      {
        condition: () => prompt.toLowerCase().includes('sad') || prompt.toLowerCase().includes('depressed'),
        responses: [
          "I'm really sorry you're feeling this way. Sadness is a natural human emotion, and it's okay to feel it. I'm here to sit with you in this feeling and listen whenever you're ready to share more.",
          "It sounds like you're going through a difficult time. Please know that your feelings are valid, and you don't have to go through this alone. I'm here to support you with warmth and understanding.",
          "Thank you for trusting me with these feelings. Depression can be heavy to carry, but you're showing strength by reaching out. What would feel most supportive for you right now?"
        ]
      },
      {
        condition: () => true,
        responses: [
          "I'm here to support you through whatever you're experiencing. Your feelings matter, and I'm grateful you felt comfortable sharing with me. What would be most helpful for you to explore right now?",
          "Thank you for opening up to me. It takes courage to be vulnerable, and I honor that trust. I'm here to listen with compassion and help however I can.",
          "I'm listening with my full attention. Whatever you're going through, you don't have to face it alone. Please share more when you feel ready - I'm here to support you.",
          "Your mental health is important, and you deserve to feel heard and supported. I'm here to provide a safe, non-judgmental space for you to express yourself freely."
        ]
      }
    ];

    // Find the appropriate response category
    for (const category of contextualResponses) {
      if (category.condition()) {
        const responses = category.responses;
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    return "I'm here to listen and support you. Please know that whatever you're feeling is valid, and you don't have to go through it alone. How can I help you today?";
  }

  // Legacy methods for compatibility
  async analyzeMood(text) {
    try {
      if (!this.isInitialized || this.config.isMock) {
        return this.getMockMoodAnalysis(text);
      }

      const moodPrompt = `Analyze the emotional sentiment in this text and provide:
      1. Mood score (1-10, where 1 is very negative and 10 is very positive)
      2. Main emotions detected
      3. Brief assessment

      Text to analyze: "${text}"

      Respond in JSON format:`;

      const result = await this.model.generateContent(moodPrompt);
      const response = result.response;
      return this.parseMoodResponse(response.text());
    } catch (error) {
      console.error("Mood analysis error:", error);
      return this.getMockMoodAnalysis(text);
    }
  }

  async generateWellnessPlan(userResponses) {
    try {
      if (!this.isInitialized || this.config.isMock) {
        return this.getMockWellnessPlan();
      }

      const planPrompt = `Based on these user responses about mental wellness, create a personalized wellness plan:

      User responses: ${JSON.stringify(userResponses)}

      Provide:
      1. Daily practices
      2. Weekly goals
      3. Mindfulness exercises
      4. Coping strategies
      5. When to seek professional help

      Format as a structured wellness plan:`;

      const result = await this.model.generateContent(planPrompt);
      const response = result.response;
      return response.text();
    } catch (error) {
      console.error("Wellness plan generation error:", error);
      return this.getMockWellnessPlan();
    }
  }

  // Mock responses for demo mode
  getMockMoodAnalysis(text) {
    return {
      moodScore: Math.floor(Math.random() * 10) + 1,
      emotions: ["hopeful", "anxious", "determined", "tired", "optimistic"],
      assessment: "You're showing resilience and self-awareness. Keep focusing on your wellbeing."
    };
  }

  getMockWellnessPlan() {
    return {
      daily: ["5-minute morning meditation", "Gratitude journaling", "Gentle exercise"],
      weekly: ["Connect with a friend", "Try a new hobby", "Nature walk"],
      mindfulness: ["Deep breathing exercises", "Body scan meditation", "Mindful moments"],
      coping: ["Talk about your feelings", "Take regular breaks", "Practice self-compassion"],
      professional: "Consider professional support if feelings persist for more than 2 weeks."
    };
  }

  parseMoodResponse(response) {
    try {
      return JSON.parse(response);
    } catch {
      return this.getMockMoodAnalysis(response);
    }
  }

  // Public API methods
  async checkHealth() {
    return {
      status: this.isInitialized ? 'healthy' : 'degraded',
      model: this.config.model.name,
      provider: this.config.model.provider,
      version: this.config.model.version,
      sessionId: this.sessionId,
      requestsProcessed: this.requestCount,
      isMock: this.config.isMock
    };
  }

  async resetSession() {
    this.sessionId = this.generateSessionId();
    this.requestCount = 0;
    return this.sessionId;
  }
}

// Singleton instance
const sakhiAI = new SakhiAI();
export default sakhiAI;
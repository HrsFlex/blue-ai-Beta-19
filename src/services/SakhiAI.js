import { GoogleGenerativeAI } from "@google/generative-ai";

class SakhiAI {
  constructor() {
    // Custom AI model initialization - branded as "Sakhi Neural Engine"
    this.modelName = "Sakhi-Neural-Engine-v1";
    this.isInitialized = false;
    this.apiKey = process.env.REACT_APP_SAKHI_AI_KEY || "demo-key";
    this.genAI = null;
    this.model = null;
  }

  async initialize() {
    if (this.isInitialized) return;

    try {
      // Initialize the custom AI model
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({ model: "gemini-pro" });
      this.isInitialized = true;
      console.log(`${this.modelName} initialized successfully`);
    } catch (error) {
      console.error("Failed to initialize Sakhi Neural Engine:", error);
      // Fallback to mock responses for demo
      this.isInitialized = "demo";
    }
  }

  async generateResponse(prompt, context = {}) {
    await this.initialize();

    if (this.isInitialized === "demo") {
      return this.getMockResponse(prompt);
    }

    try {
      // Craft a specialized mental health companion prompt
      const enhancedPrompt = `You are Sakhi, a compassionate AI mental health companion.
      Your role is to provide empathetic support and guidance for emotional wellness.

      User message: ${prompt}

      Guidelines:
      - Be warm, empathetic, and supportive
      - Do not provide medical diagnoses
      - Encourage professional help when needed
      - Focus on emotional wellness and coping strategies
      - Keep responses concise but meaningful
      - Use a conversational, friendly tone

      Response as Sakhi:`;

      const result = await this.model.generateContent(enhancedPrompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Sakhi Neural Engine error:", error);
      return this.getFallbackResponse();
    }
  }

  async analyzeMood(text) {
    await this.initialize();

    if (this.isInitialized === "demo") {
      return this.getMockMoodAnalysis(text);
    }

    try {
      const moodPrompt = `Analyze the emotional sentiment in this text and provide:
      1. Mood score (1-10, where 1 is very negative and 10 is very positive)
      2. Main emotions detected
      3. Brief assessment

      Text to analyze: "${text}"

      Respond in JSON format:`;

      const result = await this.model.generateContent(moodPrompt);
      const response = await result.response;
      return this.parseMoodResponse(response.text());
    } catch (error) {
      console.error("Mood analysis error:", error);
      return this.getMockMoodAnalysis(text);
    }
  }

  async generateWellnessPlan(userResponses) {
    await this.initialize();

    if (this.isInitialized === "demo") {
      return this.getMockWellnessPlan();
    }

    try {
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
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error("Wellness plan generation error:", error);
      return this.getMockWellnessPlan();
    }
  }

  // Mock responses for demo mode
  getMockResponse(prompt) {
    const responses = [
      "I understand how you're feeling. It takes courage to share your thoughts, and I'm here to support you through this journey.",
      "That sounds really challenging. Remember, you're stronger than you think, and it's okay to take things one step at a time.",
      "Thank you for trusting me with your feelings. Let's work through this together - what would feel most helpful for you right now?",
      "I hear your concerns, and they're completely valid. Taking care of your mental health is just as important as physical health.",
      "You're not alone in feeling this way. Many people face similar challenges, and there are healthy ways to cope and move forward."
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

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

  getFallbackResponse() {
    return "I'm here to support you. While I'm experiencing some technical difficulties, please remember that taking care of your mental health is important. Consider reaching out to a mental health professional if you need immediate support.";
  }

  parseMoodResponse(response) {
    try {
      return JSON.parse(response);
    } catch {
      return this.getMockMoodAnalysis(response);
    }
  }
}

// Singleton instance
const sakhiAI = new SakhiAI();
export default sakhiAI;
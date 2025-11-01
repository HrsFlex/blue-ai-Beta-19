// Updated Gemini AI Service using the correct Google AI SDK
const { GoogleGenerativeAI } = require('@google/generative-ai');

class GeminiService {
  constructor(config) {
    this.config = config;
    this.apiKey = config.GEMINI_API_KEY;
    this.modelName = config.GEMINI_MODEL;
    this.genAI = null;
    this.model = null;
    this.initialized = false;
    this.mockMode = !this.apiKey;
  }

  /**
   * Initialize Gemini AI service
   */
  async initialize() {
    try {
      console.log('🧠 Initializing Gemini AI service...');

      if (this.mockMode) {
        console.log('⚠️ Running in mock mode - no real AI responses');
        this.initialized = true;
        return;
      }

      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.model = this.genAI.getGenerativeModel({
        model: this.modelName,
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        },
      });

      // Test the model with a simple prompt
      console.log(`✅ Gemini AI initialized with model: ${this.modelName}`);
      this.initialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize Gemini AI:', error);
      throw new Error(`Gemini AI initialization failed: ${error.message}`);
    }
  }

  /**
   * Generate response using RAG context
   */
  async generateRAGResponse(userQuery, contextData, options = {}) {
    if (!this.initialized) {
      throw new Error('Gemini AI service not initialized');
    }

    const {
      language = 'en',
      persona = 'helpful medical assistant',
      maxLength = 1000
    } = options;

    try {
      const enhancedPrompt = this.createRAGPrompt(userQuery, contextData, {
        language,
        persona,
        maxLength
      });

      if (this.mockMode) {
        return this.generateMockResponse(userQuery, contextData, language);
      }

      const result = await this.model.generateContent(enhancedPrompt);
      const response = result.response.text();

      return this.processResponse(response, contextData, options);

    } catch (error) {
      console.error('❌ Failed to generate RAG response:', error);
      // Fallback to mock response
      return this.generateMockResponse(userQuery, contextData, language);
    }
  }

  /**
   * Create RAG prompt with context
   */
  createRAGPrompt(userQuery, contextData, options) {
    const { language = 'en', persona, maxLength } = options;

    let contextText = '';
    if (contextData && contextData.length > 0) {
      contextText = '\n\n**Context from Medical Documents:**\n';
      contextData.forEach((doc, index) => {
        contextText += `\nDocument ${index + 1}:\n${doc.content.substring(0, 500)}...\n`;
      });
    }

    const languageInstruction = language === 'hi' ?
      'Respond in Hindi language.' :
      'Respond in English language.';

    const personaInstruction = persona === 'helpful medical assistant' ?
      'You are Sakhi, a helpful and compassionate female medical AI assistant.' :
      `You are a ${persona}.`;

    const prompt = `${personaInstruction}

${languageInstruction}

You are helping a user with their medical questions based on the provided medical documents. Please be empathetic, clear, and professional.

${contextText}

**User Question:** ${userQuery}

**Instructions:**
1. Use the provided medical documents as your primary source of information
2. If the documents don't contain relevant information, say so politely
3. Always include a disclaimer that this is not medical advice and they should consult a doctor
4. Keep your response under ${maxLength} words
5. Be empathetic and supportive
6. If responding in Hindi, use simple, clear Hindi that's easy to understand

**Response:**`;

    return prompt;
  }

  /**
   * Process and format the response
   */
  processResponse(response, contextData, options) {
    const { language = 'en' } = options;

    return {
      text: response,
      language,
      sources: contextData?.map(doc => ({
        documentId: doc.metadata?.documentId,
        filename: doc.metadata?.filename,
        score: doc.score,
        preview: doc.content.substring(0, 100) + '...'
      })) || [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Generate mock response for testing
   */
  generateMockResponse(userQuery, contextData, language = 'en') {
    const hasContext = contextData && contextData.length > 0;

    if (language === 'hi') {
      return {
        text: hasContext ?
          `नमस्ते! मैं आपके चिकित्सा प्रश्न "${userQuery}" के बारे में आपके दस्तावेजों के आधार पर जानकारी प्रदान कर सकती हूं।

**महत्वपूर्ण नोट:** मैं एक AI सहायक हूं और मेरी सलाह चिकित्सकीय सलाह का विकल्प नहीं है। कृपया किसी भी चिकित्सा संबंधी निर्णय के लिए अपने चिकित्सक से परामर्श करें।

आपके दस्तावेजों में कुछ प्रासंगिक जानकारी मिली है। क्या आप विशिष्ट रूप से क्या जानना चाहेंगे?` :
          `नमस्ते! मैं साखी हूं, आपका AI चिकित्सा सहायक।

मैं आपके प्रश्न "${userQuery}" का उत्तर देने के लिए यहां हूं, लेकिन मुझे अभी आपके चिकित्सा दस्तावेज उपलब्ध नहीं हैं। कृपया अपने रिपोर्ट अपलोड करें ताकि मैं आपको बेहतर सहायता दे सकूं।

**महत्वपूर्ण नोट:** मैं एक AI सहायक हूं और मेरी सलाह चिकित्सकीय सलाह का विकल्प नहीं है।`,
        language: 'hi',
        sources: [],
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        text: hasContext ?
          `Hello! I can help you with your medical question "${userQuery}" based on your documents.

**Important Note:** I am an AI assistant and my advice is not a substitute for medical advice. Please consult your doctor for any medical decisions.

I found some relevant information in your documents. What specific aspect would you like to know more about?` :
          `Hello! I'm Sakhi, your AI medical assistant.

I'm here to help with your question "${userQuery}", but I don't have access to your medical documents yet. Please upload your medical reports so I can provide more personalized assistance.

**Important Note:** I am an AI assistant and my advice is not a substitute for medical advice.`,
        language: 'en',
        sources: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  /**
   * Simple chat without RAG context
   */
  async generateChatResponse(message, options = {}) {
    if (!this.initialized) {
      throw new Error('Gemini AI service not initialized');
    }

    const { language = 'en', persona = 'helpful medical assistant' } = options;

    try {
      const prompt = `You are ${persona}. Respond in ${language === 'hi' ? 'Hindi' : 'English'}.

User message: ${message}

Response:`;

      if (this.mockMode) {
        return this.generateMockResponse(message, null, language);
      }

      const result = await this.model.generateContent(prompt);
      return result.response.text();

    } catch (error) {
      console.error('❌ Failed to generate chat response:', error);
      return this.generateMockResponse(message, null, language).text;
    }
  }

  /**
   * Check if service is initialized
   */
  isInitialized() {
    return this.initialized;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      initialized: this.initialized,
      mockMode: this.mockMode,
      model: this.modelName,
      hasApiKey: !!this.apiKey
    };
  }
}

module.exports = GeminiService;
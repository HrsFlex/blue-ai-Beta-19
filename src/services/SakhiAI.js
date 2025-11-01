import { GoogleGenerativeAI } from '@google/generative-ai';
import { getAIConfig } from '../config/aiConfig';
import axios from 'axios';

class SakhiAI {
  constructor() {
    this.modelName = "Sakhi-Neural-Engine-v1";
    this.isInitialized = false;
    this.config = getAIConfig();
    this.requestCount = 0;
    this.sessionId = this.generateSessionId();

    // RAG Engine Configuration - Always enabled now
    this.ragEnabled = true;
    this.ragBaseUrl = 'http://localhost:5000';
    this.ragApiKey = ''; // No API key required for local development

    // Initialize local data storage
    this.initializeDataStorage();

    this.initializeAI();
  }

  generateSessionId() {
    return `SAKHI_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  initializeDataStorage() {
    try {
      // Initialize localStorage for document storage
      if (!localStorage.getItem('sakhi_documents')) {
        localStorage.setItem('sakhi_documents', JSON.stringify({}));
      }
      console.log('✅ Local data storage initialized in SakhiAI');
    } catch (error) {
      console.error('❌ Failed to initialize data storage:', error);
    }
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

      // Try RAG Engine first if enabled
      if (this.ragEnabled) {
        try {
          const ragResponse = await this.generateRAGResponse(prompt, context);
          if (ragResponse) {
            console.log("✅ Using RAG response");
            return ragResponse;
          }
        } catch (ragError) {
          console.warn("⚠️ RAG engine failed, falling back to standard AI:", ragError.message);
        }
      }

      // Fallback to original AI implementation
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

  // Local Storage Data Management
  saveDocumentToLocalStorage(documentData) {
    try {
      const documents = JSON.parse(localStorage.getItem('sakhi_documents') || '{}');
      documents[documentData.document_id] = documentData;
      localStorage.setItem('sakhi_documents', JSON.stringify(documents));
      return true;
    } catch (error) {
      console.error('Failed to save document to localStorage:', error);
      return false;
    }
  }

  getDocumentsFromLocalStorage(userId = null) {
    try {
      const documents = JSON.parse(localStorage.getItem('sakhi_documents') || '{}');
      const docsArray = Object.values(documents);

      if (userId) {
        return docsArray.filter(doc => doc.userId === userId);
      }

      return docsArray;
    } catch (error) {
      console.error('Failed to get documents from localStorage:', error);
      return [];
    }
  }

  updateDocumentInLocalStorage(documentId, updates) {
    try {
      const documents = JSON.parse(localStorage.getItem('sakhi_documents') || '{}');
      if (documents[documentId]) {
        documents[documentId] = { ...documents[documentId], ...updates };
        localStorage.setItem('sakhi_documents', JSON.stringify(documents));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update document in localStorage:', error);
      return false;
    }
  }

  // RAG Engine Integration Methods

  async generateRAGResponse(prompt, context = {}) {
    try {
      // Get user ID from context or localStorage
      let userId = context.userId;
      if (!userId) {
        userId = localStorage.getItem('sessionId') || 'default';
      }

      const language = this.detectLanguage(prompt);

      const requestData = {
        query: prompt,
        userId,
        language,
        options: {
          includeMedicalAdvice: true,
          includeSources: true,
          style: 'supportive'
        }
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      if (this.ragApiKey) {
        headers['X-API-Key'] = this.ragApiKey;
      }

      console.log(`🔍 Calling RAG Engine for: "${prompt.substring(0, 50)}..."`);

      const response = await axios.post(`${this.ragBaseUrl}/api/chat`, requestData, {
        headers,
        timeout: 30000 // 30 second timeout
      });

      if (response.data && response.data.success) {
        const ragData = response.data;

        // Format the response to match the expected interface
        return {
          text: ragData.response,
          sources: ragData.sources || [],
          contextUsed: ragData.contextUsed || false,
          metadata: ragData.metadata || {},
          ragEnabled: true,
          language: ragData.metadata?.language || language
        };
      } else {
        throw new Error('RAG engine returned unsuccessful response');
      }

    } catch (error) {
      console.error('❌ RAG Engine error:', error.message);

      if (error.response) {
        console.error('RAG Engine response:', error.response.status, error.response.data);
      }

      // Return null to trigger fallback
      return null;
    }
  }

  async uploadMedicalDocument(file, userId) {
    if (!this.ragEnabled) {
      throw new Error('RAG engine is not enabled');
    }

    // Save document to localStorage
    const documentId = this.generateDocumentId();
    const documentData = {
      document_id: documentId,
      userId: userId,
      filename: `${Date.now()}_${file.name}`,
      original_name: file.name,
      file_size: file.size,
      file_type: file.type,
      document_type: this.detectDocumentType(file.name),
      processing_status: 'uploading',
      upload_timestamp: new Date().toISOString()
    };

    this.saveDocumentToLocalStorage(documentData);
    console.log('✅ Document metadata saved to localStorage');

    try {
      const formData = new FormData();
      formData.append('pdf', file);
      formData.append('userId', userId);

      const headers = {
        'Content-Type': 'multipart/form-data'
      };

      if (this.ragApiKey) {
        headers['X-API-Key'] = this.ragApiKey;
      }

      console.log(`📄 Uploading document: ${file.name}`);

      const response = await axios.post(`${this.ragBaseUrl}/api/documents/upload`, formData, {
        headers,
        timeout: 60000 // 60 second timeout for file upload
      });

      if (response.data && response.data.success) {
        // Update document status in localStorage
        this.updateDocumentInLocalStorage(documentId, {
          processing_status: 'completed',
          rag_document_id: response.data.document?.id,
          completed_timestamp: new Date().toISOString()
        });

        return response.data;
      } else {
        // Update document status to failed in localStorage
        this.updateDocumentInLocalStorage(documentId, {
          processing_status: 'failed',
          error_message: 'Upload failed',
          failed_timestamp: new Date().toISOString()
        });
        throw new Error('Document upload failed');
      }

    } catch (error) {
      console.error('❌ Document upload error:', error);
      throw new Error(`Failed to upload document: ${error.message}`);
    }
  }

  async getUserDocuments(userId, limit = 50) {
    if (!this.ragEnabled) {
      return [];
    }

    // Get documents from localStorage first
    const localDocuments = this.getDocumentsFromLocalStorage(userId);
    if (localDocuments.length > 0) {
      console.log(`✅ Retrieved ${localDocuments.length} documents from localStorage`);
      return localDocuments.slice(0, limit);
    }

    // Fallback to RAG engine API
    try {
      const headers = {};
      if (this.ragApiKey) {
        headers['X-API-Key'] = this.ragApiKey;
      }

      const response = await axios.get(`${this.ragBaseUrl}/api/documents?userId=${userId}&limit=${limit}`, {
        headers,
        timeout: 10000
      });

      if (response.data && response.data.success) {
        const ragDocuments = response.data.documents || [];

        // Save to localStorage for future use
        if (ragDocuments.length > 0) {
          for (const doc of ragDocuments) {
            this.saveDocumentToLocalStorage({
              document_id: doc.id,
              userId: userId,
              filename: doc.filename,
              original_name: doc.filename,
              file_size: doc.fileSize || 0,
              file_type: 'application/pdf',
              document_type: this.detectDocumentType(doc.filename),
              metadata: doc.metadata || {},
              processing_status: 'completed',
              upload_timestamp: new Date().toISOString()
            });
          }
          console.log(`✅ Saved ${ragDocuments.length} documents to localStorage`);
        }

        return ragDocuments;
      } else {
        return [];
      }

    } catch (error) {
      console.error('❌ Error fetching user documents:', error);
      return [];
    }
  }

  async synthesizeSpeech(text, emotion = 'caring', language = 'auto') {
    if (!this.ragEnabled) {
      throw new Error('RAG engine is not enabled');
    }

    try {
      const requestData = {
        text,
        emotion,
        options: {
          language
        }
      };

      const headers = {
        'Content-Type': 'application/json'
      };

      if (this.ragApiKey) {
        headers['X-API-Key'] = this.ragApiKey;
      }

      const response = await axios.post(`${this.ragBaseUrl}/api/voice/emotional`, requestData, {
        headers,
        timeout: 15000 // 15 second timeout
      });

      if (response.data && response.data.success) {
        return {
          audioUrl: `${this.ragBaseUrl}${response.data.audioUrl}`,
          duration: response.data.duration,
          language: response.data.language,
          emotion: response.data.emotion
        };
      } else {
        throw new Error('Speech synthesis failed');
      }

    } catch (error) {
      console.error('❌ Speech synthesis error:', error);
      throw new Error(`Failed to synthesize speech: ${error.message}`);
    }
  }

  detectLanguage(text) {
    // Simple language detection based on Devanagari script presence
    const devanagariPattern = /[\u0900-\u097F]/;
    const hasDevanagari = devanagariPattern.test(text);

    if (hasDevanagari) {
      return 'hi'; // Hindi
    } else {
      return 'en'; // English
    }
  }

  generateDocumentId() {
    return `DOC_${Date.now()}_${Math.random().toString(36).substring(2)}`;
  }

  detectDocumentType(filename) {
    const name = filename.toLowerCase();

    if (name.includes('blood') || name.includes('lab') || name.includes('test')) {
      return 'blood_test';
    } else if (name.includes('x-ray') || name.includes('xray') || name.includes('radiology')) {
      return 'xray';
    } else if (name.includes('mri') || name.includes('scan') || name.includes('imaging')) {
      return 'imaging';
    } else if (name.includes('prescription') || name.includes('medicine') || name.includes('drug')) {
      return 'prescription';
    } else if (name.includes('report') || name.includes('result')) {
      return 'medical_report';
    } else {
      return 'other';
    }
  }

  async checkRAGHealth() {
    if (!this.ragEnabled) {
      return { status: 'disabled', message: 'RAG engine is not enabled' };
    }

    try {
      const headers = {};
      if (this.ragApiKey) {
        headers['X-API-Key'] = this.ragApiKey;
      }

      const response = await axios.get(`${this.ragBaseUrl}/health`, {
        headers,
        timeout: 5000
      });

      return response.data;

    } catch (error) {
      return {
        status: 'unhealthy',
        message: error.message,
        url: this.ragBaseUrl
      };
    }
  }

  // Public API methods
  async checkHealth() {
    const ragHealth = await this.checkRAGHealth();

    return {
      status: this.isInitialized ? 'healthy' : 'degraded',
      model: this.config.model.name,
      provider: this.config.model.provider,
      version: this.config.model.version,
      sessionId: this.sessionId,
      requestsProcessed: this.requestCount,
      isMock: this.config.isMock,
      rag: {
        enabled: this.ragEnabled,
        baseUrl: this.ragBaseUrl,
        health: ragHealth
      }
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
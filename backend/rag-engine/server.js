const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs-extra');

// Import services
const { config, validateConfig, logConfig } = require('./config');
const PDFProcessor = require('./pdfProcessor');
const SimpleVectorStore = require('./simpleVectorStore');
const ContextRetriever = require('./retriever');
const GeminiService = require('./geminiService');
const ElevenLabsService = require('./elevenLabsService');

class RAGEngine {
  constructor() {
    this.app = express();
    this.port = config.PORT;
    this.services = {};
    this.isInitialized = false;

    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    // CORS configuration
    this.app.use(cors({
      origin: config.CORS_ORIGINS,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
    }));

    // Body parsing middleware
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // File upload middleware
    const storage = multer.memoryStorage();
    this.upload = multer({
      storage,
      limits: {
        fileSize: config.MAX_FILE_SIZE
      },
      fileFilter: (req, file, cb) => {
        if (config.ALLOWED_FILE_TYPES.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(new Error(`File type ${file.mimetype} not allowed`), false);
        }
      }
    });

    // Serve static files
    this.app.use('/audio', express.static(path.join(__dirname, 'public', 'audio')));

    // API key middleware
    this.app.use('/api', this.requireAPIKey.bind(this));
  }

  setupRoutes() {
    // Health and info endpoints
    this.app.get('/health', this.healthCheck.bind(this));
    this.app.get('/api/info', this.getServerInfo.bind(this));

    // Document management endpoints
    this.app.post('/api/documents/upload', this.upload.single('pdf'), this.uploadDocument.bind(this));
    this.app.get('/api/documents', this.getUserDocuments.bind(this));
    this.app.delete('/api/documents/:documentId', this.deleteDocument.bind(this));

    // RAG chat endpoints
    this.app.post('/api/chat', this.processChatQuery.bind(this));
    this.app.post('/api/chat/voice', this.processVoiceQuery.bind(this));

    // Voice synthesis endpoints
    this.app.post('/api/voice/synthesize', this.synthesizeSpeech.bind(this));
    this.app.post('/api/voice/emotional', this.synthesizeEmotionalSpeech.bind(this));

    // Vector store management endpoints
    this.app.get('/api/vector/stats', this.getVectorStats.bind(this));
    this.app.get('/api/vector/health', this.getVectorHealth.bind(this));

    // Service health endpoints
    this.app.get('/api/services/health', this.getAllServicesHealth.bind(this));
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        success: false,
        message: 'Endpoint not found',
        path: req.path
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Global error handler:', err);

      if (err.name === 'MulterError') {
        return res.status(400).json({
          success: false,
          message: 'File upload error',
          error: err.message
        });
      }

      res.status(err.status || 500).json({
        success: false,
        message: err.message || 'Internal server error',
        ...(config.NODE_ENV === 'development' && { stack: err.stack })
      });
    });
  }

  /**
   * API Key middleware
   */
  requireAPIKey(req, res, next) {
    if (!config.API_KEY_REQUIRED) {
      return next();
    }

    const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
    if (apiKey !== config.API_KEY) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or missing API key'
      });
    }

    next();
  }

  /**
   * Initialize all services
   */
  async initialize() {
    try {
      console.log('🚀 Initializing RAG Engine...');

      // Validate configuration
      validateConfig();
      logConfig();

      // Initialize services
      console.log('\n📚 Initializing services...');

      // PDF Processor
      this.services.pdfProcessor = new PDFProcessor(config);
      console.log('✅ PDF Processor initialized');

      // Vector Store
      this.services.vectorStore = new SimpleVectorStore(config);
      await this.services.vectorStore.initialize();

      // Context Retriever
      this.services.retriever = new ContextRetriever(this.services.vectorStore, config);
      console.log('✅ Context Retriever initialized');

      // Gemini AI Service
      this.services.gemini = new GeminiService(config);
      await this.services.gemini.initialize();

      // ElevenLabs Service
      this.services.elevenLabs = new ElevenLabsService(config);
      await this.services.elevenLabs.initialize();

      this.isInitialized = true;
      console.log('\n🎉 RAG Engine initialized successfully!');
      console.log(`🌐 Server running on http://localhost:${this.port}`);
      console.log(`📖 API Documentation: http://localhost:${this.port}/api/info`);

    } catch (error) {
      console.error('❌ Failed to initialize RAG Engine:', error);
      throw error;
    }
  }

  /**
   * Start the server
   */
  async start() {
    try {
      await this.initialize();

      this.app.listen(this.port, () => {
        console.log(`\n🌟 RAG Engine is ready!`);
        console.log(`📡 Port: ${this.port}`);
        console.log(`🔧 Environment: ${config.NODE_ENV}`);
      });

    } catch (error) {
      console.error('❌ Failed to start RAG Engine:', error);
      process.exit(1);
    }
  }

  // API Route Handlers

  async healthCheck(req, res) {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      services: {}
    };

    try {
      if (this.isInitialized) {
        health.services.vectorStore = await this.services.vectorStore.healthCheck();
        health.services.gemini = await this.services.gemini.healthCheck();
        health.services.elevenLabs = await this.services.elevenLabs.healthCheck();

        // Overall status
        const serviceStatuses = Object.values(health.services);
        const hasUnhealthy = serviceStatuses.some(service => service.status === 'unhealthy');

        if (hasUnhealthy) {
          health.status = 'degraded';
        }
      } else {
        health.status = 'unhealthy';
        health.message = 'RAG Engine not fully initialized';
      }
    } catch (error) {
      health.status = 'unhealthy';
      health.error = error.message;
    }

    res.json(health);
  }

  async getServerInfo(req, res) {
    const info = {
      name: 'Sakhi RAG Engine',
      version: '1.0.0',
      description: 'RAG-based medical companion engine for Sakhi mental health companion',
      endpoints: {
        health: 'GET /health',
        info: 'GET /api/info',
        documents: {
          upload: 'POST /api/documents/upload',
          list: 'GET /api/documents',
          delete: 'DELETE /api/documents/:documentId'
        },
        chat: {
          text: 'POST /api/chat',
          voice: 'POST /api/chat/voice'
        },
        voice: {
          synthesize: 'POST /api/voice/synthesize',
          emotional: 'POST /api/voice/emotional'
        },
        vectorStore: {
          stats: 'GET /api/vector/stats',
          health: 'GET /api/vector/health'
        },
        services: {
          health: 'GET /api/services/health'
        }
      },
      configuration: {
        maxFileSize: `${config.MAX_FILE_SIZE / 1024 / 1024}MB`,
        chunkSize: config.CHUNK_SIZE,
        supportedLanguages: config.SUPPORTED_LANGUAGES,
        defaultLanguage: config.DEFAULT_LANGUAGE
      },
      timestamp: new Date().toISOString()
    };

    res.json(info);
  }

  async uploadDocument(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const { userId = 'default' } = req.body;
      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      console.log(`📄 Processing document upload for user: ${userId}`);

      // Process PDF
      const document = await this.services.pdfProcessor.processPDF(req.file, userId);

      // Add to vector store
      const chunkIds = await this.services.vectorStore.addDocument(document);

      res.json({
        success: true,
        message: 'Document uploaded and processed successfully',
        document: {
          id: document.id,
          filename: document.filename,
          pageCount: document.pageCount,
          totalChunks: document.totalChunks,
          uploadDate: document.uploadDate,
          metadata: document.metadata
        },
        chunkIds,
        processingStats: {
          fileSize: document.fileSize,
          textLength: document.chunks.reduce((sum, chunk) => sum + chunk.length, 0),
          processingTime: Date.now() - new Date(document.uploadDate).getTime()
        }
      });

    } catch (error) {
      console.error('❌ Document upload error:', error);
      res.status(500).json({
        success: false,
        message: 'Document upload failed',
        error: error.message
      });
    }
  }

  async getUserDocuments(req, res) {
    try {
      const { userId = 'default', limit = 50 } = req.query;

      if (!userId) {
        return res.status(400).json({
          success: false,
          message: 'User ID is required'
        });
      }

      const documents = await this.services.vectorStore.getUserDocuments(userId, parseInt(limit));

      res.json({
        success: true,
        documents,
        count: documents.length,
        userId
      });

    } catch (error) {
      console.error('❌ Error fetching user documents:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch documents',
        error: error.message
      });
    }
  }

  async deleteDocument(req, res) {
    try {
      const { documentId } = req.params;
      const { userId = 'default' } = req.query;

      if (!documentId) {
        return res.status(400).json({
          success: false,
          message: 'Document ID is required'
        });
      }

      const success = await this.services.vectorStore.deleteDocument(documentId, userId);

      if (success) {
        res.json({
          success: true,
          message: 'Document deleted successfully'
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Document not found'
        });
      }

    } catch (error) {
      console.error('❌ Error deleting document:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete document',
        error: error.message
      });
    }
  }

  async processChatQuery(req, res) {
    try {
      const { query, userId = 'default', language = 'en', options = {} } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required'
        });
      }

      console.log(`💬 Processing chat query for user ${userId}: "${query.substring(0, 100)}..."`);

      // Retrieve context
      const contextData = await this.services.retriever.retrieveMedicalContext(query, userId, options);

      // Generate response
      const response = await this.services.gemini.generateRAGResponse(query, contextData, {
        language,
        includeMedicalAdvice: true,
        includeSources: true,
        ...options
      });

      res.json({
        success: true,
        response: response.text,
        sources: response.citations,
        contextUsed: response.sourcesUsed > 0,
        metadata: {
          query,
          language,
          model: response.model,
          timestamp: response.timestamp,
          contextLength: response.contextLength,
          sourcesUsed: response.sourcesUsed,
          medicalData: response.medicalData
        }
      });

    } catch (error) {
      console.error('❌ Chat query error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process chat query',
        error: error.message
      });
    }
  }

  async processVoiceQuery(req, res) {
    try {
      const { query, userId = 'default', language = 'auto', emotion = 'caring', options = {} } = req.body;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required'
        });
      }

      console.log(`🎤 Processing voice query for user ${userId}: "${query.substring(0, 100)}..."`);

      // Retrieve context
      const contextData = await this.services.retriever.retrieveMedicalContext(query, userId, options);

      // Generate text response
      const textResponse = await this.services.gemini.generateRAGResponse(query, contextData, {
        language,
        includeMedicalAdvice: true,
        includeSources: true,
        ...options
      });

      // Synthesize speech
      const voiceResponse = await this.services.elevenLabs.synthesizeEmotionalSpeech(
        textResponse.text,
        emotion,
        {
          language: textResponse.language
        }
      );

      res.json({
        success: true,
        textResponse: textResponse.text,
        audioResponse: {
          audioUrl: voiceResponse.audioUrl,
          duration: voiceResponse.duration,
          language: voiceResponse.language,
          emotion
        },
        sources: textResponse.citations,
        contextUsed: textResponse.sourcesUsed > 0,
        metadata: {
          query,
          detectedLanguage: textResponse.language,
          emotion,
          model: textResponse.model,
          timestamp: textResponse.timestamp,
          contextLength: textResponse.contextLength,
          sourcesUsed: textResponse.sourcesUsed
        }
      });

    } catch (error) {
      console.error('❌ Voice query error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process voice query',
        error: error.message
      });
    }
  }

  async synthesizeSpeech(req, res) {
    try {
      const { text, language = 'auto', options = {} } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required'
        });
      }

      const result = await this.services.elevenLabs.synthesizeSpeech(text, {
        language,
        ...options
      });

      res.json({
        success: true,
        audioUrl: result.audioUrl,
        duration: result.duration,
        language: result.language,
        text: result.text,
        timestamp: result.timestamp
      });

    } catch (error) {
      console.error('❌ Speech synthesis error:', error);
      res.status(500).json({
        success: false,
        message: 'Speech synthesis failed',
        error: error.message
      });
    }
  }

  async synthesizeEmotionalSpeech(req, res) {
    try {
      const { text, emotion = 'neutral', options = {} } = req.body;

      if (!text) {
        return res.status(400).json({
          success: false,
          message: 'Text is required'
        });
      }

      const result = await this.services.elevenLabs.synthesizeEmotionalSpeech(text, emotion, options);

      res.json({
        success: true,
        audioUrl: result.audioUrl,
        duration: result.duration,
        emotion,
        language: result.language,
        text: result.text,
        timestamp: result.timestamp
      });

    } catch (error) {
      console.error('❌ Emotional speech synthesis error:', error);
      res.status(500).json({
        success: false,
        message: 'Emotional speech synthesis failed',
        error: error.message
      });
    }
  }

  async getVectorStats(req, res) {
    try {
      const stats = await this.services.vectorStore.getStats();
      res.json({
        success: true,
        stats
      });

    } catch (error) {
      console.error('❌ Error getting vector stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get vector stats',
        error: error.message
      });
    }
  }

  async getVectorHealth(req, res) {
    try {
      const health = await this.services.vectorStore.healthCheck();
      res.json({
        success: true,
        health
      });

    } catch (error) {
      console.error('❌ Error checking vector health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check vector health',
        error: error.message
      });
    }
  }

  async getAllServicesHealth(req, res) {
    try {
      const health = {
        vectorStore: await this.services.vectorStore.healthCheck(),
        gemini: await this.services.gemini.healthCheck(),
        elevenLabs: await this.services.elevenLabs.healthCheck()
      };

      const overallStatus = Object.values(health).every(service => service.status === 'healthy') ? 'healthy' : 'degraded';

      res.json({
        success: true,
        overall: overallStatus,
        services: health,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('❌ Error checking services health:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check services health',
        error: error.message
      });
    }
  }
}

// Initialize and start the server
const ragEngine = new RAGEngine();
ragEngine.start().catch(console.error);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
  // Add cleanup logic here
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Received SIGINT, shutting down gracefully...');
  // Add cleanup logic here
  process.exit(0);
});

module.exports = RAGEngine;
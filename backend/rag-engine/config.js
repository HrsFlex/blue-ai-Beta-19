require('dotenv').config();

const config = {
  // Server Configuration
  PORT: process.env.RAG_ENGINE_PORT || 6000,
  NODE_ENV: process.env.NODE_ENV || 'development',

  // File Upload Configuration
  UPLOAD_DIR: process.env.UPLOAD_DIR || './uploads/patient-reports',
  MAX_FILE_SIZE: process.env.MAX_FILE_SIZE || 10 * 1024 * 1024, // 10MB
  ALLOWED_FILE_TYPES: ['application/pdf'],

  // Vector Database Configuration
  USE_CHROMA: process.env.USE_CHROMA === 'true' || false,
  CHROMA_HOST: process.env.CHROMA_HOST || 'localhost',
  CHROMA_PORT: process.env.CHROMA_PORT || 8000,
  VECTOR_COLLECTION_NAME: process.env.VECTOR_COLLECTION_NAME || 'patient_reports',

  // AI Services Configuration
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  GEMINI_MODEL: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  // ElevenLabs Configuration
  ELEVENLABS_API_KEY: process.env.ELEVENLABS_API_KEY || '',
  ELEVENLABS_VOICE_ID_HINDI: process.env.ELEVENLABS_VOICE_ID_HINDI || 'pNInz6obpgDQGcFmaJgB', // Hindi voice
  ELEVENLABS_VOICE_ID_ENGLISH: process.env.ELEVENLABS_VOICE_ID_ENGLISH || '21m00Tcm4TlvDq8ikWAM', // English voice

  // Text Processing Configuration
  CHUNK_SIZE: parseInt(process.env.CHUNK_SIZE) || 1000,
  CHUNK_OVERLAP: parseInt(process.env.CHUNK_OVERLAP) || 200,
  MAX_CONTEXT_LENGTH: parseInt(process.env.MAX_CONTEXT_LENGTH) || 4000,

  // RAG Configuration
  TOP_K_DOCUMENTS: parseInt(process.env.TOP_K_DOCUMENTS) || 5,
  SIMILARITY_THRESHOLD: parseFloat(process.env.SIMILARITY_THRESHOLD) || 0.7,

  // Language Configuration
  DEFAULT_LANGUAGE: process.env.DEFAULT_LANGUAGE || 'en',
  SUPPORTED_LANGUAGES: ['en', 'hi'],

  // Logging Configuration
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Security Configuration
  API_KEY_REQUIRED: process.env.API_KEY_REQUIRED === 'true',
  API_KEY: process.env.API_KEY || '',

  // CORS Configuration
  CORS_ORIGINS: process.env.CORS_ORIGINS ? process.env.CORS_ORIGINS.split(',') : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002'],
};

// Validation
function validateConfig() {
  const errors = [];
  const warnings = [];

  if (!config.GEMINI_API_KEY) {
    warnings.push('GEMINI_API_KEY not set - using mock responses for testing');
  }

  if (!config.ELEVENLABS_API_KEY) {
    warnings.push('ELEVENLABS_API_KEY not set - voice synthesis disabled');
  }

  if (warnings.length > 0) {
    console.warn('⚠️ Configuration warnings:');
    warnings.forEach(warning => console.warn(`- ${warning}`));
  }

  if (errors.length > 0) {
    console.error('Configuration validation errors:');
    errors.forEach(error => console.error(`- ${error}`));
    process.exit(1);
  }
}

// Log configuration (without sensitive data)
function logConfig() {
  console.log('=== RAG Engine Configuration ===');
  console.log(`Port: ${config.PORT}`);
  console.log(`Environment: ${config.NODE_ENV}`);
  console.log(`Upload Directory: ${config.UPLOAD_DIR}`);
  console.log(`Max File Size: ${config.MAX_FILE_SIZE / 1024 / 1024}MB`);
  console.log(`ChromaDB Host: ${config.CHROMA_HOST}:${config.CHROMA_PORT}`);
  console.log(`Vector Collection: ${config.VECTOR_COLLECTION_NAME}`);
  console.log(`Gemini Model: ${config.GEMINI_MODEL}`);
  console.log(`Chunk Size: ${config.CHUNK_SIZE}`);
  console.log(`Top K Documents: ${config.TOP_K_DOCUMENTS}`);
  console.log(`Default Language: ${config.DEFAULT_LANGUAGE}`);
  console.log('================================');
}

module.exports = {
  config,
  validateConfig,
  logConfig
};
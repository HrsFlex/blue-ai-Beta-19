// Updated ElevenLabs Service using the correct API format
const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

class ElevenLabsService {
  constructor(config) {
    this.config = config;
    this.apiKey = config.ELEVENLABS_API_KEY;
    this.baseURL = 'https://api.elevenlabs.io/v1';
    this.voices = {
      hi: 'pNInz6obpgDQGcFmaJgB', // Hindi voice - same as your example
      en: 'JBFqnCBsd6RMkjVDRZzb'  // English voice - similar to your example
    };
    this.outputDir = path.join(__dirname, 'public', 'audio');
    this.initialized = false;
    this.mockMode = !this.apiKey;
  }

  /**
   * Initialize ElevenLabs service
   */
  async initialize() {
    try {
      console.log('🎤 Initializing ElevenLabs voice service...');

      if (this.mockMode) {
        console.log('⚠️ Running in mock mode - no real voice synthesis');
        this.initialized = true;
        return;
      }

      // Create output directory
      await fs.ensureDir(this.outputDir);

      // Test API connection
      const response = await axios.get(`${this.baseURL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      console.log('✅ ElevenLabs voice service initialized');
      console.log(`   - Available voices: ${response.data.voices?.length || 0}`);
      this.initialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize ElevenLabs service:', error);
      // Don't throw error, just use mock mode
      console.warn('⚠️ Falling back to mock mode for voice synthesis');
      this.mockMode = true;
      this.initialized = true;
    }
  }

  /**
   * Synthesize speech from text
   */
  async synthesizeSpeech(text, options = {}) {
    if (!this.initialized) {
      throw new Error('ElevenLabs service not initialized');
    }

    const {
      language = 'en',
      voiceId = this.voices[language],
      modelId = 'eleven_multilingual_v2',
      outputFormat = 'mp3_44100_128'
    } = options;

    try {
      console.log(`🎤 Synthesizing speech in ${language}...`);

      if (this.mockMode) {
        return this.generateMockSpeech(text, language);
      }

      const requestData = {
        text: text,
        model_id: modelId,
        voice_settings: {
          stability: 0.75,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      };

      const response = await axios.post(
        `${this.baseURL}/text-to-speech/${voiceId}`,
        requestData,
        {
          headers: {
            'xi-api-key': this.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'audio/mpeg'
          },
          responseType: 'arraybuffer'
        }
      );

      // Save audio file
      const filename = `speech_${uuidv4()}.mp3`;
      const filepath = path.join(this.outputDir, filename);
      await fs.writeFile(filepath, response.data);

      // Return audio info
      return {
        success: true,
        audioUrl: `/audio/${filename}`,
        filename,
        filepath,
        language,
        voiceId,
        duration: 0, // Could be calculated if needed
        size: response.data.length,
        text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Failed to synthesize speech:', error);
      // Fallback to mock
      return this.generateMockSpeech(text, language);
    }
  }

  /**
   * Generate mock speech for testing
   */
  generateMockSpeech(text, language = 'en') {
    const filename = `mock_speech_${uuidv4()}.mp3`;
    const filepath = path.join(this.outputDir, filename);

    return {
      success: true,
      audioUrl: null, // No actual file in mock mode
      filename,
      filepath,
      language,
      voiceId: this.voices[language],
      duration: Math.max(1, Math.floor(text.length / 10)), // Estimate duration
      size: 1024, // Mock size
      text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
      timestamp: new Date().toISOString(),
      mockMode: true,
      message: `Mock speech synthesis for "${text.substring(0, 50)}..." in ${language}`
    };
  }

  /**
   * Detect language of text (simple implementation)
   */
  detectLanguage(text) {
    // Simple Hindi character detection
    const hindiRegex = /[\u0900-\u097F]/;
    if (hindiRegex.test(text)) {
      return 'hi';
    }
    return 'en';
  }

  /**
   * Synthesize mixed-language speech
   */
  async synthesizeMixedLanguage(text, options = {}) {
    // Split text by language and synthesize separately
    const segments = this.splitByLanguage(text);
    const results = [];

    for (const segment of segments) {
      if (segment.text.trim()) {
        const result = await this.synthesizeSpeech(segment.text, {
          ...options,
          language: segment.language
        });
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Split text by language (simple implementation)
   */
  splitByLanguage(text) {
    const segments = [];
    const hindiRegex = /[\u0900-\u097F]/;
    let currentSegment = { text: '', language: 'en' };

    for (const char of text) {
      const isHindi = hindiRegex.test(char);
      const lang = isHindi ? 'hi' : 'en';

      if (lang !== currentSegment.language) {
        if (currentSegment.text.trim()) {
          segments.push({ ...currentSegment });
        }
        currentSegment = { text: char, language: lang };
      } else {
        currentSegment.text += char;
      }
    }

    if (currentSegment.text.trim()) {
      segments.push(currentSegment);
    }

    return segments;
  }

  /**
   * Get available voices
   */
  async getAvailableVoices() {
    if (!this.initialized) {
      throw new Error('ElevenLabs service not initialized');
    }

    if (this.mockMode) {
      return {
        success: true,
        voices: [
          { voice_id: this.voices.en, name: 'English Voice', language: 'en' },
          { voice_id: this.voices.hi, name: 'Hindi Voice', language: 'hi' }
        ],
        mockMode: true
      };
    }

    try {
      const response = await axios.get(`${this.baseURL}/voices`, {
        headers: {
          'xi-api-key': this.apiKey
        }
      });

      return {
        success: true,
        voices: response.data.voices || []
      };

    } catch (error) {
      console.error('❌ Failed to get voices:', error);
      return {
        success: false,
        error: error.message
      };
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
      hasApiKey: !!this.apiKey,
      supportedLanguages: Object.keys(this.voices),
      voices: this.voices
    };
  }
}

module.exports = ElevenLabsService;
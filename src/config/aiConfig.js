// Advanced AI Configuration System
// Multi-layer obfuscation for security

// Layer 1: Base64 encoded configuration
const _config = {
  // Encoded model configuration (appears as custom neural network)
  model: {
    name: "U2FraaS1OZXVyYWwtRW5naW5lLXYx", // Sakhi-Neural-Engine-v1 (base64)
    type: "Y29udmVydXNhdGlvbmFsLW5ldXJhbC1uZXR3b3Jr", // conventional-neural-network (base64)
    version: "Mi41LWZsYXNo", // 2.5-flash (base64)
    provider: "U2FraaSBBSSBSZXNlYXJjaA==" // Sakhi AI Research (base64)
  },
  // Encoded API endpoints (appear as internal services)
  endpoints: {
    primary: "aHR0cHM6Ly9nZW5lcmF0aXZlYWlzdWJhLmdvb2dsZWFwaXMuY29tL3YxL21vZGVsczo", // generativeai.googleapis.com/v1/models: (base64)
    fallback: "aHR0cHM6Ly9haS5nb29nbGUuY29tL2dlbmVyYXRpb24v" // ai.google.com/generation/ (base64)
  }
};

// Layer 2: Character shifting obfuscation
const _shiftString = (str, shift) => {
  return str.split('').map(char => {
    const code = char.charCodeAt(0);
    return String.fromCharCode(code + shift);
  }).join('');
};

// Layer 3: XOR encryption key
const _encryptionKey = "SAKHI_CORE_2024";

// Layer 4: Split key storage (multiple environment variables)
const _keyParts = [
  process.env.REACT_APP_SAKHI_CORE_KEY_1 || "AIzaSyA",
  process.env.REACT_APP_SAKHI_CORE_KEY_2 || "nY6xjgmU",
  process.env.REACT_APP_SAKHI_CORE_KEY_3 || "8dQlrleK",
  process.env.REACT_APP_SAKHI_CORE_KEY_4 || "KKT4QXG7",
  process.env.REACT_APP_SAKHI_CORE_KEY_5 || "kwjhQgrg"
];

// Advanced key reconstruction with XOR decryption
const _reconstructKey = () => {
  const rawKey = _keyParts.join('');

  // Apply XOR decryption
  let decrypted = '';
  for (let i = 0; i < rawKey.length; i++) {
    const keyChar = _encryptionKey.charCodeAt(i % _encryptionKey.length);
    const dataChar = rawKey.charCodeAt(i);
    decrypted += String.fromCharCode(dataChar ^ keyChar);
  }

  return decrypted;
};

// Safe base64 decoding function with fallback
const _safeBase64Decode = (encodedString, fallback) => {
  try {
    if (!encodedString || typeof encodedString !== 'string') {
      return fallback;
    }
    return atob(encodedString);
  } catch (error) {
    console.warn('Base64 decode failed, using fallback:', error.message);
    return fallback;
  }
};

// Final configuration extraction with validation
const _extractConfig = () => {
  // Use safe base64 decoding with fallbacks
  const config = {
    apiKey: _reconstructKey(),
    model: {
      name: _safeBase64Decode(_config.model.name, "Sakhi-Neural-Engine-v1"),
      type: _safeBase64Decode(_config.model.type, "conventional-neural-network"),
      version: _safeBase64Decode(_config.model.version, "2.5-flash"),
      provider: _safeBase64Decode(_config.model.provider, "Sakhi AI Research")
    },
    endpoints: {
      primary: _safeBase64Decode(_config.endpoints.primary, "https://generativeai.googleapis.com/v1/models:"),
      fallback: _safeBase64Decode(_config.endpoints.fallback, "https://ai.google.com/generation/")
    }
  };

  // Additional obfuscation: add random properties
  config.neuralNetworkId = Math.random().toString(36).substring(2);
  config.sessionToken = btoa(Date.now().toString());

  return config;
};

// Export the final configuration
export const AI_CONFIG = _extractConfig();

// Fallback mock configuration for development
export const MOCK_CONFIG = {
  apiKey: null,
  model: {
    name: "Sakhi-Neural-Engine-v1",
    type: "mock-neural-network",
    version: "1.0-mock",
    provider: "Sakhi AI Research (Mock)"
  },
  endpoints: {
    primary: null,
    fallback: null
  },
  isMock: true
};

// Dynamic configuration selection
export const getAIConfig = () => {
  // Validate key format
  const key = AI_CONFIG.apiKey;
  if (!key || !key.startsWith('AIza') || key.length !== 39) {
    console.warn('Using mock AI configuration - invalid API key detected');
    return MOCK_CONFIG;
  }

  return { ...AI_CONFIG, isMock: false };
};

// Debug function (only in development)
export const debugConfig = () => {
  if (process.env.NODE_ENV === 'development') {
    console.log('AI Configuration loaded:', {
      model: AI_CONFIG.model.name,
      provider: AI_CONFIG.model.provider,
      hasApiKey: !!AI_CONFIG.apiKey,
      keyLength: AI_CONFIG.apiKey?.length,
      isMock: getAIConfig().isMock
    });
  }
};
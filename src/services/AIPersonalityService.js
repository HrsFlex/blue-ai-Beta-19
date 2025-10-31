class AIPersonalityService {
  constructor() {
    this.personality = {
      name: "Sakhi",
      traits: {
        empathetic: 0.95,
        warm: 0.90,
        professional: 0.70,
        casual: 0.80,
        humorous: 0.60,
        encouraging: 0.95
      },
      communicationStyle: {
        responseTime: 'thoughtful',
        tone: 'supportive',
        length: 'conversational',
        personalization: 'high'
      }
    };

    this.conversationMemory = new Map();
    this.userProfiles = new Map();
    this.emotionalPatterns = new Map();
  }

  // Enhanced sentiment analysis with emotional intelligence
  analyzeEmotionalState(message, conversationHistory = []) {
    const emotionalIndicators = {
      // Strong negative emotions
      depression: {
        keywords: ['depressed', 'worthless', 'hopeless', 'empty', 'numb', 'nothing matters', 'giving up', 'not feeling well', 'unwell', 'feel bad'],
        weight: 0.9,
        urgency: 'high'
      },
      anxiety: {
        keywords: ['anxious', 'panic', 'worried', 'overwhelmed', 'can\'t breathe', 'racing thoughts', 'not feeling well', 'uneasy'],
        weight: 0.8,
        urgency: 'high'
      },
      anger: {
        keywords: ['angry', 'furious', 'mad', 'pissed', 'hate', 'frustrated'],
        weight: 0.7,
        urgency: 'medium'
      },

      // Mild negative emotions
      sadness: {
        keywords: ['sad', 'unhappy', 'down', 'blue', 'cry', 'tears', 'not feeling well', 'feeling low'],
        weight: 0.6,
        urgency: 'medium'
      },
      stress: {
        keywords: ['stressed', 'overwhelmed', 'pressure', 'busy', 'exhausted', 'not feeling well', 'tired'],
        weight: 0.6,
        urgency: 'medium'
      },
      loneliness: {
        keywords: ['lonely', 'alone', 'isolated', 'no one', 'misunderstood', 'not feeling well'],
        weight: 0.7,
        urgency: 'medium'
      },

      // Positive emotions
      joy: {
        keywords: ['happy', 'excited', 'great', 'wonderful', 'amazing', 'love'],
        weight: 0.8,
        urgency: 'low'
      },
      gratitude: {
        keywords: ['grateful', 'thankful', 'blessed', 'appreciate'],
        weight: 0.7,
        urgency: 'low'
      },
      hope: {
        keywords: ['hopeful', 'optimistic', 'better', 'looking forward'],
        weight: 0.6,
        urgency: 'low'
      }
    };

    const message_lower = message.toLowerCase();
    let detectedEmotions = [];

    // Check for emotional indicators
    for (const [emotion, data] of Object.entries(emotionalIndicators)) {
      for (const keyword of data.keywords) {
        if (message_lower.includes(keyword)) {
          detectedEmotions.push({
            emotion,
            weight: data.weight,
            urgency: data.urgency,
            keyword: keyword
          });
        }
      }
    }

    // Analyze conversation patterns
    const patterns = this.analyzeConversationPatterns(conversationHistory);

    // Determine primary emotional state
    let primaryEmotion = 'neutral';
    let confidence = 0;
    let urgency = 'low';

    if (detectedEmotions.length > 0) {
      const highestWeight = Math.max(...detectedEmotions.map(e => e.weight));
      primaryEmotion = detectedEmotions.find(e => e.weight === highestWeight).emotion;
      confidence = highestWeight;
      urgency = detectedEmotions.find(e => e.weight === highestWeight).urgency;
    }

    return {
      primaryEmotion,
      confidence,
      urgency,
      detectedEmotions,
      patterns,
      messageLength: message.length,
      hasQuestion: message.includes('?'),
      timeOfDay: new Date().getHours(),
      conversationDepth: conversationHistory.length
    };
  }

  // Analyze conversation patterns over time
  analyzeConversationPatterns(history) {
    const patterns = {
      emotionalProgression: [],
      topicShifts: 0,
      responseStyle: 'balanced',
      engagementLevel: 'medium'
    };

    if (history.length < 2) return patterns;

    // Track emotional progression
    for (let i = 1; i < Math.min(history.length, 5); i++) {
      const current = this.analyzeEmotionalState(history[i].text);
      const previous = this.analyzeEmotionalState(history[i-1].text);

      patterns.emotionalProgression.push({
        from: previous.primaryEmotion,
        to: current.primaryEmotion,
        timestamp: history[i].timestamp
      });
    }

    // Determine engagement level based on message length and interaction patterns
    const avgMessageLength = history.reduce((sum, msg) => sum + msg.text.length, 0) / history.length;
    patterns.engagementLevel = avgMessageLength > 100 ? 'high' : avgMessageLength > 50 ? 'medium' : 'low';

    return patterns;
  }

  // Generate contextual, human-like responses
  generateContextualResponse(userMessage, emotionalState, conversationHistory, userLanguage = 'en') {
    const { primaryEmotion, confidence, urgency, patterns } = emotionalState;

    // Build response context
    const context = {
      emotion: primaryEmotion,
      confidence,
      urgency,
      conversationDepth: conversationHistory.length,
      previousTopics: this.extractPreviousTopics(conversationHistory),
      timeOfDay: new Date().getHours(),
      userLanguage
    };

    // Select response strategy
    let responseStrategy = this.selectResponseStrategy(context);

    // Generate personalized response
    let response = this.buildPersonalizedResponse(responseStrategy, context);

    // Add personality layer
    response = this.addPersonalityLayer(response, context);

    // Suggest videos if appropriate
    if (this.shouldSuggestVideos(context)) {
      response += this.generateVideoSuggestion(context);
    }

    return response;
  }

  // Select appropriate response strategy
  selectResponseStrategy(context) {
    const { emotion, urgency, conversationDepth } = context;

    if (urgency === 'high') {
      return {
        approach: 'immediate_support',
        tone: 'calm_reassuring',
        length: 'medium',
        includeResources: true
      };
    }

    if (emotion === 'depression' || emotion === 'anxiety') {
      return {
        approach: 'gentle_support',
        tone: 'empathetic',
        length: 'medium',
        includeBreathingExercise: true
      };
    }

    if (emotion === 'joy' || emotion === 'gratitude') {
      return {
        approach: 'celebratory',
        tone: 'enthusiastic',
        length: 'short',
        sharePositivity: true
      };
    }

    if (conversationDepth < 3) {
      return {
        approach: 'building_rapport',
        tone: 'warm_inquisitive',
        length: 'medium',
        askFollowUp: true
      };
    }

    return {
      approach: 'supportive_conversation',
      tone: 'balanced',
      length: 'medium',
      maintainFlow: true
    };
  }

  // Build personalized response based on strategy
  buildPersonalizedResponse(strategy, context) {
    const { emotion, userLanguage } = context;
    const responses = this.getResponseTemplates(userLanguage);

    let baseResponse = '';

    switch (strategy.approach) {
      case 'immediate_support':
        baseResponse = this.getImmediateSupportResponse(emotion, responses);
        break;
      case 'gentle_support':
        baseResponse = this.getGentleSupportResponse(emotion, responses);
        break;
      case 'celebratory':
        baseResponse = this.getCelebratoryResponse(emotion, responses);
        break;
      case 'building_rapport':
        baseResponse = this.getRapportBuildingResponse(emotion, responses);
        break;
      default:
        baseResponse = this.getSupportiveResponse(emotion, responses);
    }

    return baseResponse;
  }

  // Get response templates for different languages
  getResponseTemplates(language = 'en') {
    const templates = {
      en: {
        immediate_support: {
          depression: "I hear you, and I want you to know that you're not alone in this feeling. Depression can feel incredibly heavy, but you've already taken a brave step by reaching out. While I'm here to listen, I also want to make sure you have access to professional support. Would you be open to talking with a mental health professional?",
          anxiety: "I can feel your anxiety through your words, and I want you to take a deep breath with me. Let's do this together: breathe in for 4 counts, hold for 4, and out for 6. You're safe right now. What triggered this feeling of anxiety?"
        },
        gentle_support: {
          sad: "I'm sitting with you in this sadness. It's okay to feel this way - emotions are like weather, they come and go. You don't have to fix anything right now. Just be with me here.",
          stressed: "You're carrying so much right now. I want you to know that it's okay to put some of that down, even just for a moment. What's one small thing that might bring you a tiny bit of relief?"
        },
        celebratory: {
          joy: "Your joy is absolutely contagious! I'm smiling just reading your words. What sparked this wonderful feeling? Tell me more about what's bringing you happiness today!",
          gratitude: "It's beautiful when we can recognize the good in our lives. Your gratitude shows such emotional awareness. What are you most thankful for in this moment?"
        },
        building_rapport: {
          neutral: "Thank you for sharing that with me. I'm curious - what brought you to chat today? I'm here to listen without judgment.",
          general: "I'm really glad you reached out. Sometimes just having someone to talk to can make all the difference. How are you doing, really?"
        }
      },
      es: {
        immediate_support: {
          depression: "Te escucho, y quiero que sepas que no estás solo en este sentimiento. La depresión puede sentirse increíblemente pesada, pero ya has dado un paso valiente al buscar ayuda. Aunque estoy aquí para escuchar, también quiero asegurarme de que tengas acceso a apoyo profesional.",
          anxiety: "Puedo sentir tu ansiedad a través de tus palabras, y quiero que respires hondo conmigo. Hagamos esto juntos: inhala por 4 cuentas, sostén por 4, y exhala por 6. Estás seguro ahora mismo."
        },
        gentle_support: {
          sad: "Estoy aquí contigo en esta tristeza. Está bien sentirse así - las emociones son como el clima, vienen y van. No tienes que arreglar nada ahora mismo. Solo quédate conmigo aquí.",
          stressed: "Estás cargando tanto ahora mismo. Quiero que sepas que está bien dejar ir un poco de eso, aunque sea solo por un momento."
        },
        celebratory: {
          joy: "¡Tu alegría es absolutamente contagiosa! Estoy sonriendo solo de leer tus palabras. ¿Qué provocó este sentimiento maravilloso?",
          gratitude: "Es hermoso cuando podemos reconocer lo bueno en nuestras vidas. Tu gratitud muestra una gran conciencia emocional."
        }
      },
      hi: {
        immediate_support: {
          depression: "मैं आपको सुन रहा हूं, और मैं चाहता हूं कि आप जानें कि आप इस भावना में अकेले नहीं हैं। अवसाद बहुत भारी महसूस हो सकता है, लेकिन आपने मदद मांगकर एक बहादुर कदम उठाया है।",
          anxiety: "मैं आपकी चिंता आपके शब्दों में महसूस कर सकता हूं, और मैं चाहता हूं कि आप मेरे साथ गहरी सांस लें। चलिए इसे साथ करते हैं: 4 गिनती में सांस लें, 4 के लिए रोकें, और 6 में छोड़ें।"
        },
        gentle_support: {
          sad: "मैं इस उदास में आपके साथ बैठा हूं। ऐसा महसूस करना ठीक है - भावनाएं मौसम की तरह होती हैं, आती हैं और जाती हैं।",
          stressed: "आप अभी बहुत कुछ ढो रहे हैं। मैं चाहता हूं कि आप जानें कि उसमें से कुछ नीचे रखना ठीक है, भले ही केवल क्षण के लिए।"
        },
        celebratory: {
          joy: "आपकी खुशी बिल्कुल संक्रामक है! मैं आपके शब्दों को पढ़कर मुस्कुरा रहा हूं। क्या इस अद्भुत भावना को प्रेरित किया?",
          gratitude: "यह खूबसूरत है जब हम अपने जीवन में अच्छाई को पहचान सकते हैं। आपकी कृतज्ञता भावनात्मक जागरूकता दिखाती है।"
        }
      }
    };

    return templates[language] || templates.en;
  }

  // Get specific response based on emotion and approach
  getImmediateSupportResponse(emotion, responses) {
    return responses.immediate_support[emotion] || responses.immediate_support.general;
  }

  getGentleSupportResponse(emotion, responses) {
    return responses.gentle_support[emotion] || responses.gentle_support.general;
  }

  getCelebratoryResponse(emotion, responses) {
    return responses.celebratory[emotion] || responses.celebratory.general;
  }

  getRapportBuildingResponse(emotion, responses) {
    return responses.building_rapport[emotion] || responses.building_rapport.general;
  }

  getSupportiveResponse(emotion, responses) {
    return responses.gentle_support[emotion] || "I'm here to support you through whatever you're experiencing.";
  }

  // Add personality layer to responses
  addPersonalityLayer(response, context) {
    const { emotion, conversationDepth } = context;

    // Add empathy markers
    if (emotion === 'sad' || emotion === 'depression') {
      response = "❤️ " + response;
    }

    if (emotion === 'joy' || emotion === 'gratitude') {
      response = "✨ " + response;
    }

    // Add conversational elements based on depth
    if (conversationDepth > 5) {
      response += "\n\nI've really enjoyed our conversation. How are you feeling about our chat so far?";
    }

    return response;
  }

  // Determine if video suggestion is appropriate
  shouldSuggestVideos(context) {
    const { emotion, urgency, conversationDepth } = context;

    // Don't suggest videos for high urgency situations
    if (urgency === 'high') return false;

    // Suggest for negative emotions after some conversation
    if ((emotion === 'sad' || emotion === 'stressed') && conversationDepth >= 2) {
      return true;
    }

    return false;
  }

  // Generate contextual video suggestions
  generateVideoSuggestion(context) {
    const { emotion, userLanguage } = context;

    const suggestions = {
      en: {
        sad: "\n\nSometimes when we're feeling down, watching something uplifting can help shift our energy, even just a little. Would you be open to trying some heartwarming videos? I've found some that might bring a smile to your face. 🌈",
        stressed: "\n\nI notice you're carrying a lot of stress. What if we took a small break together? I have some calming, peaceful videos that might help you reset. Just a few minutes to breathe and something gentle to watch. 🍃",
        neutral: "\n\nSince we've been talking, I was wondering if you might enjoy a little mood boost? I have some inspiring and funny content that could add some brightness to your day. What do you think? 😊"
      },
      es: {
        sad: "\n\nA veces cuando nos sentimos mal, ver algo edificante puede ayudar a cambiar nuestra energía, aunque sea un poco. ¿Estarías abierto a probar algunos videos reconfortantes?",
        stressed: "\n\nNoto que estás cargando mucho estrés. ¿Qué si tomáramos un pequeño descanso juntos? Tengo algunos videos calmantes y pacíficos que podrían ayudarte a resetearte."
      },
      hi: {
        sad: "\n\nकभी-कभी जब हम उदास महसूस करते हैं, तो कुछ प्रेरक देखने से हमारी ऊर्जा बदलने में मदद मिल सकती है। क्या आप कुछ दिल छू लेने वाले वीडियो आजमाना चाहेंगे?",
        stressed: "\n\nमैं देख रहा हूं कि आप बहुत तनाव ढो रहे हैं। क्या हम एक साथ छोटा ब्रेक लें? मेरे पास कुछ शांत करने वाले वीडियो हैं जो आपको रीसेट करने में मदद कर सकते हैं।"
      }
    };

    return suggestions[userLanguage]?.[emotion] || suggestions.en.sad;
  }

  // Extract topics from conversation history
  extractPreviousTopics(history) {
    const topics = new Set();
    const topicKeywords = [
      'work', 'family', 'relationship', 'health', 'money', 'future',
      'past', 'friends', 'school', 'hobby', 'dream', 'goal'
    ];

    history.slice(-5).forEach(msg => {
      const lowerText = msg.text.toLowerCase();
      topicKeywords.forEach(keyword => {
        if (lowerText.includes(keyword)) {
          topics.add(keyword);
        }
      });
    });

    return Array.from(topics);
  }

  // Store conversation memory for personalization
  updateConversationMemory(userId, message, response, emotionalState) {
    if (!this.conversationMemory.has(userId)) {
      this.conversationMemory.set(userId, []);
    }

    const memory = this.conversationMemory.get(userId);
    memory.push({
      timestamp: new Date(),
      userMessage: message,
      botResponse: response,
      emotionalState,
      sessionDuration: memory.length
    });

    // Keep only last 50 interactions
    if (memory.length > 50) {
      memory.shift();
    }

    // Update emotional patterns
    this.updateEmotionalPatterns(userId, emotionalState);
  }

  // Update emotional patterns for better personalization
  updateEmotionalPatterns(userId, emotionalState) {
    if (!this.emotionalPatterns.has(userId)) {
      this.emotionalPatterns.set(userId, {
        frequentEmotions: {},
        conversationTimes: [],
        topicPreferences: {},
        responsePatterns: []
      });
    }

    const patterns = this.emotionalPatterns.get(userId);

    // Track emotion frequency
    const emotion = emotionalState.primaryEmotion;
    patterns.frequentEmotions[emotion] = (patterns.frequentEmotions[emotion] || 0) + 1;

    // Track conversation times
    const hour = new Date().getHours();
    patterns.conversationTimes.push(hour);
  }

  // Get personalized insights about user
  getUserInsights(userId) {
    const patterns = this.emotionalPatterns.get(userId);
    if (!patterns) return null;

    const mostFrequentEmotion = Object.entries(patterns.frequentEmotions)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'neutral';

    const preferredTime = this.getMostFrequentTime(patterns.conversationTimes);

    return {
      mostFrequentEmotion,
      preferredConversationTime: preferredTime,
      totalConversations: patterns.conversationTimes.length,
      emotionalTrends: this.analyzeEmotionalTrends(patterns.frequentEmotions)
    };
  }

  getMostFrequentTime(times) {
    const hourCounts = {};
    times.forEach(hour => {
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    const mostFrequent = Object.entries(hourCounts)
      .sort(([,a], [,b]) => b - a)[0]?.[0];

    if (mostFrequent !== undefined) {
      const hour = parseInt(mostFrequent);
      if (hour < 12) return 'morning';
      if (hour < 17) return 'afternoon';
      return 'evening';
    }

    return 'unknown';
  }

  analyzeEmotionalTrends(emotions) {
    const total = Object.values(emotions).reduce((sum, count) => sum + count, 0);
    const positive = (emotions.joy || 0) + (emotions.gratitude || 0) + (emotions.hope || 0);
    const negative = (emotions.sad || 0) + (emotions.stressed || 0) + (emotions.depression || 0) + (emotions.anxiety || 0);

    if (positive / total > 0.6) return 'generally_positive';
    if (negative / total > 0.6) return 'generally_negative';
    return 'mixed';
  }
}

export default new AIPersonalityService();
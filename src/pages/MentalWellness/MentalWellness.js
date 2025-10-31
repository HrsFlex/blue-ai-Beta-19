import React, { useState, useEffect, useRef } from 'react';
import './MentalWellness.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import VideoRecommendation from '../../components/VideoRecommendation/VideoRecommendation';
import MoodTracker from '../../components/MoodTracker/MoodTracker';
import DoctorReferral from '../../components/DoctorReferral/DoctorReferral';
import VideoScraperService from '../../services/VideoScraperService';
import LanguageService from '../../services/LanguageService';
import AIPersonalityService from '../../services/AIPersonalityService';

const MentalWellness = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sentiment, setSentiment] = useState('neutral');
  const [showVideos, setShowVideos] = useState(false);
  const [currentVideos, setCurrentVideos] = useState([]);
  const [userScore, setUserScore] = useState(100);
  const [showDoctorReferral, setShowDoctorReferral] = useState(false);
  const [conversationPhase, setConversationPhase] = useState('greeting');
  const [currentLanguage, setCurrentLanguage] = useState('en');
  const [languageDetected, setLanguageDetected] = useState(false);
  const [isScrapingVideos, setIsScrapingVideos] = useState(false);
  const [userEmotionalState, setUserEmotionalState] = useState(null);
  const [typingIndicator, setTypingIndicator] = useState(false);
  const messagesEndRef = useRef(null);

  // Get API key from environment or use demo mode
  const getGeminiInstance = () => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    if (!apiKey || apiKey === 'your_gemini_api_key_here') {
      console.warn('Gemini API key not configured. Using demo mode.');
      return null;
    }
    return new GoogleGenerativeAI(apiKey);
  };

  const genAI = getGeminiInstance();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Initialize conversation with a personalized greeting
    const greeting = LanguageService.translate('greeting', currentLanguage);
    const initialMessage = {
      id: Date.now(),
      text: greeting,
      sender: 'bot',
      timestamp: new Date(),
      language: currentLanguage
    };
    setMessages([initialMessage]);
  }, [currentLanguage]);

  const analyzeSentiment = async (text) => {
    // Enhanced emotional analysis using AI Personality Service
    const emotionalState = AIPersonalityService.analyzeEmotionalState(text, messages);
    setUserEmotionalState(emotionalState);

    // Detect language if not already detected
    if (!languageDetected) {
      const detectedLang = LanguageService.detectLanguage(text);
      if (detectedLang !== 'en') {
        setCurrentLanguage(detectedLang);
        setLanguageDetected(true);

        // Add language detection message
        const langMessage = {
          id: Date.now(),
          text: LanguageService.formatTranslation(
            LanguageService.translate('languageDetected', detectedLang),
            { language: LanguageService.getLanguageInfo(detectedLang).name }
          ),
          sender: 'bot',
          timestamp: new Date(),
          language: detectedLang,
          isSystem: true
        };
        setMessages(prev => [...prev, langMessage]);
      }
    }

    if (!genAI) {
      // Enhanced demo mode with AI Personality Service
      return emotionalState.primaryEmotion;
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Analyze the emotional state of this text with nuance. Consider context, intensity, and emotional complexity. Respond with one of these: joy, gratitude, hope, neutral, sad, stressed, lonely, angry, anxious, or depressed. Text: "${text}"`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const emotionText = response.text().toLowerCase().trim();

      // Map Gemini emotions to our system
      const emotionMapping = {
        'joy': 'positive',
        'gratitude': 'positive',
        'hope': 'positive',
        'neutral': 'neutral',
        'sad': 'sad',
        'stressed': 'stressed',
        'lonely': 'sad',
        'angry': 'stressed',
        'anxious': 'stressed',
        'depressed': 'depression'
      };

      return emotionMapping[emotionText] || emotionalState.primaryEmotion;
    } catch (error) {
      console.error('Advanced sentiment analysis error:', error);
      return emotionalState.primaryEmotion;
    }
  };

  const generateBotResponse = async (userMessage, currentSentiment) => {
    // Enhanced response generation using AI Personality Service
    if (userEmotionalState) {
      const contextualResponse = AIPersonalityService.generateContextualResponse(
        userMessage,
        userEmotionalState,
        messages,
        currentLanguage
      );

      // Store conversation memory
      AIPersonalityService.updateConversationMemory(
        'user_' + Date.now(),
        userMessage,
        contextualResponse,
        userEmotionalState
      );

      return contextualResponse;
    }

    if (!genAI) {
      // Enhanced demo mode responses with multi-language support
      const lowerMessage = userMessage.toLowerCase();

      if (conversationPhase === 'greeting') {
        if (currentSentiment === 'depression' || currentSentiment === 'anxiety') {
          return LanguageService.translate('sad', currentLanguage);
        } else if (currentSentiment === 'sad' || currentSentiment === 'stressed') {
          return LanguageService.translate(currentSentiment === 'sad' ? 'sad' : 'stressed', currentLanguage);
        } else if (currentSentiment === 'positive') {
          return LanguageService.translate('happy', currentLanguage);
        } else {
          return LanguageService.translate('neutral', currentLanguage);
        }
      } else if (conversationPhase === 'post-video') {
        if (lowerMessage.includes('good') || lowerMessage.includes('better') || lowerMessage.includes('happy')) {
          return LanguageService.translate('postVideoPositive', currentLanguage);
        } else if (lowerMessage.includes('bad') || lowerMessage.includes('sad') || lowerMessage.includes('no')) {
          return LanguageService.translate('postVideoNegative', currentLanguage);
        } else {
          return LanguageService.translate('continueChat', currentLanguage);
        }
      }

      return LanguageService.translate('typing', currentLanguage);
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      let prompt = '';
      if (conversationPhase === 'greeting') {
        prompt = `You are Sakhi, an empathetic mental wellness companion. The user said: "${userMessage}".
        Their emotional state appears to be ${currentSentiment}.

        Respond naturally and supportively in ${currentLanguage === 'en' ? 'English' : currentLanguage}.
        Consider cultural context and emotional intelligence.
        If they seem to be feeling down, gently suggest that watching some uplifting content might help.
        Keep your response conversational (80-120 words) and show genuine care.
        Use appropriate emotional markers and cultural sensitivity.`;
      } else if (conversationPhase === 'post-video') {
        prompt = `The user just finished watching some uplifting videos.
        They said: "${userMessage}".
        Respond in ${currentLanguage === 'en' ? 'English' : currentLanguage}.
        Ask about their current emotional state and whether the content helped.
        Be encouraging and emotionally intelligent. Show that you care about their wellbeing.`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Advanced bot response error:', error);
      return LanguageService.translate('typing', currentLanguage);
    }
  };

  const getVideos = async (mood = 'sad') => {
    setIsScrapingVideos(true);
    try {
      // Dynamic video scraping based on mood and language
      const videos = await VideoScraperService.getVideosByMood(mood, currentLanguage);
      setIsScrapingVideos(false);
      return videos;
    } catch (error) {
      console.error('Video scraping error:', error);
      setIsScrapingVideos(false);
      return VideoScraperService.getFallbackYouTubeVideos().slice(0, 5);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
      language: currentLanguage
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setTypingIndicator(true);

    try {
      // Enhanced sentiment analysis with emotional intelligence
      const detectedSentiment = await analyzeSentiment(input);
      setSentiment(detectedSentiment);

      // Show typing indicator with natural delay
      setTimeout(async () => {
        setTypingIndicator(false);

        // Generate intelligent, contextual response
        const botResponseText = await generateBotResponse(input, detectedSentiment);

        const botMessage = {
          id: Date.now() + 1,
          text: botResponseText,
          sender: 'bot',
          timestamp: new Date(),
          language: currentLanguage,
          emotionalContext: userEmotionalState
        };

        setMessages(prev => [...prev, botMessage]);

        // Enhanced video suggestion logic based on emotional state
        if ((detectedSentiment === 'negative' || detectedSentiment === 'sad' || detectedSentiment === 'stressed') &&
            conversationPhase === 'greeting') {
          setTimeout(() => {
            const suggestionMessage = {
              id: Date.now() + 2,
              text: LanguageService.translate('videoSuggestion', currentLanguage),
              sender: 'bot',
              timestamp: new Date(),
              isVideoSuggestion: true,
              language: currentLanguage
            };
            setMessages(prev => [...prev, suggestionMessage]);
          }, 1500);
        }

        // Handle high urgency emotional states
        if (userEmotionalState?.urgency === 'high' && (detectedSentiment === 'depression' || detectedSentiment === 'anxiety')) {
          setTimeout(() => {
            const urgentMessage = {
              id: Date.now() + 3,
              text: "I'm concerned about how you're feeling. Your wellbeing is important. Please consider reaching out to a mental health professional. I can provide you with resources right now.",
              sender: 'bot',
              timestamp: new Date(),
              isUrgentSupport: true,
              language: currentLanguage
            };
            setMessages(prev => [...prev, urgentMessage]);
          }, 2000);
        }

      }, 1500); // Natural typing delay

    } catch (error) {
      console.error('Enhanced message handling error:', error);
      setTypingIndicator(false);
      const errorMessage = {
        id: Date.now() + 1,
        text: LanguageService.translate('typing', currentLanguage) + " I'm having trouble connecting, but I'm here for you.",
        sender: 'bot',
        timestamp: new Date(),
        language: currentLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSuggestionAccept = async () => {
    try {
      // Dynamic video fetching based on emotional state and language
      const videos = await getVideos(sentiment);
      setCurrentVideos(videos);
      setShowVideos(true);
      setConversationPhase('watching');

      const message = {
        id: Date.now(),
        text: isScrapingVideos
          ? LanguageService.translate('typing', currentLanguage) + " Finding perfect videos for you..."
          : "Great! Here are some uplifting videos for you. Take your time watching them, and let me know when you're done. 💫",
        sender: 'bot',
        timestamp: new Date(),
        language: currentLanguage
      };
      setMessages(prev => [...prev, message]);
    } catch (error) {
      console.error('Video loading error:', error);
      const errorMessage = {
        id: Date.now(),
        text: "I'm having trouble loading videos right now. Let's continue our conversation instead.",
        sender: 'bot',
        timestamp: new Date(),
        language: currentLanguage
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleVideoSuggestionDecline = () => {
    const message = {
      id: Date.now(),
      text: "No problem! We can just keep talking. I'm here to listen whenever you need me. 🤗",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleVideosComplete = (videosWatched) => {
    setShowVideos(false);
    setConversationPhase('post-video');

    // Update user score based on videos watched
    const scoreDeduction = (5 - videosWatched) * 5;
    setUserScore(prev => Math.max(0, prev - scoreDeduction));

    const message = {
      id: Date.now(),
      text: `Welcome back! I noticed you watched ${videosWatched} out of 5 videos. How are you feeling now? Did the content help lift your mood even a little? 🌈`,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
  };

  const handleFinalMoodCheck = (feeling) => {
    if (feeling === 'bad') {
      setShowDoctorReferral(true);
      const message = {
        id: Date.now(),
        text: "I understand you're still feeling down. It might be helpful to talk to a professional who can provide more specialized support. Would you like me to suggest some mental health resources? 💙",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    } else {
      const message = {
        id: Date.now(),
        text: "That's wonderful to hear! I'm glad I could help brighten your day. Remember, I'm always here when you need a friend to talk to. Take care! 🌟",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      setConversationPhase('complete');
    }
  };

  return (
    <div className="mental-wellness-container">
      <div className="chat-header">
        <div className="header-content">
          <div className="avatar-container">
            <div className="bot-avatar">🤖</div>
            <div className="status-indicator online"></div>
          </div>
          <div className="header-text">
            <h2>Mental Wellness Companion</h2>
            <p>Your supportive AI friend</p>
          </div>
          <div className="user-score">
            <span className="score-label">Wellness Score</span>
            <span className={`score-value ${userScore < 70 ? 'low' : userScore < 90 ? 'medium' : 'high'}`}>
              {userScore}
            </span>
          </div>
        </div>
      </div>

      <div className="chat-messages">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.sender}`}>
            <div className="message-content">
              <div className="message-text">{message.text}</div>
              <div className="message-time">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              {message.isVideoSuggestion && (
                <div className="video-suggestion-buttons">
                  <button
                    className="suggestion-btn accept"
                    onClick={handleVideoSuggestionAccept}
                  >
                    Yes, show me videos! 🎬
                  </button>
                  <button
                    className="suggestion-btn decline"
                    onClick={handleVideoSuggestionDecline}
                  >
                    I'd rather talk 💬
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {typingIndicator && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <div className="typing-text">{LanguageService.translate('typing', currentLanguage)}</div>
            </div>
          </div>
        )}

        {isLoading && (
          <div className="message bot">
            <div className="message-content">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {showVideos && (
        <VideoRecommendation
          videos={currentVideos}
          onComplete={handleVideosComplete}
          onClose={() => setShowVideos(false)}
        />
      )}

      {showDoctorReferral && (
        <DoctorReferral
          onClose={() => setShowDoctorReferral(false)}
        />
      )}

      {conversationPhase === 'post-video' && !showVideos && !showDoctorReferral && (
        <MoodTracker
          onMoodSelect={handleFinalMoodCheck}
        />
      )}

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
            disabled={isLoading || showVideos}
          />
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || showVideos || !input.trim()}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MentalWellness;
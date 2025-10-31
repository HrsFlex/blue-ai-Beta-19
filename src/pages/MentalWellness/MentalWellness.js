import React, { useState, useEffect, useRef } from 'react';
import './MentalWellness.css';
import { GoogleGenerativeAI } from '@google/generative-ai';
import VideoRecommendation from '../../components/VideoRecommendation/VideoRecommendation';
import MoodTracker from '../../components/MoodTracker/MoodTracker';
import DoctorReferral from '../../components/DoctorReferral/DoctorReferral';

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
    // Initialize conversation with a greeting
    const initialMessage = {
      id: Date.now(),
      text: "Hi! I'm your mental wellness companion. How are you feeling today? 🌟",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([initialMessage]);
  }, []);

  const analyzeSentiment = async (text) => {
    if (!genAI) {
      // Demo mode - simple keyword-based sentiment analysis
      const lowerText = text.toLowerCase();
      if (lowerText.includes('sad') || lowerText.includes('depressed') || lowerText.includes('bad') ||
          lowerText.includes('awful') || lowerText.includes('terrible') || lowerText.includes('angry')) {
        return 'negative';
      }
      if (lowerText.includes('happy') || lowerText.includes('good') || lowerText.includes('great') ||
          lowerText.includes('wonderful') || lowerText.includes('amazing') || lowerText.includes('love')) {
        return 'positive';
      }
      return 'neutral';
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Analyze the sentiment of this text and respond with only one word: positive, negative, or neutral. Text: "${text}"`;
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const sentimentText = response.text().toLowerCase().trim();

      if (sentimentText.includes('positive')) return 'positive';
      if (sentimentText.includes('negative')) return 'negative';
      return 'neutral';
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      return 'neutral';
    }
  };

  const generateBotResponse = async (userMessage, currentSentiment) => {
    if (!genAI) {
      // Demo mode responses
      const lowerMessage = userMessage.toLowerCase();

      if (conversationPhase === 'greeting') {
        if (currentSentiment === 'negative') {
          return "I'm really sorry to hear that you're feeling down. It sounds like you're going through a tough time. Sometimes watching some uplifting content can help brighten our mood even a little bit. Would you be open to trying some funny or heartwarming videos? I'm here for you either way.";
        } else if (currentSentiment === 'positive') {
          return "That's wonderful to hear! It's great that you're feeling good today. I'm here to chat whenever you need a friend. What's been making you feel positive today?";
        } else {
          return "Thank you for sharing that with me. I'm here to support you no matter how you're feeling. Sometimes when we're not sure how we feel, taking a small break can help. How can I best support you right now?";
        }
      } else if (conversationPhase === 'post-video') {
        if (lowerMessage.includes('good') || lowerMessage.includes('better') || lowerMessage.includes('happy')) {
          return "I'm so glad to hear that the videos helped lift your mood! That's wonderful. Remember, I'm always here if you need to talk or if you'd like more uplifting content in the future. Take care of yourself!";
        } else if (lowerMessage.includes('bad') || lowerMessage.includes('sad') || lowerMessage.includes('no')) {
          return "I understand that the videos didn't help as much as we'd hoped, and that's okay. Everyone's journey is different, and it's brave of you to share how you're really feeling. Sometimes professional support can make a big difference. Would you like me to suggest some mental health resources?";
        } else {
          return "Thank you for being honest about how you're feeling. Whatever you're experiencing is valid. I'm here to support you through this. Is there anything specific you'd like to talk about or any other way I can help?";
        }
      }

      return "I'm here to support you. Tell me more about how you're feeling.";
    }

    try {
      const model = genAI.getGenerativeModel({ model: "gemini-pro" });

      let prompt = '';
      if (conversationPhase === 'greeting') {
        prompt = `You are a mental wellness assistant. The user said: "${userMessage}".
        Their sentiment appears to be ${currentSentiment}.
        Respond naturally and supportively. If they seem to be feeling down,
        gently suggest that watching some uplifting content might help.
        Keep your response under 100 words and be caring.`;
      } else if (conversationPhase === 'post-video') {
        prompt = `The user just finished watching some uplifting videos.
        They said: "${userMessage}".
        Ask them how they're feeling now and if the content helped improve their mood.
        Be encouraging and supportive.`;
      }

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Bot response error:', error);
      return "I'm here to support you. Would you like to try watching some uplifting content?";
    }
  };

  const getFunnyVideos = () => {
    // Pre-curated list of uplifting/funny videos
    return [
      {
        id: 1,
        title: "Cute Cats Doing Funny Things",
        url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg"
      },
      {
        id: 2,
        title: "Baby Laughing Hysterically",
        url: "https://www.youtube.com/embed/TP4_l3QG_qQ",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/TP4_l3QG_qQ/hqdefault.jpg"
      },
      {
        id: 3,
        title: "Funny Animal Moments",
        url: "https://www.youtube.com/embed/7K0b6cqw1Xk",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/7K0b6cqw1Xk/hqdefault.jpg"
      },
      {
        id: 4,
        title: "Try Not to Laugh Challenge",
        url: "https://www.youtube.com/embed/5vg6cphQG8M",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/5vg6cphQG8M/hqdefault.jpg"
      },
      {
        id: 5,
        title: "Puppies Playing in Park",
        url: "https://www.youtube.com/embed/z1U_A2kKx9Y",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/z1U_A2kKx9Y/hqdefault.jpg"
      }
    ];
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = {
      id: Date.now(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Analyze sentiment
      const detectedSentiment = await analyzeSentiment(input);
      setSentiment(detectedSentiment);

      // Generate bot response
      const botResponseText = await generateBotResponse(input, detectedSentiment);

      const botMessage = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // If sentiment is negative and it's the greeting phase, suggest videos
      if (detectedSentiment === 'negative' && conversationPhase === 'greeting') {
        setTimeout(() => {
          const suggestionMessage = {
            id: Date.now() + 2,
            text: "I think watching some uplifting content might help brighten your mood! Would you like me to show you some funny and heartwarming videos? 😊",
            sender: 'bot',
            timestamp: new Date(),
            isVideoSuggestion: true
          };
          setMessages(prev => [...prev, suggestionMessage]);
        }, 1000);
      }

    } catch (error) {
      console.error('Message handling error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now, but I'm here for you. Would you like to try again?",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVideoSuggestionAccept = () => {
    const videos = getFunnyVideos();
    setCurrentVideos(videos);
    setShowVideos(true);
    setConversationPhase('watching');

    const message = {
      id: Date.now(),
      text: "Great! Here are some uplifting videos for you. Take your time watching them, and let me know when you're done. 💫",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);
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
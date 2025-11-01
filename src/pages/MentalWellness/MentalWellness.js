import React, { useState, useEffect, useRef } from 'react';
import './MentalWellness.css';
import './MentalWellnessModal.css';
import Navbar from '../../components/Navbar/Navbar';
import VideoRecommendation from '../../components/VideoRecommendation/VideoRecommendation';
import MoodTracker from '../../components/MoodTracker/MoodTracker';
import DoctorReferral from '../../components/DoctorReferral/DoctorReferral';
import Meditation from '../../components/Meditation/Meditation';

const MentalWellness = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showVideos, setShowVideos] = useState(false);
  const [currentVideos, setCurrentVideos] = useState([]);
  const [userScore, setUserScore] = useState(100);
  const [showDoctorReferral, setShowDoctorReferral] = useState(false);
  const [scoreAnimation, setScoreAnimation] = useState(false);
  const [conversationPhase, setConversationPhase] = useState('greeting');
  const [showMeditation, setShowMeditation] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [showDoctorModal, setShowDoctorModal] = useState(false);
  const [completedActivities, setCompletedActivities] = useState({
    videos: false,
    meditation: false
  });
  const [recommendedActivities, setRecommendedActivities] = useState([]);
  const [videoAttempts, setVideoAttempts] = useState(0);
  const [previousVideos, setPreviousVideos] = useState([]);
  const messagesEndRef = useRef(null);

  // Enhanced AI service with multiple fallback strategies
  const getAIService = () => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    console.log('API Key check:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');

    if (!apiKey || apiKey === 'AIzaSyAnY6xjgmU8dQlrleKKKT4QXG7kwjhQgrg' || apiKey === 'demo-key') {
      console.warn('Gemini API key not configured. Using enhanced demo mode.');
      return null;
    }

    // For now, intentionally use enhanced demo mode due to browser compatibility issues
    // The Google GenAI package has restrictions in browser environments
    console.log('Using enhanced demo mode with improved context awareness (more reliable than browser AI)');
    return null;

    // Future enhancement: Try server-side AI integration if needed
    /*
    try {
      if (typeof window !== 'undefined') {
        const instance = new GoogleGenAI({ apiKey });
        console.log('GoogleGenAI initialized successfully');
        return instance;
      }
    } catch (error) {
      console.error('GoogleGenAI initialization failed:', error.message);
      return null;
    }
    */
  };

  // Initialize the AI instance
  const [ai, setAi] = useState(null);

  useEffect(() => {
    const instance = getAIService();
    setAi(instance);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Function to update score with animation
  const updateScoreWithAnimation = (points) => {
    setUserScore(prev => prev + points);
    setScoreAnimation(true);
    setTimeout(() => {
      setScoreAnimation(false);
    }, 600);
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
    // Try Gemini AI first if available
    if (ai) {
      try {
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: `Analyze the sentiment of this text and respond with only one word: positive, negative, or neutral. Text: "${text}"`,
        });
        const sentimentText = response.text.toLowerCase().trim();

        if (sentimentText.includes('positive')) return 'positive';
        if (sentimentText.includes('negative')) return 'negative';
        return 'neutral';
      } catch (error) {
        console.error('Sentiment analysis error:', error);
        // Fall back to keyword analysis
      }
    }

    // Enhanced demo mode fallback - keyword-based sentiment analysis
    const lowerText = text.toLowerCase();

    // Negative indicators - enhanced with more sensitivity
    const negativeWords = [
      'sad', 'depressed', 'bad', 'awful', 'terrible', 'angry', 'frustrated',
      'upset', 'hurt', 'pain', 'lonely', 'empty', 'numb', 'hopeless',
      'worried', 'anxious', 'stressed', 'overwhelmed', 'miserable', 'unhappy',
      'down', 'blue', 'gloomy', 'devastated', 'heartbroken', 'crying', 'tears',
      'kill', 'suicide', 'die', 'death', 'end it', 'give up', 'can\'t live',
      'want to die', 'wanna kill', 'kill myself', 'end my life', 'suicidal',
      'hate myself', 'worthless', 'pointless', 'no reason', 'end it all',
      // Additional sensitive indicators
      'struggling', 'difficult', 'hard', 'tough', 'impossible', 'can\'t',
      'stuck', 'trapped', 'lost', 'confused', 'scared', 'afraid',
      'tired', 'exhausted', 'drained', 'burned out', 'giving up',
      'not working', 'helpless', 'powerless', 'weak', 'failure',
      'alone', 'isolated', 'abandoned', 'rejected', 'unloved',
      'burden', 'too much', 'can\'t handle', 'over it', 'done'
    ];

    // Positive indicators
    const positiveWords = [
      'happy', 'good', 'great', 'wonderful', 'amazing', 'love', 'excited',
      'joyful', 'pleased', 'grateful', 'thankful', 'blessed', 'optimistic',
      'cheerful', 'delighted', 'thrilled', 'ecstatic', 'peaceful', 'calm',
      'content', 'satisfied', 'proud', 'confident', 'energetic', 'bright'
    ];

    // Check for negative sentiment
    for (const word of negativeWords) {
      if (lowerText.includes(word)) {
        return 'negative';
      }
    }

    // Check for positive sentiment
    for (const word of positiveWords) {
      if (lowerText.includes(word)) {
        return 'positive';
      }
    }

    // Enhanced context-based analysis for common phrases
    if (lowerText.includes("i'm really sad") || lowerText.includes("i feel sad") ||
        lowerText.includes("so sad") || lowerText.includes("very sad") ||
        lowerText.includes("still sad") || lowerText.includes("feeling sad") ||
        lowerText.includes("i'm sad") || lowerText.includes("im sad") ||
        lowerText.includes("feeling down") || lowerText.includes("feeling low") ||
        lowerText.includes("not feeling better") || lowerText.includes("still feel") ||
        lowerText.includes("doesn't help") || lowerText.includes("not working")) {
      return 'negative';
    }

    if (lowerText.includes("i'm happy") || lowerText.includes("i feel good") ||
        lowerText.includes("feeling great") || lowerText.includes("so happy") ||
        lowerText.includes("feeling better") || lowerText.includes("much better") ||
        lowerText.includes("really good") || lowerText.includes("great")) {
      return 'positive';
    }

    // Check for persistent negative patterns
    if (lowerText.length <= 10 &&
        (lowerText.includes("sad") || lowerText.includes("bad") ||
         lowerText.includes("down") || lowerText.includes("hurt"))) {
      return 'negative'; // Short expressions of negative feelings are significant
    }

    // Check for help-seeking indicators
    if (lowerText.includes("help") || lowerText.includes("support") ||
        lowerText.includes("need") || lowerText.includes("talk")) {
      // Check context - if help-seeking with negative words, prioritize negative
      if (negativeWords.some(word => lowerText.includes(word))) {
        return 'negative';
      }
    }

    return 'neutral';
  };

  const generateBotResponse = async (userMessage, currentSentiment) => {
    // Try Gemini AI first if available
    if (ai) {
      try {
        let prompt = '';
        if (conversationPhase === 'greeting') {
          if (currentSentiment === 'negative') {
            prompt = `You are a compassionate mental wellness assistant. The user said: "${userMessage}". They seem to be feeling down. Respond with empathy and support. Keep your response under 100 words, be caring, and suggest that a gentle activity might help lift their mood. Use natural, conversational language with appropriate emojis.`;
          } else if (currentSentiment === 'positive') {
            prompt = `You are a friendly mental wellness assistant. The user said: "${userMessage}". They seem to be feeling good! Respond with genuine enthusiasm and positivity. Ask them about what's making them feel good and keep the conversation uplifting. Keep your response under 100 words and use appropriate emojis.`;
          } else {
            prompt = `You are a supportive mental wellness assistant. The user said: "${userMessage}". Respond in a warm, supportive way. Be present with whatever they're feeling and offer to listen. Keep your response under 100 words and be conversational with gentle emojis.`;
          }
        } else if (conversationPhase === 'post-video' || conversationPhase === 'post-meditation') {
          prompt = `The user just completed a wellness activity (watched videos or did meditation). They said: "${userMessage}". Ask them how they're feeling now and if the activity helped improve their mood. Be encouraging and supportive. Keep your response under 100 words with caring emojis.`;
        } else {
          prompt = `You are a helpful mental wellness assistant. The user said: "${userMessage}". Respond in a supportive, conversational way that's appropriate for mental wellness support. Keep your response under 100 words and use gentle, caring emojis.`;
        }

        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
        });
        return response.text;
      } catch (error) {
        console.error('Bot response error:', error);
        // Fall back to demo mode
      }
    }

    // Enhanced demo mode - ultra-intelligent contextual responses
    const lowerMessage = userMessage.toLowerCase();

    // Add time-based context and user history awareness
    const hour = new Date().getHours();
    const timeContext = hour < 12 ? "morning" : hour < 18 ? "afternoon" : "evening";

    if (conversationPhase === 'greeting') {
      if (currentSentiment === 'negative') {
        // More nuanced responses based on specific emotions
        if (lowerMessage.includes('sad') || lowerMessage.includes('depressed') || lowerMessage.includes('down')) {
          const responses = [
            "I'm really sorry you're feeling this way. It takes courage to share your feelings when you're feeling down. I'm here to listen and support you. I think something that might help right now is a gentle activity. Let me start something for you... 💙",
            `Thank you for trusting me with these feelings. Sadness is a natural part of life, and you don't have to go through it alone. Let me share something that might bring a little comfort to your ${timeContext}... 🌅`,
            "I hear your pain, and I want you to know that it's okay to feel sad. Your feelings are valid. Sometimes a gentle distraction can help - let me start something soothing for you... 🌊"
          ];
          return responses[Math.floor(Math.random() * responses.length)];
        } else if (lowerMessage.includes('anxious') || lowerMessage.includes('worried') || lowerMessage.includes('stressed')) {
          const responses = [
            "I can sense that anxiety is weighing on you right now. That's such a heavy feeling to carry. Let's try something together that might help calm your nervous system... 🌿",
            "Anxiety can be so overwhelming, but you're already taking a positive step by reaching out. I have something that might help ground you in this present moment... 🧘‍♀️",
            "Your worries are valid, and I'm here to help you through this wave of anxiety. Let me start a calming activity that might help ease those racing thoughts... ☁️"
          ];
          return responses[Math.floor(Math.random() * responses.length)];
        } else if (lowerMessage.includes('angry') || lowerMessage.includes('frustrated') || lowerMessage.includes('mad')) {
          const responses = [
            "I understand you're feeling angry or frustrated right now. Those are valid emotions, and it's okay to feel this way. Let me help you with something that might bring some calm to your mind... 🔥",
            "Anger is such a powerful emotion - it often shows up when something important to us feels threatened. I'm here to help you work through this fire... 💫",
            "I hear your frustration, and it makes complete sense. Let me share something that might help transform that intense energy into something more manageable... ⚡"
          ];
          return responses[Math.floor(Math.random() * responses.length)];
        } else if (lowerMessage.includes('lonely') || lowerMessage.includes('alone')) {
          const responses = [
            "I'm so glad you reached out instead of keeping those lonely feelings to yourself. You're not alone in this - I'm right here with you. Let me share something to remind you of connection... 🤝",
            "Loneliness can feel so heavy, but you've already taken a step by reaching out. I'm here to keep you company and share something uplifting... 🌟",
            "I hear that loneliness is visiting you today. Even though we're digital, I want you to feel genuinely heard and supported. Let me start something that might help you feel less alone... 💫"
          ];
          return responses[Math.floor(Math.random() * responses.length)];
        } else {
          // General negative emotion
          const responses = [
            "I can sense that you're going through a difficult time, and I want you to know that your feelings are completely valid. I'm here to support you through this. Let me help you with something that might bring a little comfort... 🤗",
            "Thank you for being honest about how you're feeling. It sounds like things are challenging right now, and I'm here to walk alongside you. Let me share something gentle... 🌱",
            "I hear that you're struggling, and I want you to know that you're not alone in this. Whatever you're feeling is important and real. Let me start something that might help... 💙"
          ];
          return responses[Math.floor(Math.random() * responses.length)];
        }
      } else if (currentSentiment === 'positive') {
        // More nuanced positive responses
        if (lowerMessage.includes('happy') || lowerMessage.includes('great') || lowerMessage.includes('good')) {
          const responses = [
            "That's wonderful to hear! It's so lovely that you're feeling good today. Positivity is beautiful, and I'd love to hear more about what's bringing you joy. Sometimes sharing our happy moments can make them even brighter! What's been the best part of your day so far? ✨",
            "Your happiness is contagious! I'm smiling hearing about your good feelings. What's contributing to this wonderful mood? I'd love to celebrate with you! 🎉",
            "How wonderful that you're experiencing joy today! These positive moments are precious. Tell me more about what's making you feel so good - I'm here to celebrate with you! 🌈"
          ];
          return responses[Math.floor(Math.random() * responses.length)];
        } else if (lowerMessage.includes('excited') || lowerMessage.includes('thrilled')) {
          const responses = [
            "I love your excitement! It's so energizing to hear you're feeling thrilled about something. What's got you so fired up? I'd love to share in your enthusiasm! ⚡",
            "Your excitement is palpable! How amazing that you're feeling so thrilled right now. Tell me what's sparking this incredible energy! 🎆",
            "How wonderful to feel that excited feeling! It's such a powerful emotion. What's making you feel so alive and thrilled right now? 🌟"
          ];
          return responses[Math.floor(Math.random() * responses.length)];
        } else {
          // General positive
          const responses = [
            "I'm glad you're doing well! It's always good to connect when we're in a positive space. I'm here to chat whenever you need a friend, whether to celebrate the good times or navigate through challenges. What's on your mind today? 🌟",
            "It's so nice to hear you're in a good place! Positive moments deserve to be savored. What's contributing to your good feelings today? 🌻",
            "How lovely that you're feeling positive! I'm here to amplify these good vibes with you. What's been bringing you joy lately? ✨"
          ];
          return responses[Math.floor(Math.random() * responses.length)];
        }
      } else {
        // Neutral or mixed feelings
        const responses = [
          "Thank you for sharing that with me. I'm here to support you no matter how you're feeling. Sometimes it's okay to not know exactly how we feel - we can just be present with whatever comes up. Is there anything specific you'd like to talk about, or would you prefer some quiet company for now? 🌸",
          "I appreciate you checking in with yourself and sharing where you're at. Sometimes feelings are complex and not easily categorized. I'm here to sit with whatever you're experiencing... 🌿",
          "Thank you for being honest about where you are emotionally. Not every day needs to be labeled as good or bad - sometimes just 'being' is enough. I'm here with you... ☁️"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    } else if (conversationPhase === 'post-video' || conversationPhase === 'post-meditation') {
      if (lowerMessage.includes('good') || lowerMessage.includes('better') || lowerMessage.includes('happy') || lowerMessage.includes('smile') || lowerMessage.includes('laugh') || lowerMessage.includes('calm') || lowerMessage.includes('relaxed')) {
        const responses = [
          "I'm so glad to hear that helped lift your mood even a little! That's truly wonderful. Sometimes small moments of joy or peace can make a real difference. Remember that I'm always here if you need to talk or would like more uplifting content in the future. Take good care of yourself! 🌈",
          "That warms my heart to hear! It sounds like that activity really made a positive difference for you. These moments of relief are so valuable - you deserve to feel good! What specifically helped the most? 😊",
          "How wonderful that you're feeling better! I'm so glad we could find something that resonated with you. This progress, no matter how small, is worth celebrating! You're taking such good care of yourself. 🌟"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else if (lowerMessage.includes('bad') || lowerMessage.includes('sad') || lowerMessage.includes('no') || lowerMessage.includes('didn\'t help') || lowerMessage.includes('worse')) {
        const responses = [
          "I understand that didn't help as much as we'd hoped, and that's completely okay. Everyone's journey is different, and what works varies from person to person. It's brave of you to share honestly how you're feeling. Sometimes professional support can provide tools and strategies tailored specifically for you. Would you like me to suggest some mental health resources? You deserve support. 💙",
          "Thank you for being honest about your experience. It's completely valid that this didn't resonate with you - healing isn't one-size-fits-all. I'm proud of you for trying. Would you like to explore a different approach, or would you prefer to talk more about what you're experiencing right now? 🌱",
          "I hear that this wasn't the right fit for you, and that's okay. Your willingness to try different approaches shows real strength. Sometimes finding what works takes experimentation. Would you like to try something different, or would talking more be helpful right now? 🤗"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else if (lowerMessage.includes('okay') || lowerMessage.includes('fine') || lowerMessage.includes('alright') || lowerMessage.includes('so-so')) {
        const responses = [
          "I appreciate you sharing how you're feeling. Sometimes 'okay' is a good starting point, and that's valid. Whether that helped a little, a lot, or not at all, I'm here to continue supporting you. Would you like to talk more about what's on your mind, or is there anything else I can help with? 🌱",
          "Thank you for checking in with how you feel. 'Okay' is still a step forward - sometimes neutral is better than feeling down. I'm here to keep you company whatever you're experiencing. What would feel most helpful right now? 🌿",
          "I hear you saying you're feeling okay about the experience. Sometimes these activities are subtle in their effects. I'm curious - did anything particular stand out to you, or would you like to try something else? 💫"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      } else {
        // Mixed or unclear response
        const responses = [
          "Thank you for being honest about your experience. Whatever you're feeling right now is important and valid. I'm here to support you through this - whether you want to talk more, explore other content, or just have a conversation. What would be most helpful for you right now? 🤗",
          "I appreciate you sharing where you're at after that activity. It sounds like you might have mixed feelings, which is completely normal. I'm here to sit with whatever complexity you're experiencing. What feels most important to acknowledge right now? 🌊",
          "Thank you for your honest reflection. Sometimes our responses to activities aren't straightforward, and that's okay. I'm here to support you however you're feeling. Would you like to explore these feelings more, or try something different? ☁️"
        ];
        return responses[Math.floor(Math.random() * responses.length)];
      }
    }

    // Default supportive response for edge cases
    const responses = [
      "I'm here to support you through whatever you're experiencing. Your feelings matter, and you're not alone. Would you like to tell me more about how you're feeling, or would you prefer some uplifting content or a calming exercise? 💫",
      "Thank you for reaching out. Whatever brought you here today, I'm glad you're taking this step for yourself. I'm here to support you in whatever way feels most helpful right now. 🌟",
      "I'm honored that you chose to share this moment with me. Your wellbeing is important, and I'm here to walk alongside you. What would feel most supportive for you right now? 🌸"
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  };

  const getFunnyVideos = () => {
    // User-provided YouTube Shorts for uplifting content
    const allVideos = [
      {
        id: 1,
        title: "Uplifting Short 1",
        url: "https://www.youtube.com/embed/WtOPHSARDbY",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/WtOPHSARDbY/hqdefault.jpg"
      },
      {
        id: 2,
        title: "Uplifting Short 2",
        url: "https://www.youtube.com/embed/eScRAv7WzF0",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/eScRAv7WzF0/hqdefault.jpg"
      },
      {
        id: 3,
        title: "Uplifting Short 3",
        url: "https://www.youtube.com/embed/RX46Qb9BGy8",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/RX46Qb9BGy8/hqdefault.jpg"
      },
      {
        id: 4,
        title: "Uplifting Short 4",
        url: "https://www.youtube.com/embed/QMOsVXkDuI0",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/QMOsVXkDuI0/hqdefault.jpg"
      },
      {
        id: 5,
        title: "Uplifting Short 5",
        url: "https://www.youtube.com/embed/lUOuBl-WNq4",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/lUOuBl-WNq4/hqdefault.jpg"
      },
      {
        id: 6,
        title: "Uplifting Short 6",
        url: "https://www.youtube.com/embed/i38gE0vbrRk",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/i38gE0vbrRk/hqdefault.jpg"
      },
      {
        id: 7,
        title: "Uplifting Short 7",
        url: "https://www.youtube.com/embed/zcBfuJUi5WQ",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/zcBfuJUi5WQ/hqdefault.jpg"
      },
      {
        id: 8,
        title: "Uplifting Short 8",
        url: "https://www.youtube.com/embed/5mOtw2ExD5E",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/5mOtw2ExD5E/hqdefault.jpg"
      },
      {
        id: 9,
        title: "Uplifting Short 9",
        url: "https://www.youtube.com/embed/6x_VZ0kG3SE",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/6x_VZ0kG3SE/hqdefault.jpg"
      },
      {
        id: 10,
        title: "Uplifting Short 10",
        url: "https://www.youtube.com/embed/aJZGRJMzrg4",
        platform: "youtube",
        thumbnail: "https://img.youtube.com/vi/aJZGRJMzrg4/hqdefault.jpg"
      }
    ];

    // Randomly select 5 videos
    const shuffled = [...allVideos].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 5);
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
      const lowerMessage = input.toLowerCase();

      // Generate bot response
      const botResponseText = await generateBotResponse(input, detectedSentiment);

      const botMessage = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // Enhanced negative sentiment detection - works continuously and proactively
      if (detectedSentiment === 'negative') {

        // Always detect negative sentiment regardless of conversation phase or active activities
        setTimeout(() => {
          let responseText = '';

          if (conversationPhase === 'post-video' || conversationPhase === 'post-meditation') {
            // Check if user is saying "still sad" - if so, re-launch videos immediately
            if (lowerMessage.includes('still sad') || lowerMessage.includes('still feeling sad') || lowerMessage.includes('sad again')) {
              // Re-launch videos with different content
              const newVideos = getFunnyVideos().filter(video =>
                !previousVideos.some(prevVideo => prevVideo.url === video.url)
              );

              if (newVideos.length > 0) {
                setCurrentVideos(newVideos);
                setPreviousVideos(prev => [...prev, ...newVideos]);
                setShowVideos(true);
                setConversationPhase('watching');
                setVideoAttempts(prev => prev + 1);

                const videoMessage = {
                  id: Date.now() + 2,
                  text: "I hear you're still feeling sad, and I want to help. Let me show you some different uplifting videos that might resonate better with you. Sometimes it takes a few tries to find what works. Take your time with these, and I'm here with you through this. 💙\n\nWatching these videos will earn you +10 wellness points! 🌟",
                  sender: 'bot',
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, videoMessage]);
              } else {
                // If we've shown all videos, show activity modal
                responseText = "I notice you're still feeling down even after trying different videos. That's completely okay - sometimes we need multiple approaches to find what works for you.\n\nI'm going to show you some different wellness activities that might help. Please choose one that feels right for you. 💙";

                const supportMessage = {
                  id: Date.now() + 2,
                  text: responseText,
                  sender: 'bot',
                  timestamp: new Date(),
                  showActivityOptions: true
                };
                setMessages(prev => [...prev, supportMessage]);

                setRecommendedActivities(getActivityRecommendations());
                setShowActivityModal(true);
              }
            } else if (videoAttempts >= 1) {
              // After second video attempt, show activity modal
              responseText = "I notice you're still feeling down even after trying videos. That's completely okay - sometimes we need multiple approaches to find what works for you.\n\nI'm going to show you some different wellness activities that might help. Please choose one that feels right for you. 💙";

              const supportMessage = {
                id: Date.now() + 2,
                text: responseText,
                sender: 'bot',
                timestamp: new Date(),
                showActivityOptions: true
              };
              setMessages(prev => [...prev, supportMessage]);

              setRecommendedActivities(getActivityRecommendations());
              setShowActivityModal(true);
            } else {
              // First negative response after activity - re-launch videos
              const newVideos = getFunnyVideos().filter(video =>
                !previousVideos.some(prevVideo => prevVideo.url === video.url)
              );

              if (newVideos.length > 0) {
                setCurrentVideos(newVideos);
                setPreviousVideos(prev => [...prev, ...newVideos]);
                setShowVideos(true);
                setConversationPhase('watching');
                setVideoAttempts(prev => prev + 1);

                const videoMessage = {
                  id: Date.now() + 2,
                  text: "I hear that the previous content didn't fully help. Let me try some different videos that might resonate better with you. Sometimes it takes finding the right content to lift our spirits. I'm here with you through this. 💙\n\nWatching these videos will earn you +10 wellness points! 🌟",
                  sender: 'bot',
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, videoMessage]);
              } else {
                // Fallback to activity modal if no new videos
                responseText = "I notice you're still feeling down even after the activity. That's completely okay - sometimes we need multiple approaches to find what works for you.\n\nI'm going to show you some different wellness activities that might help. Please choose one that feels right for you. 💙";

                const supportMessage = {
                  id: Date.now() + 2,
                  text: responseText,
                  sender: 'bot',
                  timestamp: new Date(),
                  showActivityOptions: true
                };
                setMessages(prev => [...prev, supportMessage]);

                setRecommendedActivities(getActivityRecommendations());
                setShowActivityModal(true);
              }
            }

          } else if (conversationPhase === 'watching' && showVideos) {
            // While videos are showing but user is still expressing sadness
            responseText = "I hear that you're still feeling sad even while watching the videos. That's completely understandable. Please know that I'm here with you through this. Sometimes when we're really struggling, we need different types of support.\n\nI want you to know that your feelings are valid, and you don't have to pretend to feel better. When you're ready, I can suggest other activities that might be more helpful for you right now. \n\nTake your time with the videos, but remember there are other options available whenever you need them. 💙";

            const duringVideoSupportMessage = {
              id: Date.now() + 2,
              text: responseText,
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, duringVideoSupportMessage]);

          } else if (conversationPhase === 'greeting' || conversationPhase === 'needs-support') {
            // During initial greeting phase or when support is needed - launch activities (favor videos more)
            // Special handling for "still sad" keywords - force video selection
            const forceVideoSelection = lowerMessage.includes('still sad') || lowerMessage.includes('still feeling sad') || lowerMessage.includes('sad again');
            const randomChoice = forceVideoSelection || Math.random() < 0.95; // Increased to 95% with forced selection

            if (randomChoice) {
              // Launch videos
              const videos = getFunnyVideos();
              setCurrentVideos(videos);
              setPreviousVideos(videos); // Track initial videos
              setShowVideos(true);
              setConversationPhase('watching');
              setVideoAttempts(1); // Track first attempt

              const videoMessage = {
                id: Date.now() + 2,
                text: "I've selected some uplifting videos for you. Take your time watching them, and let me know when you're done. Watching all videos will earn you +10 wellness points! 🌟",
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, videoMessage]);
            } else {
              // Launch meditation
              setShowMeditation(true);
              setConversationPhase('meditating');

              const meditationMessage = {
                id: Date.now() + 2,
                text: "I've started a 3-minute breathing exercise for you. Find a comfortable position, close your eyes, and follow the guided instructions. Completing this will earn you +15 wellness points! 🧘‍♀️",
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, meditationMessage]);
            }
          } else {
            // Any other phase - provide continuous support and auto-launch
            responseText = "I hear that you're still going through a difficult time. Your feelings are completely valid, and I want you to know that I'm here for you continuously. \n\nSince you're still struggling, I'm going to take proactive steps to help you feel better. Different approaches work for different people, and we'll find what resonates with you.\n\nI'm going to start a new wellness activity for you right away... 💙";

            const continuousSupportMessage = {
              id: Date.now() + 2,
              text: responseText,
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, continuousSupportMessage]);

            setTimeout(() => {
              autoLaunchAlternativeActivity();
            }, 3000);
          }

          // Function to auto-launch alternative activity
          function autoLaunchAlternativeActivity() {
            // Launch something different from what was just tried
            if (conversationPhase === 'post-video') {
              // Try meditation after videos
              setShowMeditation(true);
              setConversationPhase('meditating');

              const meditationMessage = {
                id: Date.now() + 3,
                text: "Since the videos didn't fully help, let's try a calming meditation instead. This 3-minute breathing exercise can help ground you in the present moment. Take a comfortable position and follow the guidance. 🧘‍♀️",
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, meditationMessage]);

            } else if (conversationPhase === 'post-meditation') {
              // Try videos after meditation
              const videos = getFunnyVideos();
              setCurrentVideos(videos);
              setShowVideos(true);
              setConversationPhase('watching');

              const videoMessage = {
                id: Date.now() + 3,
                text: "Let's try some different uplifting content. Sometimes changing the type of activity can make all the difference. I've selected some fresh videos that might help lift your spirits. 🎬",
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, videoMessage]);

            } else {
              // Strong walk recommendation
              const walkMessage = {
                id: Date.now() + 3,
                text: "🚶‍♀️ **I strongly recommend taking a 15-minute walk right now**\n\nPhysical movement is one of the most effective ways to improve mood naturally. Even if you can't go outside:\n\n🏠 Walk around your home for 10-15 minutes\n🎵 Put on uplifting music while walking\n💪 Focus on how your body feels moving\n\nWould you like to try this, or would you prefer I suggest something else? Your wellbeing is my priority. 💙",
                sender: 'bot',
                timestamp: new Date()
              };
              setMessages(prev => [...prev, walkMessage]);
            }
          }
        }, 1500); // Faster response for ongoing sadness
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

  
  const handleMeditationComplete = () => {
    setShowMeditation(false);

    // Update score with animation and activities
    updateScoreWithAnimation(15);
    const newScore = userScore + 15;
    setCompletedActivities(prev => ({ ...prev, meditation: true }));

    // Small delay to ensure proper state transitions
    setTimeout(() => {
      setConversationPhase('post-meditation');
    }, 100);

    const message = {
      id: Date.now(),
      text: "Amazing job! You've completed the breathing exercise and earned +15 wellness points! 🎉 Your current wellness score is now " + newScore + ". How are you feeling now? Do you feel more calm and centered? 🌸",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, message]);

    // Check if both activities are completed for bonus points
    if (completedActivities.videos) {
      setTimeout(() => {
        const finalScore = newScore + 10;
        setUserScore(finalScore);
        const bonusMessage = {
          id: Date.now() + 1,
          text: "🏆 **ACHIEVEMENT UNLOCKED!** You've completed both videos and meditation! You've earned a bonus of +10 wellness points for taking such good care of yourself! Your total wellness score is now " + finalScore + ". You're doing amazing! ✨",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, bonusMessage]);
      }, 2000);
    }
  };

  const handleVideosComplete = (videosWatched) => {
    setShowVideos(false);
    setCompletedActivities(prev => ({ ...prev, videos: true }));
    setConversationPhase('post-video');

    // Calculate wellness points earned
    const basePoints = 10;
    const bonusPoints = videosWatched === 5 ? 5 : 0; // Bonus for watching all videos
    const totalPoints = basePoints + bonusPoints;

    // Update score with animation
    const newScore = userScore + totalPoints;
    updateScoreWithAnimation(totalPoints);

    let messageText = `Welcome back! You've watched ${videosWatched} out of 5 videos and earned +${totalPoints} wellness points! 🌟 `;

    if (videosWatched === 5) {
      messageText += 'Bonus +5 points for watching all videos! 🎉';
    } else {
      // Add strict recommendation for incomplete videos
      messageText += `\n\n⚠️ **Important Notice**: You didn't complete all the recommended videos. Since you're still working on your mental wellness, I strongly recommend:\n\n🚶‍♀️ **Take a 15-minute walk outside** - Fresh air and gentle movement can significantly boost your mood\n🎵 **Listen to uplifting music** - Create a playlist of songs that make you happy\n📝 **Journal your thoughts** - Write down what's on your mind for 5 minutes\n🧘‍♀️ **Try deep breathing** - Take 10 slow, deep breaths\n\nPhysical activity is especially important for mental wellness. A walk can help clear your mind and release endorphins. Would you like to commit to one of these activities?`;
    }

    messageText += `\n\nYour current wellness score is now ${newScore}. ✨`;

    const message = {
      id: Date.now(),
      text: messageText,
      sender: 'bot',
      timestamp: new Date(),
      showMoodReview: true // Flag to show mood tracker
    };
    setMessages(prev => [...prev, message]);

    // Check if both activities are completed for bonus points
    if (completedActivities.meditation) {
      setTimeout(() => {
        const finalScore = newScore + 10;
        setUserScore(finalScore);
        const bonusMessage = {
          id: Date.now() + 1,
          text: "🏆 **ACHIEVEMENT UNLOCKED!** You've completed both videos and meditation! You've earned a bonus of +10 wellness points for taking such good care of yourself! Your total wellness score is now " + finalScore + ". You're doing amazing! ✨",
          sender: 'bot',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, bonusMessage]);
      }, 2000);
    }
  };

  // Get activity recommendations
  const getActivityRecommendations = () => {
    return [
      {
        id: 'walk',
        name: '15-Minute Walk',
        description: 'Physical movement releases endorphins and improves mood naturally',
        duration: '15 minutes',
        icon: '🚶‍♀️',
        points: 20,
        priority: 'high',
        instructions: [
          'Put on comfortable shoes',
          'Step outside or walk around your home',
          'Focus on your breathing and surroundings',
          'Listen to uplifting music if desired'
        ]
      },
      {
        id: 'breathing',
        name: 'Box Breathing Exercise',
        description: 'Calms your nervous system and reduces anxiety',
        duration: '5 minutes',
        icon: '🫁',
        points: 10,
        priority: 'medium',
        instructions: [
          'Breathe in for 4 counts',
          'Hold for 4 counts',
          'Breathe out for 4 counts',
          'Hold for 4 counts',
          'Repeat for 5 cycles'
        ]
      },
      {
        id: 'music',
        name: 'Uplifting Music',
        description: 'Music can instantly shift your emotional state',
        duration: '10 minutes',
        icon: '🎵',
        points: 8,
        priority: 'medium',
        instructions: [
          'Put on your favorite uplifting songs',
          'Close your eyes and focus on the music',
          'Let yourself move or dance if it feels good'
        ]
      },
      {
        id: 'journal',
        name: 'Quick Journaling',
        description: 'Writing down thoughts can help process emotions',
        duration: '10 minutes',
        icon: '📝',
        points: 12,
        priority: 'low',
        instructions: [
          'Write down what you\'re feeling',
          'List 3 things you\'re grateful for',
          'Write one positive thing about yourself'
        ]
      },
      {
        id: 'talk',
        name: 'Reach Out to Someone',
        description: 'Connection with others is powerful for mood improvement',
        duration: '15 minutes',
        icon: '📞',
        points: 15,
        priority: 'high',
        instructions: [
          'Call or text a friend or family member',
          'Be honest about how you\'re feeling',
          'Ask how they\'re doing too'
        ]
      }
    ];
  };

  // Get doctor recommendations
  const getDoctorRecommendations = () => {
    return [
      {
        name: 'Dr. Sarah Johnson',
        specialty: 'Clinical Psychology',
        credentials: 'PhD, PsyD',
        experience: '15 years',
        rating: 4.8,
        availability: 'Available today',
        consultationFee: '$150',
        telehealth: true,
        image: '👩‍⚕️',
        contact: {
          phone: '555-0123',
          website: 'www.drsjohnson.com'
        }
      },
      {
        name: 'Dr. Michael Chen',
        specialty: 'Psychiatry',
        credentials: 'MD',
        experience: '12 years',
        rating: 4.9,
        availability: 'Tomorrow 2PM',
        consultationFee: '$200',
        telehealth: true,
        image: '👨‍⚕️',
        contact: {
          phone: '555-0456',
          website: 'www.drchenpsychiatry.com'
        }
      },
      {
        name: 'Dr. Emily Rodriguez',
        specialty: 'Licensed Counselor',
        credentials: 'LPC, NCC',
        experience: '8 years',
        rating: 4.7,
        availability: 'This week',
        consultationFee: '$120',
        telehealth: true,
        image: '👩‍⚕️',
        contact: {
          phone: '555-0789',
          website: 'www.emilyrodriguezcounseling.com'
        }
      }
    ];
  };

  // Handle activity selection
  const handleActivitySelect = (activity) => {
    setShowActivityModal(false);

    const activityMessage = {
      id: Date.now(),
      text: `Great choice! I'm starting "${activity.name}" for you. This should take about ${activity.duration}.\n\n**Instructions:**\n${activity.instructions.map((inst, i) => `${i+1}. ${inst}`).join('\n')}\n\nTake your time and let me know how you feel afterward. 💙`,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, activityMessage]);

    // Update score for activity initiation
    updateScoreWithAnimation(activity.points);
  };

  // Handle activity modal close
  const handleActivityModalClose = () => {
    setShowActivityModal(false);

    // After closing activity modal, offer doctor options
    setTimeout(() => {
      const doctorMessage = {
        id: Date.now(),
        text: "I understand if you're not ready for another activity right now. Sometimes talking to a professional can provide specialized support that activities alone may not offer.\n\nWould you like me to connect you with mental health professionals who can help? 💙",
        sender: 'bot',
        timestamp: new Date(),
        showDoctorOptions: true
      };
      setMessages(prev => [...prev, doctorMessage]);

      setShowDoctorModal(true);
    }, 1000);
  };

  const handleFinalMoodCheck = (feeling) => {
    if (feeling === 'bad') {
      // Enhanced response for continued negative feelings
      setConversationPhase('needs-support'); // More appropriate phase than 'greeting'
      const message = {
        id: Date.now(),
        text: "Thank you for being honest about how you're feeling. It's completely okay that the activity didn't fully help - mental wellness is a journey, not a quick fix. \n\n🚶‍♀️ **I strongly recommend taking a 15-minute walk right now** - Physical activity is one of the most effective ways to improve mood naturally. The combination of movement, fresh air, and change of scenery can make a real difference.\n\nOther immediate options:\n🎵 Put on your favorite uplifting music\n📞 Call or text a friend or family member\n🍵 Make yourself a warm cup of tea\n📖 Read something inspiring or comforting\n\nWould you like to try another activity with me, or would you prefer to take that walk first? I'm here to support you however you need. 💙",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
    } else {
      // Reset video attempts when mood improves
      setVideoAttempts(0);
      setPreviousVideos([]);

      const message = {
        id: Date.now(),
        text: "That's wonderful to hear! I'm so glad the activity helped improve your mood even a little. Every positive step counts, and you should be proud of yourself for taking care of your mental wellness. \n\nRemember that I'm always here when you need support, whether you're feeling great or going through a tough time. Keep up the great work on your mental health journey! 🌟\n\nWould you like to continue chatting, or are you feeling ready to wrap up for now? 😊",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, message]);
      setConversationPhase('complete');
    }
  };

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 overflow-y-auto bg-gray-50">
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
            <span className={`score-value ${userScore < 70 ? 'low' : userScore < 90 ? 'medium' : 'high'} ${scoreAnimation ? 'score-updated' : ''}`}>
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

      {showMeditation && (
        <Meditation
          onComplete={handleMeditationComplete}
          onClose={() => setShowMeditation(false)}
        />
      )}

      {showDoctorReferral && (
        <DoctorReferral
          onClose={() => setShowDoctorReferral(false)}
        />
      )}

      {(conversationPhase === 'post-video' || conversationPhase === 'post-meditation') && !showVideos && !showMeditation && !showDoctorReferral && (
        <MoodTracker
          onMoodSelect={handleFinalMoodCheck}
          mandatory={messages.some(msg => msg.showMoodReview)}
        />
      )}

      {/* Activity Modal */}
      {showActivityModal && (
        <div className="activity-modal-overlay">
          <div className="activity-modal">
            <div className="modal-header">
              <h3>Choose an Activity to Help You Feel Better 💙</h3>
              <button
                className="close-button"
                onClick={handleActivityModalClose}
              >
                ✕
              </button>
            </div>
            <div className="modal-subtitle">
              Sometimes different activities work better for different people. Select one that feels right for you.
            </div>
            <div className="activities-grid">
              {recommendedActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="activity-card"
                  onClick={() => handleActivitySelect(activity)}
                >
                  <div className="activity-icon">{activity.icon}</div>
                  <h4>{activity.name}</h4>
                  <p>{activity.description}</p>
                  <div className="activity-meta">
                    <span className="duration">⏱️ {activity.duration}</span>
                    <span className="points">+{activity.points} pts</span>
                    <span className={`priority ${activity.priority}`}>{activity.priority}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="modal-footer">
              <button
                className="skip-button"
                onClick={handleActivityModalClose}
              >
                Skip for now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Doctor Modal */}
      {showDoctorModal && (
        <div className="doctor-modal-overlay">
          <div className="doctor-modal">
            <div className="modal-header">
              <h3>Connect with Mental Health Professionals 🏥</h3>
              <button
                className="close-button"
                onClick={() => setShowDoctorModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-subtitle">
              Talking to a professional can provide specialized support and evidence-based treatments.
            </div>
            <div className="doctors-grid">
              {getDoctorRecommendations().map((doctor, index) => (
                <div key={index} className="doctor-card">
                  <div className="doctor-header">
                    <div className="doctor-avatar">{doctor.image}</div>
                    <div className="doctor-info">
                      <h4>{doctor.name}</h4>
                      <p className="specialty">{doctor.specialty}</p>
                      <p className="credentials">{doctor.credentials}</p>
                      <div className="doctor-meta">
                        <span className="rating">⭐ {doctor.rating}</span>
                        <span className="experience">{doctor.experience}</span>
                      </div>
                    </div>
                  </div>
                  <div className="doctor-details">
                    <p className="availability">
                      <strong>Available:</strong> {doctor.availability}
                    </p>
                    <p className="consultation">
                      <strong>Consultation:</strong> {doctor.consultationFee}
                    </p>
                    {doctor.telehealth && (
                      <p className="telehealth">📱 Telehealth available</p>
                    )}
                  </div>
                  <div className="doctor-actions">
                    <button className="contact-btn primary">
                      📞 Call {doctor.contact.phone}
                    </button>
                    <button className="contact-btn secondary">
                      🌐 Website
                    </button>
                    <button className="contact-btn tertiary">
                      📅 Book Appointment
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className="emergency-section">
              <h4>🚨 Need Immediate Help?</h4>
              <div className="emergency-contacts">
                <button className="emergency-btn">
                  📞 Call 988 Crisis Line
                </button>
                <button className="emergency-btn">
                  💬 Text HOME to 741741
                </button>
                <button className="emergency-btn">
                  🏥 Emergency Services (911)
                </button>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="close-modal-btn"
                onClick={() => setShowDoctorModal(false)}
              >
                I'll think about it
              </button>
            </div>
          </div>
        </div>
      )}

      <form className="message-input-form" onSubmit={handleSendMessage}>
        <div className="input-container">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="message-input"
            disabled={isLoading || showVideos || showActivityModal || showDoctorModal}
          />
          <button
            type="submit"
            className="send-button"
            disabled={isLoading || showVideos || showActivityModal || showDoctorModal || !input.trim()}
          >
            {isLoading ? '...' : 'Send'}
          </button>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};

export default MentalWellness;
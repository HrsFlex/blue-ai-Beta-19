import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MentalWellness.css';
// import { GoogleGenAI } from "@google/genai"; // Available for future use
import Navbar from '../../components/Navbar/Navbar';
import VideoRecommendation from '../../components/VideoRecommendation/VideoRecommendation';
import MoodTracker from '../../components/MoodTracker/MoodTracker';
import DoctorReferral from '../../components/DoctorReferral/DoctorReferral';
import Meditation from '../../components/Meditation/Meditation';

const MentalWellness = () => {
  const navigate = useNavigate();
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
  const [completedActivities, setCompletedActivities] = useState({
    videos: false,
    meditation: false
  });
  const [meditationStarted, setMeditationStarted] = useState(false);
  const [meditationTime, setMeditationTime] = useState(0);
  const messagesEndRef = useRef(null);

  // Enhanced AI service with multiple fallback strategies
  const getAIService = () => {
    const apiKey = process.env.REACT_APP_GEMINI_API_KEY;
    console.log('API Key check:', apiKey ? `${apiKey.substring(0, 10)}...` : 'Not found');

    if (!apiKey || apiKey === 'your_gemini_api_key_here' || apiKey === 'demo-key') {
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

    // Negative indicators
    const negativeWords = [
      'sad', 'depressed', 'bad', 'awful', 'terrible', 'angry', 'frustrated',
      'upset', 'hurt', 'pain', 'lonely', 'empty', 'numb', 'hopeless',
      'worried', 'anxious', 'stressed', 'overwhelmed', 'miserable', 'unhappy',
      'down', 'blue', 'gloomy', 'devastated', 'heartbroken', 'crying', 'tears',
      'kill', 'suicide', 'die', 'death', 'end it', 'give up', 'can\'t live',
      'want to die', 'wanna kill', 'kill myself', 'end my life', 'suicidal',
      'hate myself', 'worthless', 'pointless', 'no reason', 'end it all'
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

    // Context-based analysis for common phrases
    if (lowerText.includes("i'm really sad") || lowerText.includes("i feel sad") ||
        lowerText.includes("so sad") || lowerText.includes("very sad")) {
      return 'negative';
    }

    if (lowerText.includes("i'm happy") || lowerText.includes("i feel good") ||
        lowerText.includes("feeling great") || lowerText.includes("so happy")) {
      return 'positive';
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
            "Thank you for trusting me with these feelings. Sadness is a natural part of life, and you don't have to go through it alone. Let me share something that might bring a little comfort to your " + timeContext + "... 🌅",
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

      // Generate bot response
      const botResponseText = await generateBotResponse(input, detectedSentiment);

      const botMessage = {
        id: Date.now() + 1,
        text: botResponseText,
        sender: 'bot',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);

      // If sentiment is negative, automatically launch a random activity (but not during active phases)
      if (detectedSentiment === 'negative' &&
          (conversationPhase === 'greeting' || conversationPhase === 'post-video' || conversationPhase === 'post-meditation') &&
          !showVideos && !showMeditation) {

        setTimeout(() => {
          // Randomly choose between videos and meditation (75% chance for videos)
          const randomChoice = Math.random() < 0.75;

          if (randomChoice) {
            // Launch videos
            const videos = getFunnyVideos();
            setCurrentVideos(videos);
            setShowVideos(true);
            setConversationPhase('watching');

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
            setMeditationStarted(true);

            const meditationMessage = {
              id: Date.now() + 2,
              text: "I've started a 3-minute breathing exercise for you. Find a comfortable position, close your eyes, and follow the guided instructions. Completing this will earn you +15 wellness points! 🧘‍♀️",
              sender: 'bot',
              timestamp: new Date()
            };
            setMessages(prev => [...prev, meditationMessage]);
          }
        }, 2000);
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
    setMeditationStarted(false);

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

    const message = {
      id: Date.now(),
      text: `Welcome back! You've watched ${videosWatched} out of 5 videos and earned +${totalPoints} wellness points! 🌟 ${videosWatched === 5 ? 'Bonus +5 points for watching all videos! 🎉' : ''} Your current wellness score is now ${newScore}. How are you feeling now? Did the content help lift your mood even a little? 🌈`,
      sender: 'bot',
      timestamp: new Date()
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

  const handleFinalMoodCheck = (feeling) => {
    if (feeling === 'bad') {
      // Instead of immediately showing doctor referral, reset to allow more activities
      setConversationPhase('greeting');
      const message = {
        id: Date.now(),
        text: "I understand you're still feeling down, and I'm here to support you. Sometimes different activities work better for different people. Would you like to try another activity, or would you prefer some mental health resources? 💙",
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
      </div>
    </div>
  );
};

export default MentalWellness;
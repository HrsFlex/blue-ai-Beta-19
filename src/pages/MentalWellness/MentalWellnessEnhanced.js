import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './MentalWellness.css';
import Navbar from '../../components/Navbar/Navbar';
import VideoRecommendation from '../../components/VideoRecommendation/VideoRecommendation';
import MoodTracker from '../../components/MoodTracker/MoodTracker';
import DoctorReferral from '../../components/DoctorReferral/DoctorReferral';
import Meditation from '../../components/Meditation/Meditation';

// Import enhanced services
import AdvancedAIService from '../../services/AdvancedAIService';
import AppointmentService from '../../services/AppointmentService';
import NotificationService from '../../services/NotificationService';
import UserDataService from '../../services/UserDataService';
import ActivityService from '../../services/ActivityService';

const MentalWellnessEnhanced = () => {
  const navigate = useNavigate();

  // Core state
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Activity states
  const [showVideos, setShowVideos] = useState(false);
  const [showMeditation, setShowMeditation] = useState(false);
  const [showActivities, setShowActivities] = useState(false);
  const [showAppointmentBooking, setShowAppointmentBooking] = useState(false);
  const [showEmergencyResources, setShowEmergencyResources] = useState(false);

  // Enhanced states
  const [currentSentiment, setCurrentSentiment] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [wellnessScore, setWellnessScore] = useState(100);
  const [recommendedActivities, setRecommendedActivities] = useState([]);
  const [currentActivity, setCurrentActivity] = useState(null);
  const [sessionStats, setSessionStats] = useState({
    messagesCount: 0,
    activitiesCompleted: 0,
    moodChecks: 0,
    crisisAlerts: 0
  });

  const messagesEndRef = useRef(null);
  const currentUser = UserDataService.getCurrentUser();

  useEffect(() => {
    // Initialize user if not exists
    if (!currentUser) {
      const newUser = UserDataService.createUser();
      setUserProfile(newUser);
    } else {
      setUserProfile(currentUser);
      setWellnessScore(currentUser.wellnessData.wellnessScore);
    }

    // Initialize conversation
    const initialMessage = {
      id: Date.now(),
      text: "Hi! I'm Sakhi, your advanced mental wellness companion. I'm here to support you with personalized care, crisis intervention, and professional resources when needed. How are you feeling today? 💙",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages([initialMessage]);

    // Check for pending notifications
    checkPendingNotifications();
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const checkPendingNotifications = () => {
    if (currentUser) {
      const unreadCount = NotificationService.getUnreadCount(currentUser.id);
      if (unreadCount > 0) {
        // Show notification indicator
        console.log(`You have ${unreadCount} unread notifications`);
      }
    }
  };

  // Enhanced sentiment analysis with AI
  const analyzeSentimentAdvanced = async (text) => {
    try {
      if (currentUser) {
        const sentimentAnalysis = await AdvancedAIService.analyzeSentiment(text, currentUser.id);

        // Store sentiment analysis
        UserDataService.addMoodEntry(currentUser.id, {
          mood: sentimentAnalysis.sentimentScore,
          emotions: sentimentAnalysis.emotions,
          source: 'ai_detected'
        });

        // Update wellness score
        const newScore = UserDataService.updateWellnessScore(currentUser.id, sentimentAnalysis.sentimentScore);
        setWellnessScore(newScore);

        // Check for crisis
        if (sentimentAnalysis.crisisLevel >= 3) {
          handleCrisisDetection(sentimentAnalysis);
        }

        // Update session stats
        setSessionStats(prev => ({
          ...prev,
          messagesCount: prev.messagesCount + 1
        }));

        setCurrentSentiment(sentimentAnalysis);
        return sentimentAnalysis;
      }
    } catch (error) {
      console.error('Sentiment analysis error:', error);
    }
    return null;
  };

  // Handle crisis detection
  const handleCrisisDetection = (sentimentAnalysis) => {
    // Add crisis event to user data
    if (currentUser) {
      UserDataService.addCrisisEvent(currentUser.id, {
        severity: sentimentAnalysis.crisisLevel,
        type: sentimentAnalysis.riskIndicators[0] || 'general_distress',
        response: 'ai_intervention'
      });

      // Update session stats
      setSessionStats(prev => ({
        ...prev,
        crisisAlerts: prev.crisisAlerts + 1
      }));
    }

    // Show crisis response
    const crisisResponse = AdvancedAIService.generateCrisisResponse(sentimentAnalysis);

    const crisisMessage = {
      id: Date.now(),
      text: crisisResponse.message,
      sender: 'bot',
      timestamp: new Date(),
      isCrisis: true,
      resources: crisisResponse.resources
    };
    setMessages(prev => [...prev, crisisMessage]);

    // Send crisis notification
    if (currentUser) {
      NotificationService.createCrisisAlert(currentUser.id, crisisResponse.message);
    }

    // Show emergency resources if high crisis level
    if (sentimentAnalysis.crisisLevel >= 4) {
      setShowEmergencyResources(true);
    }
  };

  // Generate AI response based on sentiment
  const generateAIResponse = async (text, sentimentAnalysis) => {
    try {
      if (currentUser && sentimentAnalysis) {
        // Get personalized response from AI
        const response = await AdvancedAIService.generatePersonalizedResponse(
          text,
          sentimentAnalysis,
          currentUser.id
        );

        // Get activity recommendations
        const activities = await AdvancedAIService.generateActivityRecommendations(
          sentimentAnalysis,
          currentUser.profile.preferences,
          currentUser.wellnessData.activitiesCompleted
        );

        setRecommendedActivities(activities);

        return response;
      }
    } catch (error) {
      console.error('Response generation error:', error);
    }
    return null;
  };

  // Handle message sending
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
      const sentimentAnalysis = await analyzeSentimentAdvanced(input);

      // Generate AI response
      const aiResponse = await generateAIResponse(input, sentimentAnalysis);

      if (aiResponse) {
        const botMessage = {
          id: Date.now() + 1,
          text: aiResponse,
          sender: 'bot',
          timestamp: new Date(),
          sentimentData: sentimentAnalysis
        };
        setMessages(prev => [...prev, botMessage]);

        // Suggest activities if needed
        if (sentimentAnalysis && sentimentAnalysis.sentimentScore < -20) {
          setTimeout(() => {
            suggestActivities(sentimentAnalysis);
          }, 2000);
        }
      }

    } catch (error) {
      console.error('Message handling error:', error);
      const errorMessage = {
        id: Date.now() + 1,
        text: "I'm having trouble connecting right now, but I'm here for you. Would you like to try again or speak with a professional?",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Suggest activities to user
  const suggestActivities = (sentimentAnalysis) => {
    if (recommendedActivities.length > 0) {
      const activityMessage = {
        id: Date.now() + 2,
        text: "I've selected some activities that might help you feel better. Would you like to try one of these?",
        sender: 'bot',
        timestamp: new Date(),
        showActivityOptions: true,
        activities: recommendedActivities.slice(0, 3)
      };
      setMessages(prev => [...prev, activityMessage]);
      setShowActivities(true);
    }
  };

  // Handle activity selection
  const handleActivitySelect = (activity) => {
    setCurrentActivity(activity);
    setShowActivities(false);

    const activityStartMessage = {
      id: Date.now(),
      text: `Great choice! I'm starting "${activity.name}" for you. This should take about ${activity.duration} minutes. Take your time and I'll check in with you when you're done. 💙`,
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, activityStartMessage]);
  };

  // Handle activity completion
  const handleActivityComplete = (rating, notes = '') => {
    if (!currentActivity || !currentUser) return;

    // Record activity completion
    const activityProgress = ActivityService.trackProgress(
      currentActivity.id,
      rating,
      notes
    );

    UserDataService.addCompletedActivity(currentUser.id, {
      type: currentActivity.category,
      name: currentActivity.name,
      description: currentActivity.description,
      duration: currentActivity.duration,
      moodImpact: currentActivity.moodImpact,
      pointsEarned: currentActivity.points || 0,
      userRating: rating,
      notes: notes
    });

    // Send completion notification
    NotificationService.createActivityCompletion(
      currentUser.id,
      currentActivity.name,
      currentActivity.points || 0
    );

    // Update wellness score
    const newScore = UserDataService.updateWellnessScore(currentUser.id, rating * 10);
    setWellnessScore(newScore);

    // Update session stats
    setSessionStats(prev => ({
      ...prev,
      activitiesCompleted: prev.activitiesCompleted + 1
    }));

    const completionMessage = {
      id: Date.now(),
      text: `Excellent work! You've completed "${currentActivity.name}" and earned ${currentActivity.points || 0} wellness points! Your current wellness score is now ${newScore}. How are you feeling now? 🌟`,
      sender: 'bot',
      timestamp: new Date(),
      showMoodCheck: true
    };
    setMessages(prev => [...prev, completionMessage]);

    // Show mood tracker
    setShowActivities(false);
    setCurrentActivity(null);
  };

  // Handle professional help request
  const handleProfessionalHelp = () => {
    setShowAppointmentBooking(true);

    const helpMessage = {
      id: Date.now(),
      text: "I'm glad you're reaching out for professional support. That's a brave and important step. Let me help you connect with a mental health professional who can provide specialized care. 🏥",
      sender: 'bot',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, helpMessage]);
  };

  // Handle emergency resources
  const handleEmergencyResources = () => {
    setShowEmergencyResources(true);

    const emergencyMessage = {
      id: Date.now(),
      text: "Your safety is the top priority. Here are immediate resources that can help you right now. Please reach out - you don't have to face this alone. 🚨",
      sender: 'bot',
      timestamp: new Date(),
      isEmergency: true
    };
    setMessages(prev => [...prev, emergencyMessage]);
  };

  // Book emergency appointment
  const bookEmergencyAppointment = async () => {
    if (currentUser && currentSentiment) {
      try {
        const result = await AppointmentService.bookEmergencyAppointment(
          currentUser.id,
          currentSentiment.crisisLevel
        );

        if (result.success) {
          // Send notification
          NotificationService.createAppointmentConfirmation(currentUser.id, result.appointment);

          const bookingMessage = {
            id: Date.now(),
            text: `I've booked an emergency appointment for you with ${result.appointment.doctor.name} today at ${result.appointment.timeSlot}. You'll receive a confirmation with all the details. Help is on the way! 💙`,
            sender: 'bot',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, bookingMessage]);
        }
      } catch (error) {
        console.error('Emergency booking error:', error);
      }
    }
  };

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="mental-wellness-container">
          {/* Enhanced Header */}
          <div className="chat-header enhanced">
            <div className="header-content">
              <div className="avatar-container">
                <div className="bot-avatar">🤖</div>
                <div className="status-indicator online"></div>
              </div>
              <div className="header-text">
                <h2>Sakhi AI Wellness Companion</h2>
                <p>Advanced mental health support with crisis detection</p>
              </div>
              <div className="user-stats">
                <div className="stat-item">
                  <span className="stat-label">Wellness Score</span>
                  <span className={`stat-value ${wellnessScore < 70 ? 'low' : wellnessScore < 90 ? 'medium' : 'high'}`}>
                    {wellnessScore}
                  </span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Session</span>
                  <span className="stat-value">{sessionStats.messagesCount}</span>
                </div>
                <div className="stat-item">
                  <span className="stat-label">Activities</span>
                  <span className="stat-value">{sessionStats.activitiesCompleted}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="quick-actions">
              <button
                className="quick-action-btn"
                onClick={() => setShowActivities(true)}
              >
                🎯 Activities
              </button>
              <button
                className="quick-action-btn"
                onClick={handleProfessionalHelp}
              >
                👨‍⚕️ Get Help
              </button>
              <button
                className="quick-action-btn emergency"
                onClick={handleEmergencyResources}
              >
                🚨 Emergency
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="chat-messages enhanced">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`message ${message.sender} ${message.isCrisis ? 'crisis' : ''} ${message.isEmergency ? 'emergency' : ''}`}
              >
                <div className="message-content">
                  <div className="message-text">{message.text}</div>

                  {/* Show activity options if present */}
                  {message.showActivityOptions && message.activities && (
                    <div className="activity-options">
                      <p className="activity-prompt">Which activity would you like to try?</p>
                      <div className="activity-cards">
                        {message.activities.map((activity) => (
                          <div
                            key={activity.id}
                            className="activity-card"
                            onClick={() => handleActivitySelect(activity)}
                          >
                            <h4>{activity.name}</h4>
                            <p>{activity.description}</p>
                            <div className="activity-meta">
                              <span className="duration">⏱️ {activity.duration} min</span>
                              <span className="difficulty">{activity.difficulty}</span>
                              <span className="points">+{activity.points} pts</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show emergency resources if present */}
                  {message.resources && (
                    <div className="emergency-resources">
                      {message.resources.map((resource, index) => (
                        <div key={index} className="resource-item">
                          <h4>{resource.name}</h4>
                          <p>{resource.phone || resource.url}</p>
                          <span className="availability">Available: {resource.available}</span>
                        </div>
                      ))}
                    </div>
                  )}

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

          {/* Activity Modal */}
          {showActivities && !currentActivity && (
            <div className="activity-modal-overlay">
              <div className="activity-modal">
                <h3>Recommended Activities for You</h3>
                <div className="activity-grid">
                  {recommendedActivities.slice(0, 6).map((activity) => (
                    <div
                      key={activity.id}
                      className="activity-card selectable"
                      onClick={() => handleActivitySelect(activity)}
                    >
                      <h4>{activity.name}</h4>
                      <p>{activity.description}</p>
                      <div className="activity-meta">
                        <span>⏱️ {activity.duration} min</span>
                        <span>🎯 {activity.difficulty}</span>
                        <span>💎 +{activity.points} pts</span>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="close-btn"
                  onClick={() => setShowActivities(false)}
                >
                  Close
                </button>
              </div>
            </div>
          )}

          {/* Current Activity */}
          {currentActivity && (
            <div className="current-activity-overlay">
              <div className="current-activity">
                <h3>{currentActivity.name}</h3>
                <div className="activity-instructions">
                  <p>{currentActivity.description}</p>
                  {currentActivity.instructions && (
                    <ol>
                      {currentActivity.instructions.map((instruction, index) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  )}
                </div>
                <div className="activity-timer">
                  Duration: {currentActivity.duration} minutes
                </div>
                <div className="activity-actions">
                  <button
                    className="complete-btn"
                    onClick={() => {
                      const rating = window.prompt("How helpful was this activity? (1-5)");
                      if (rating) {
                        handleActivityComplete(parseInt(rating));
                      }
                    }}
                  >
                    Mark Complete ✅
                  </button>
                  <button
                    className="skip-btn"
                    onClick={() => setCurrentActivity(null)}
                  >
                    Skip Activity
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Emergency Resources Modal */}
          {showEmergencyResources && (
            <div className="emergency-modal-overlay">
              <div className="emergency-modal">
                <h3>🚨 Emergency Resources</h3>
                <div className="emergency-contacts">
                  <div className="emergency-contact">
                    <h4>988 Suicide & Crisis Lifeline</h4>
                    <p>Call or text 988</p>
                    <p>Available 24/7 - Free, confidential support</p>
                  </div>
                  <div className="emergency-contact">
                    <h4>Crisis Text Line</h4>
                    <p>Text HOME to 741741</p>
                    <p>Available 24/7 - Free crisis counseling via text</p>
                  </div>
                  <div className="emergency-contact">
                    <h4>Emergency Services</h4>
                    <p>Call 911</p>
                    <p>For immediate life-threatening emergencies</p>
                  </div>
                </div>
                <div className="emergency-actions">
                  <button
                    className="book-emergency-btn"
                    onClick={bookEmergencyAppointment}
                  >
                    Book Emergency Appointment
                  </button>
                  <button
                    className="close-emergency-btn"
                    onClick={() => setShowEmergencyResources(false)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Mood Tracker (shown after activities) */}
          {currentSentiment && currentSentiment.sentimentScore < 0 && !currentActivity && (
            <MoodTracker
              onMoodSelect={(mood) => {
                const moodMessage = {
                  id: Date.now(),
                  text: mood === 'good'
                    ? "I'm glad you're feeling better! Remember that I'm always here to support you on your wellness journey. 🌟"
                    : "I understand you're still having a difficult time. Would you like to try another activity or speak with a professional? 💙",
                  sender: 'bot',
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, moodMessage]);

                // Update session stats
                setSessionStats(prev => ({
                  ...prev,
                  moodChecks: prev.moodChecks + 1
                }));
              }}
            />
          )}

          {/* Input Form */}
          <form className="message-input-form enhanced" onSubmit={handleSendMessage}>
            <div className="input-container">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Share how you're feeling..."
                className="message-input"
                disabled={isLoading || currentActivity !== null}
              />
              <button
                type="submit"
                className="send-button"
                disabled={isLoading || currentActivity !== null || !input.trim()}
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

export default MentalWellnessEnhanced;
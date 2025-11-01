class UserDataService {
  constructor() {
    this.users = new Map();
    this.currentUser = null;
    this.sessionId = this.generateSessionId();
    this.initializeData();
  }

  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  initializeData() {
    // Load existing user data
    this.loadUserData();

    // Set up current user (for demo, create anonymous user if none exists)
    this.initializeCurrentUser();

    // Set up auto-save
    setInterval(() => this.saveUserData(), 30000); // Save every 30 seconds
  }

  initializeCurrentUser() {
    // Try to get user from localStorage
    const storedUserId = localStorage.getItem('sakhi_current_user_id');
    if (storedUserId && this.users.has(storedUserId)) {
      this.currentUser = this.users.get(storedUserId);
    } else {
      // Create new anonymous user
      this.createUser({
        isAnonymous: true,
        deviceId: this.getDeviceId()
      });
    }
  }

  getDeviceId() {
    let deviceId = localStorage.getItem('sakhi_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      localStorage.setItem('sakhi_device_id', deviceId);
    }
    return deviceId;
  }

  // Create new user
  createUser(userData = {}) {
    const user = {
      id: this.generateUserId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastActiveAt: new Date().toISOString(),
      sessionId: this.sessionId,
      isAnonymous: userData.isAnonymous || false,
      deviceId: userData.deviceId || this.getDeviceId(),
      profile: {
        name: userData.name || 'Anonymous User',
        email: userData.email || null,
        phone: userData.phone || null,
        dateOfBirth: userData.dateOfBirth || null,
        gender: userData.gender || null,
        location: userData.location || null,
        preferences: {
          language: userData.language || 'en',
          timezone: userData.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone,
          notifications: userData.notifications !== false,
          darkMode: userData.darkMode || false,
          telehealthOnly: userData.telehealthOnly || false
        }
      },
      mentalHealthProfile: {
        primaryConcerns: userData.primaryConcerns || [],
        currentMedications: userData.currentMedications || [],
        previousTherapy: userData.previousTherapy || false,
        crisisHistory: userData.crisisHistory || false,
        riskFactors: userData.riskFactors || [],
        copingStrategies: userData.copingStrategies || [],
        triggers: userData.triggers || [],
        supportSystem: userData.supportSystem || []
      },
      wellnessData: {
        currentMood: null,
        moodHistory: [],
        wellnessScore: 100,
        activitiesCompleted: [],
        streaks: {
          dailyCheckIn: 0,
          activities: 0,
          meditation: 0
        },
        goals: [],
        achievements: [],
        notes: []
      },
      sessionData: {
        totalSessions: 0,
        totalMessages: 0,
        avgSentimentScore: 0,
        crisisEvents: [],
        lastCrisisAssessment: null,
        preferredActivities: [],
        interventionHistory: []
      },
      appointments: [],
      notifications: [],
      privacy: {
        dataSharing: userData.dataSharing || false,
        researchParticipation: userData.researchParticipation || false,
        emergencyContact: userData.emergencyContact || null
      },
      metadata: {
        version: '1.0.0',
        source: 'web',
        userAgent: navigator.userAgent,
        lastUpdated: new Date().toISOString()
      }
    };

    this.users.set(user.id, user);
    this.currentUser = user;
    this.setCurrentUser(user.id);

    // Save to localStorage
    this.saveUserData();

    return user;
  }

  // Get current user
  getCurrentUser() {
    return this.currentUser;
  }

  // Set current user
  setCurrentUser(userId) {
    if (this.users.has(userId)) {
      this.currentUser = this.users.get(userId);
      localStorage.setItem('sakhi_current_user_id', userId);
      this.updateUserActivity(userId);
      return true;
    }
    return false;
  }

  // Update user profile
  updateUserProfile(userId, updates) {
    const user = this.users.get(userId);
    if (!user) return false;

    Object.assign(user.profile, updates);
    user.updatedAt = new Date().toISOString();
    this.updateUserActivity(userId);
    this.saveUserData();

    return true;
  }

  // Update mental health profile
  updateMentalHealthProfile(userId, updates) {
    const user = this.users.get(userId);
    if (!user) return false;

    Object.assign(user.mentalHealthProfile, updates);
    user.updatedAt = new Date().toISOString();
    this.updateUserActivity(userId);
    this.saveUserData();

    return true;
  }

  // Add mood entry
  addMoodEntry(userId, moodData) {
    const user = this.users.get(userId);
    if (!user) return false;

    const moodEntry = {
      id: this.generateId('mood'),
      timestamp: new Date().toISOString(),
      mood: moodData.mood, // -100 to 100
      emotions: moodData.emotions || [],
      triggers: moodData.triggers || [],
      activities: moodData.activities || [],
      notes: moodData.notes || '',
      context: moodData.context || {},
      source: moodData.source || 'manual' // 'manual', 'ai_detected', 'activity_followup'
    };

    user.wellnessData.moodHistory.push(moodEntry);
    user.wellnessData.currentMood = moodEntry.mood;

    // Keep only last 100 mood entries
    if (user.wellnessData.moodHistory.length > 100) {
      user.wellnessData.moodHistory = user.wellnessData.moodHistory.slice(-100);
    }

    // Update wellness score based on mood
    this.updateWellnessScore(userId, moodEntry.mood);

    this.updateUserActivity(userId);
    this.saveUserData();

    return moodEntry;
  }

  // Update wellness score
  updateWellnessScore(userId, moodChange) {
    const user = this.users.get(userId);
    if (!user) return false;

    // Base wellness score calculation
    let scoreChange = Math.round(moodChange / 10); // Scale mood change to wellness points

    // Apply boundaries
    const newScore = Math.max(0, Math.min(200, user.wellnessData.wellnessScore + scoreChange));
    user.wellnessData.wellnessScore = newScore;

    // Check for achievements
    this.checkAchievements(userId);

    return newScore;
  }

  // Add completed activity
  addCompletedActivity(userId, activity) {
    const user = this.users.get(userId);
    if (!user) return false;

    const activityEntry = {
      id: this.generateId('activity'),
      timestamp: new Date().toISOString(),
      type: activity.type,
      name: activity.name,
      description: activity.description,
      duration: activity.duration,
      moodImpact: activity.moodImpact || 0,
      pointsEarned: activity.pointsEarned || 0,
      userRating: activity.userRating || null,
      notes: activity.notes || '',
      category: activity.category || 'wellness'
    };

    user.wellnessData.activitiesCompleted.push(activityEntry);

    // Update wellness score
    if (activity.pointsEarned) {
      user.wellnessData.wellnessScore += activity.pointsEarned;
    }

    // Update streaks
    this.updateStreaks(userId, activity.type);

    // Update preferred activities
    this.updatePreferredActivities(userId, activity);

    // Keep only last 50 activities
    if (user.wellnessData.activitiesCompleted.length > 50) {
      user.wellnessData.activitiesCompleted = user.wellnessData.activitiesCompleted.slice(-50);
    }

    this.checkAchievements(userId);
    this.updateUserActivity(userId);
    this.saveUserData();

    return activityEntry;
  }

  // Update streaks
  updateStreaks(userId, activityType) {
    const user = this.users.get(userId);
    if (!user) return false;

    const today = new Date().toDateString();
    const lastActivity = user.wellnessData.activitiesCompleted[user.wellnessData.activitiesCompleted.length - 1];

    if (lastActivity && new Date(lastActivity.timestamp).toDateString() === today) {
      // Activity completed today - continue or start streak
      if (activityType === 'meditation') {
        user.wellnessData.streaks.meditation++;
      } else {
        user.wellnessData.streaks.activities++;
      }
    } else {
      // Check if yesterday had activity to maintain streak
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const yesterdayActivities = user.wellnessData.activitiesCompleted.filter(
        act => new Date(act.timestamp).toDateString() === yesterday.toDateString()
      );

      if (yesterdayActivities.length > 0) {
        // Maintain streak
        if (activityType === 'meditation') {
          user.wellnessData.streaks.meditation++;
        } else {
          user.wellnessData.streaks.activities++;
        }
      } else {
        // Reset streak
        if (activityType === 'meditation') {
          user.wellnessData.streaks.meditation = 1;
        } else {
          user.wellnessData.streaks.activities = 1;
        }
      }
    }

    return true;
  }

  // Update preferred activities
  updatePreferredActivities(userId, activity) {
    const user = this.users.get(userId);
    if (!user) return false;

    // Track activity preferences
    const existingPreference = user.sessionData.preferredActivities.find(
      pref => pref.type === activity.type
    );

    if (existingPreference) {
      existingPreference.count++;
      existingPreference.lastUsed = new Date().toISOString();
      if (activity.userRating) {
        existingPreference.avgRating = (existingPreference.avgRating + activity.userRating) / 2;
      }
    } else {
      user.sessionData.preferredActivities.push({
        type: activity.type,
        name: activity.name,
        count: 1,
        avgRating: activity.userRating || 0,
        lastUsed: new Date().toISOString()
      });
    }

    // Keep only top 10 preferred activities
    user.sessionData.preferredActivities.sort((a, b) => b.count - a.count);
    user.sessionData.preferredActivities = user.sessionData.preferredActivities.slice(0, 10);

    return true;
  }

  // Add crisis event
  addCrisisEvent(userId, crisisData) {
    const user = this.users.get(userId);
    if (!user) return false;

    const crisisEvent = {
      id: this.generateId('crisis'),
      timestamp: new Date().toISOString(),
      severity: crisisData.severity, // 1-5
      type: crisisData.type, // 'suicidal_ideation', 'self_harm', 'panic_attack', etc.
      triggers: crisisData.triggers || [],
      response: crisisData.response, // 'self_care', 'peer_support', 'professional_help', 'emergency'
      resolved: crisisData.resolved || false,
      resolvedAt: crisisData.resolvedAt || null,
      notes: crisisData.notes || '',
      followUpRequired: crisisData.followUpRequired || false,
      followUpCompleted: false
    };

    user.sessionData.crisisEvents.push(crisisEvent);
    user.sessionData.lastCrisisAssessment = new Date().toISOString();

    // Keep only last 20 crisis events
    if (user.sessionData.crisisEvents.length > 20) {
      user.sessionData.crisisEvents = user.sessionData.crisisEvents.slice(-20);
    }

    this.updateUserActivity(userId);
    this.saveUserData();

    return crisisEvent;
  }

  // Add session data
  addSessionData(userId, sessionData) {
    const user = this.users.get(userId);
    if (!user) return false;

    user.sessionData.totalSessions++;
    user.sessionData.totalMessages += sessionData.messageCount || 0;

    // Update average sentiment score
    if (sessionData.avgSentiment !== undefined) {
      const totalSessions = user.sessionData.totalSessions;
      const currentAvg = user.sessionData.avgSentimentScore || 0;
      user.sessionData.avgSentimentScore = (
        (currentAvg * (totalSessions - 1) + sessionData.avgSentiment) / totalSessions
      );
    }

    this.updateUserActivity(userId);
    this.saveUserData();

    return true;
  }

  // Check and award achievements
  checkAchievements(userId) {
    const user = this.users.get(userId);
    if (!user) return false;

    const achievements = [];

    // Wellness score achievements
    if (user.wellnessData.wellnessScore >= 150) {
      achievements.push({
        id: 'wellness_master',
        name: 'Wellness Master',
        description: 'Reached 150 wellness points',
        icon: '🏆',
        unlockedAt: new Date().toISOString()
      });
    }

    // Streak achievements
    if (user.wellnessData.streaks.activities >= 7) {
      achievements.push({
        id: 'week_warrior',
        name: 'Week Warrior',
        description: '7-day activity streak',
        icon: '🔥',
        unlockedAt: new Date().toISOString()
      });
    }

    if (user.wellnessData.streaks.meditation >= 30) {
      achievements.push({
        id: 'meditation_guru',
        name: 'Meditation Guru',
        description: '30-day meditation streak',
        icon: '🧘‍♀️',
        unlockedAt: new Date().toISOString()
      });
    }

    // Activity achievements
    if (user.wellnessData.activitiesCompleted.length >= 50) {
      achievements.push({
        id: 'activity_champion',
        name: 'Activity Champion',
        description: 'Completed 50 wellness activities',
        icon: '🌟',
        unlockedAt: new Date().toISOString()
      });
    }

    // Add new achievements (avoid duplicates)
    achievements.forEach(achievement => {
      if (!user.wellnessData.achievements.find(a => a.id === achievement.id)) {
        user.wellnessData.achievements.push(achievement);
      }
    });

    return achievements.length > 0;
  }

  // Get user statistics
  getUserStatistics(userId) {
    const user = this.users.get(userId);
    if (!user) return null;

    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const recentActivities = user.wellnessData.activitiesCompleted.filter(
      act => new Date(act.timestamp) >= weekAgo
    );

    const recentMoods = user.wellnessData.moodHistory.filter(
      mood => new Date(mood.timestamp) >= weekAgo
    );

    const monthlyActivities = user.wellnessData.activitiesCompleted.filter(
      act => new Date(act.timestamp) >= monthAgo
    );

    return {
      wellnessScore: user.wellnessData.wellnessScore,
      currentStreak: {
        activities: user.wellnessData.streaks.activities,
        meditation: user.wellnessData.streaks.meditation
      },
      weeklyStats: {
        activitiesCompleted: recentActivities.length,
        avgMood: recentMoods.length > 0
          ? recentMoods.reduce((sum, mood) => sum + mood.mood, 0) / recentMoods.length
          : 0,
        totalPointsEarned: recentActivities.reduce((sum, act) => sum + (act.pointsEarned || 0), 0)
      },
      monthlyStats: {
        activitiesCompleted: monthlyActivities.length,
        totalSessions: user.sessionData.totalSessions,
        avgSentimentScore: user.sessionData.avgSentimentScore || 0
      },
      achievements: user.wellnessData.achievements.length,
      crisisEvents: user.sessionData.crisisEvents.length,
      preferredActivities: user.sessionData.preferredActivities.slice(0, 5)
    };
  }

  // Update user activity
  updateUserActivity(userId) {
    const user = this.users.get(userId);
    if (!user) return false;

    user.lastActiveAt = new Date().toISOString();
    return true;
  }

  // Export user data
  exportUserData(userId) {
    const user = this.users.get(userId);
    if (!user) return null;

    // Create export copy without sensitive metadata
    const exportData = {
      profile: user.profile,
      mentalHealthProfile: user.mentalHealthProfile,
      wellnessData: user.wellnessData,
      sessionData: user.sessionData,
      appointments: user.appointments,
      exportedAt: new Date().toISOString(),
      version: '1.0.0'
    };

    return exportData;
  }

  // Import user data
  importUserData(importData) {
    try {
      const userId = this.generateUserId();
      const user = {
        id: userId,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        sessionId: this.sessionId,
        ...importData,
        metadata: {
          ...importData.metadata,
          importedAt: new Date().toISOString(),
          version: '1.0.0'
        }
      };

      this.users.set(userId, user);
      this.setCurrentUser(userId);
      this.saveUserData();

      return user;
    } catch (error) {
      console.error('Error importing user data:', error);
      return null;
    }
  }

  // Delete user data
  deleteUserData(userId) {
    if (this.users.has(userId)) {
      this.users.delete(userId);
      if (this.currentUser?.id === userId) {
        this.currentUser = null;
        localStorage.removeItem('sakhi_current_user_id');
      }
      this.saveUserData();
      return true;
    }
    return false;
  }

  // Generate IDs
  generateUserId() {
    return `user_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  generateId(prefix) {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // Save to localStorage
  saveUserData() {
    try {
      const data = Object.fromEntries(this.users);
      localStorage.setItem('sakhi_user_data', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving user data:', error);
    }
  }

  // Load from localStorage
  loadUserData() {
    try {
      const stored = localStorage.getItem('sakhi_user_data');
      if (stored) {
        const data = JSON.parse(stored);
        this.users = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  }

  // Get all users (for admin purposes)
  getAllUsers() {
    return Array.from(this.users.values());
  }

  // Health check
  healthCheck() {
    return {
      totalUsers: this.users.size,
      currentUser: this.currentUser?.id || null,
      sessionId: this.sessionId,
      dataIntegrity: this.users.size > 0 ? 'good' : 'empty'
    };
  }
}

export default new UserDataService();
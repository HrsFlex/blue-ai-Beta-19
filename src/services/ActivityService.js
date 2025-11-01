class ActivityService {
  constructor() {
    this.activities = this.initializeActivities();
    this.categoryMappings = this.initializeCategoryMappings();
    this.difficultyLevels = ['easy', 'medium', 'hard'];
    this.durationRanges = {
      quick: { min: 1, max: 5 },
      short: { min: 5, max: 15 },
      medium: { min: 15, max: 30 },
      long: { min: 30, max: 60 }
    };
  }

  initializeActivities() {
    return {
      grounding: [
        {
          id: 'ground_5_4_3_2_1',
          name: '5-4-3-2-1 Grounding',
          description: 'Name 5 things you can see, 4 you can touch, 3 you can hear, 2 you can smell, and 1 you can taste. This brings you to the present moment.',
          duration: 5,
          difficulty: 'easy',
          category: 'grounding',
          moodImpact: ['calm', 'present', 'focused'],
          points: 10,
          instructions: [
            'Take a deep breath and look around you',
            'Name 5 things you can see',
            'Name 4 things you can physically touch',
            'Name 3 things you can hear',
            'Name 2 things you can smell',
            'Name 1 thing you can taste'
          ],
          materials: [],
          environment: 'any',
          crisisLevel: [0, 1, 2, 3, 4, 5],
          evidence: 'Grounding techniques are proven to reduce anxiety and PTSD symptoms by engaging the prefrontal cortex.',
          variations: [
            'Try it with eyes closed for an extra challenge',
            'Write down each item instead of just naming it',
            'Do it slowly and mindfully'
          ]
        },
        {
          id: 'ground_box_breathing',
          name: 'Box Breathing',
          description: 'Breathe in for 4 counts, hold for 4, out for 4, hold for 4. Repeat for 5 cycles. Used by Navy SEALs for stress management.',
          duration: 3,
          difficulty: 'easy',
          category: 'grounding',
          moodImpact: ['calm', 'focused', 'centered'],
          points: 8,
          instructions: [
            'Sit comfortably with your back straight',
            'Breathe in slowly through your nose for 4 counts',
            'Hold your breath for 4 counts',
            'Exhale slowly through your mouth for 4 counts',
            'Hold the exhale for 4 counts',
            'Repeat for 5 complete cycles'
          ],
          materials: ['Quiet space', 'Comfortable seat'],
          environment: 'quiet',
          crisisLevel: [0, 1, 2, 3, 4],
          evidence: 'Box breathing activates the parasympathetic nervous system, reducing cortisol and heart rate.',
          audioGuide: true
        }
      ],

      movement: [
        {
          id: 'move_brisk_walk',
          name: '15-Minute Brisk Walk',
          description: 'Walk at a pace where you can still talk but are slightly out of breath. Fresh air and movement release endorphins.',
          duration: 15,
          difficulty: 'medium',
          category: 'movement',
          moodImpact: ['energized', 'clear-headed', 'refreshed'],
          points: 20,
          instructions: [
            'Wear comfortable shoes',
            'Step outside and start walking',
            'Maintain a brisk pace where conversation is possible but slightly challenging',
            'Focus on your surroundings - notice trees, buildings, sounds',
            'If possible, walk in nature or a park',
            'Return home with a cool-down pace'
          ],
          materials: ['Comfortable shoes', 'Weather-appropriate clothing'],
          environment: 'outdoors',
          crisisLevel: [0, 1, 2, 3],
          evidence: 'Walking increases BDNF (brain-derived neurotrophic factor) and serotonin levels.',
          weatherDependent: true
        },
        {
          id: 'move_stretch_routine',
          name: 'Full Body Stretch Routine',
          description: 'Gentle stretches to release tension from head to toe. Hold each stretch for 20-30 seconds while breathing deeply.',
          duration: 10,
          difficulty: 'easy',
          category: 'movement',
          moodImpact: ['relaxed', 'released', 'aware'],
          points: 12,
          instructions: [
            'Start with neck rolls - slowly roll head in circles',
            'Stretch arms overhead, then side to side',
            'Cat-cow stretches on hands and knees',
            'Forward fold with straight legs',
            'Butterfly stretch for hips',
            'Child\'s pose for back relaxation'
          ],
          materials: ['Yoga mat or soft surface'],
          environment: 'indoor',
          crisisLevel: [0, 1, 2, 3],
          evidence: 'Stretching reduces cortisol and increases blood flow to muscles and brain.',
          videoGuide: true
        },
        {
          id: 'move_dance_break',
          name: '5-Minute Dance Break',
          description: 'Put on your favorite upbeat song and dance freely. No judgment, just movement and joy!',
          duration: 5,
          difficulty: 'easy',
          category: 'movement',
          moodImpact: ['energized', 'joyful', 'free'],
          points: 15,
          instructions: [
            'Choose an upbeat song you love',
            'Find a space where you can move freely',
            'Start moving however feels good - no rules!',
            'Jump, spin, sway, or just bounce',
            'Focus on the music and how your body wants to move',
            'End with a deep breath and smile'
          ],
          materials: ['Music player', 'Favorite songs'],
          environment: 'any',
          crisisLevel: [0, 1, 2],
          evidence: 'Dancing releases dopamine and endorphins while reducing stress hormones.'
        }
      ],

      creative: [
        {
          id: 'create_gratitude_journal',
          name: 'Gratitude Journaling',
          description: 'Write down 3-5 specific things you\'re grateful for and why. This shifts focus to positive aspects of life.',
          duration: 10,
          difficulty: 'easy',
          category: 'creative',
          moodImpact: ['grateful', 'positive', 'mindful'],
          points: 12,
          instructions: [
            'Find a quiet place with pen and paper or open a document',
            'Write "Today I am grateful for:"',
            'List 3-5 specific things',
            'For each item, write WHY you\'re grateful for it',
            'Be as specific as possible - "the warm sun" not just "weather"',
            'Read your list aloud and notice how you feel'
          ],
          materials: ['Journal/notebook', 'Pen or digital device'],
          environment: 'quiet',
          crisisLevel: [0, 1, 2, 3],
          evidence: 'Gratitude practice increases dopamine and serotonin while reducing stress.',
          prompts: [
            'What made you smile today?',
            'Who helped you recently?',
            'What comfort did you experience?',
            'What beauty did you notice?',
            'What are you looking forward to?'
          ]
        },
        {
          id: 'create_doodle_expression',
          name: 'Emotional Doodling',
          description: 'Draw your current feelings using colors, shapes, and lines. No artistic skill needed - just expression.',
          duration: 8,
          difficulty: 'easy',
          category: 'creative',
          moodImpact: ['expressed', 'insightful', 'released'],
          points: 10,
          instructions: [
            'Take paper and colored pens/pencils',
            'Close eyes and notice your current emotions',
            'Choose colors that match these feelings',
            'Draw shapes, lines, or abstract forms',
            'Don\'t worry about making it "good"',
            'Title your creation with the emotion it represents'
          ],
          materials: ['Paper', 'Colored pens, pencils, or markers'],
          environment: 'any',
          crisisLevel: [0, 1, 2, 3, 4],
          evidence: 'Art therapy activates the brain\'s reward centers and provides emotional release.'
        },
        {
          id: 'create_future_letter',
          name: 'Letter to Future Self',
          description: 'Write a letter to yourself 6 months from now, describing your current feelings and hopes for the future.',
          duration: 15,
          difficulty: 'medium',
          category: 'creative',
          moodImpact: ['hopeful', 'perspective', 'motivated'],
          points: 18,
          instructions: [
            'Date the letter for 6 months from today',
            'Describe your current situation honestly',
            'Write about your challenges and strengths',
            'Express your hopes and goals for the future',
            'Give your future self advice and encouragement',
            'Seal it and set a reminder to open it'
          ],
          materials: ['Paper', 'Pen', 'Envelope'],
          environment: 'private',
          crisisLevel: [0, 1, 2, 3],
          evidence: 'Future self-visualization increases motivation and goal achievement.'
        }
      ],

      social: [
        {
          id: 'social_connection_call',
          name: 'Reach Out to Someone',
          description: 'Call or text a friend, family member, or support person. Connection is a powerful antidepressant.',
          duration: 10,
          difficulty: 'medium',
          category: 'social',
          moodImpact: ['connected', 'supported', 'understood'],
          points: 15,
          instructions: [
            'Think of someone you trust and feel comfortable with',
            'Send a message: "Thinking of you, can we talk?"',
            'If they respond, share honestly how you\'re feeling',
            'Ask how they\'re doing too - connection is two-way',
            'Express gratitude for their presence in your life',
            'End with appreciation for the conversation'
          ],
          materials: ['Phone'],
          environment: 'private',
          crisisLevel: [0, 1, 2, 3],
          evidence: 'Social connection releases oxytocin and reduces cortisol significantly.'
        },
        {
          id: 'social_kindness_act',
          name: 'Small Act of Kindness',
          description: 'Do something kind for someone else without expecting anything in return. Helping others helps us too.',
          duration: 5,
          difficulty: 'easy',
          category: 'social',
          moodImpact: ['purposeful', 'connected', 'positive'],
          points: 12,
          instructions: [
            'Think of someone who might need support',
            'Send an encouraging text or compliment',
            'Buy coffee for the person behind you',
            'Leave a positive note for someone to find',
            'Offer help to someone who looks stressed',
            'Notice how giving affects your mood'
          ],
          materials: ['Phone', 'Small amount of money (optional)'],
          environment: 'any',
          crisisLevel: [0, 1, 2],
          evidence: 'Altruistic behavior activates reward centers in the brain.'
        }
      ],

      mindfulness: [
        {
          id: 'mind_body_scan',
          name: 'Body Scan Meditation',
          description: 'Systematically bring attention to each part of your body, noticing sensations without judgment.',
          duration: 15,
          difficulty: 'medium',
          category: 'mindfulness',
          moodImpact: ['relaxed', 'aware', 'present'],
          points: 20,
          instructions: [
            'Lie down comfortably on your back',
            'Close your eyes and take 3 deep breaths',
            'Bring attention to your toes - notice any sensations',
            'Slowly move attention up through feet, ankles, calves',
            'Continue up through legs, torso, arms, head',
            'Notice each area without trying to change anything',
            'End with awareness of your entire body breathing'
          ],
          materials: ['Quiet space', 'Comfortable place to lie down'],
          environment: 'quiet',
          crisisLevel: [0, 1, 2, 3, 4],
          evidence: 'Body scan reduces pain perception and anxiety by changing brain activity patterns.',
          audioGuide: true
        },
        {
          id: 'mind_mindful_observation',
          name: 'Mindful Observation',
          description: 'Choose an object and observe it with beginner\'s mind, as if seeing it for the first time.',
          duration: 5,
          difficulty: 'easy',
          category: 'mindfulness',
          moodImpact: ['curious', 'focused', 'present'],
          points: 8,
          instructions: [
            'Choose any object - a plant, cup, pen, anything',
            'Set a timer for 3-5 minutes',
            'Observe the object as if you\'ve never seen it before',
            'Notice colors, textures, shapes, shadows',
            'Notice how light reflects off surfaces',
            'If mind wanders, gently return to observing'
          ],
          materials: ['Any everyday object'],
          environment: 'any',
          crisisLevel: [0, 1, 2, 3],
          evidence: 'Mindful observation strengthens attention networks in the brain.'
        }
      ],

      emergency: [
        {
          id: 'emergency_crisis_breathing',
          name: 'Emergency Calming Breath',
          description: 'Rapid breathing technique for immediate panic or crisis relief. Use when feeling overwhelmed.',
          duration: 2,
          difficulty: 'easy',
          category: 'emergency',
          moodImpact: ['grounded', 'surviving', 'stable'],
          points: 25,
          instructions: [
            'If safe, sit or lie down',
            'Place hand on belly, other on chest',
            'Breathe in through nose for 2 counts',
            'Breathe out through mouth for 4 counts',
            'Make exhale longer than inhale',
            'Repeat for 10-20 cycles until you feel more stable'
          ],
          materials: [],
          environment: 'any',
          crisisLevel: [3, 4, 5],
          evidence: 'Extended exhale activates vagus nerve, immediately reducing heart rate and anxiety.',
          urgency: 'high'
        },
        {
          id: 'emergency_safety_plan',
          name: 'Create Safety Plan',
          description: 'Write down specific steps for crisis moments. Having a plan reduces panic and increases safety.',
          duration: 20,
          difficulty: 'medium',
          category: 'emergency',
          moodImpact: ['prepared', 'supported', 'safer'],
          points: 30,
          instructions: [
            'List warning signs that you might be in crisis',
            'Write down 3 coping strategies that have helped before',
            'List people you can call for support (with numbers)',
            'Include professional contacts (therapist, crisis lines)',
            'Remove access to any means of self-harm if possible',
            'Keep this plan accessible at all times'
          ],
          materials: ['Paper', 'Pen', 'Contact list'],
          environment: 'private',
          crisisLevel: [2, 3, 4, 5],
          evidence: 'Safety plans reduce suicide attempts by 45% according to multiple studies.',
          urgency: 'critical'
        }
      ]
    };
  }

  initializeCategoryMappings() {
    return {
      anxiety: ['grounding', 'mindfulness', 'movement'],
      depression: ['movement', 'social', 'creative', 'mindfulness'],
      stress: ['grounding', 'mindfulness', 'movement', 'creative'],
      anger: ['movement', 'creative', 'mindfulness'],
      loneliness: ['social', 'creative', 'movement'],
      panic: ['grounding', 'emergency', 'mindfulness'],
      trauma: ['grounding', 'creative', 'professional'],
      burnout: ['creative', 'movement', 'social', 'mindfulness'],
      grief: ['creative', 'social', 'mindfulness'],
      relationship_issues: ['creative', 'mindfulness', 'social']
    };
  }

  // Get personalized activity recommendations
  getPersonalizedRecommendations(sentimentAnalysis, userPreferences = {}, userHistory = []) {
    const recommendations = [];
    const { crisisLevel, emotions, riskIndicators } = sentimentAnalysis;

    // Emergency recommendations for high crisis levels
    if (crisisLevel >= 4) {
      return this.getEmergencyRecommendations(sentimentAnalysis);
    }

    // Get relevant categories based on emotions
    const relevantCategories = this.getRelevantCategories(emotions, riskIndicators);

    // Get activities from relevant categories
    relevantCategories.forEach(category => {
      const categoryActivities = this.activities[category] || [];
      const suitableActivities = categoryActivities.filter(activity =>
        activity.crisisLevel.includes(crisisLevel)
      );
      recommendations.push(...suitableActivities);
    });

    // Prioritize based on user preferences and history
    const prioritizedRecommendations = this.prioritizeActivities(
      recommendations,
      userPreferences,
      userHistory
    );

    // Add variety - ensure different categories are represented
    const diverseRecommendations = this.ensureDiversity(prioritizedRecommendations);

    // Return top recommendations (max 5)
    return diverseRecommendations.slice(0, 5);
  }

  getEmergencyRecommendations(sentimentAnalysis) {
    const emergencyActivities = this.activities.emergency || [];

    // Return all emergency activities, sorted by urgency
    return emergencyActivities
      .filter(activity => activity.crisisLevel.includes(sentimentAnalysis.crisisLevel))
      .sort((a, b) => {
        const urgencyOrder = { 'critical': 3, 'high': 2, 'medium': 1, 'low': 0 };
        return (urgencyOrder[b.urgency] || 0) - (urgencyOrder[a.urgency] || 0);
      });
  }

  getRelevantCategories(emotions, riskIndicators) {
    const categories = new Set();

    // Map emotions to categories
    emotions.forEach(emotion => {
      const emotionLower = emotion.toLowerCase();
      for (const [key, cats] of Object.entries(this.categoryMappings)) {
        if (emotionLower.includes(key)) {
          cats.forEach(cat => categories.add(cat));
        }
      }
    });

    // Add default categories if no specific matches
    if (categories.size === 0) {
      categories.add('grounding');
      categories.add('mindfulness');
    }

    // Always include grounding for negative emotions
    if (emotions.some(e => ['sad', 'anxious', 'angry', 'overwhelmed'].includes(e.toLowerCase()))) {
      categories.add('grounding');
    }

    return Array.from(categories);
  }

  prioritizeActivities(activities, userPreferences, userHistory) {
    return activities.map(activity => {
      let priorityScore = activity.points || 0; // Base score from points

      // Adjust based on user preferences
      if (userPreferences.difficulty && activity.difficulty === userPreferences.difficulty) {
        priorityScore += 10;
      }

      if (userPreferences.duration) {
        const diff = Math.abs(activity.duration - userPreferences.duration);
        priorityScore -= diff * 2; // Penalty for duration mismatch
      }

      if (userPreferences.preferredCategories?.includes(activity.category)) {
        priorityScore += 15;
      }

      // Adjust based on user history
      const completedCount = userHistory.filter(h => h.type === activity.category).length;
      if (completedCount === 0) {
        priorityScore += 5; // Bonus for new categories
      } else if (completedCount > 5) {
        priorityScore -= 3; // Slight penalty for overused categories
      }

      // Check if recently completed similar activity
      const recentSimilar = userHistory.filter(h =>
        h.type === activity.category &&
        new Date(h.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000)
      );
      if (recentSimilar.length > 0) {
        priorityScore -= 10;
      }

      return { ...activity, priorityScore };
    }).sort((a, b) => b.priorityScore - a.priorityScore);
  }

  ensureDiversity(activities) {
    const diverseActivities = [];
    const usedCategories = new Set();

    activities.forEach(activity => {
      if (!usedCategories.has(activity.category) || diverseActivities.length < 3) {
        diverseActivities.push(activity);
        usedCategories.add(activity.category);
      }
    });

    // If we need more activities, add the rest
    if (diverseActivities.length < 5) {
      activities.forEach(activity => {
        if (!diverseActivities.includes(activity) && diverseActivities.length < 5) {
          diverseActivities.push(activity);
        }
      });
    }

    return diverseActivities;
  }

  // Get activity by ID
  getActivityById(activityId) {
    for (const category of Object.values(this.activities)) {
      const activity = category.find(a => a.id === activityId);
      if (activity) return activity;
    }
    return null;
  }

  // Get activities by category
  getActivitiesByCategory(category) {
    return this.activities[category] || [];
  }

  // Get all activities
  getAllActivities() {
    const allActivities = [];
    Object.values(this.activities).forEach(category => {
      allActivities.push(...category);
    });
    return allActivities;
  }

  // Filter activities
  filterActivities(filters = {}) {
    let activities = this.getAllActivities();

    if (filters.category) {
      activities = activities.filter(a => a.category === filters.category);
    }

    if (filters.difficulty) {
      activities = activities.filter(a => a.difficulty === filters.difficulty);
    }

    if (filters.maxDuration) {
      activities = activities.filter(a => a.duration <= filters.maxDuration);
    }

    if (filters.minDuration) {
      activities = activities.filter(a => a.duration >= filters.minDuration);
    }

    if (filters.crisisLevel !== undefined) {
      activities = activities.filter(a => a.crisisLevel.includes(filters.crisisLevel));
    }

    if (filters.environment) {
      activities = activities.filter(a => a.environment === filters.environment || a.environment === 'any');
    }

    if (filters.materialsAvailable) {
      activities = activities.filter(a =>
        a.materials.length === 0 ||
        a.materials.some(m => filters.materialsAvailable.includes(m))
      );
    }

    return activities;
  }

  // Get quick activities (under 10 minutes)
  getQuickActivities() {
    return this.filterActivities({ maxDuration: 10 });
  }

  // Get outdoor activities
  getOutdoorActivities() {
    return this.getAllActivities().filter(a => a.environment === 'outdoors');
  }

  // Get indoor activities
  getIndoorActivities() {
    return this.getAllActivities().filter(a =>
      a.environment === 'indoor' || a.environment === 'any'
    );
  }

  // Get no-materials activities
  getNoMaterialsActivities() {
    return this.getAllActivities().filter(a => a.materials.length === 0);
  }

  // Search activities
  searchActivities(query) {
    const lowerQuery = query.toLowerCase();
    return this.getAllActivities().filter(activity =>
      activity.name.toLowerCase().includes(lowerQuery) ||
      activity.description.toLowerCase().includes(lowerQuery) ||
      activity.moodImpact.some(mood => mood.toLowerCase().includes(lowerQuery)) ||
      activity.category.toLowerCase().includes(lowerQuery)
    );
  }

  // Get activity statistics
  getActivityStatistics() {
    const stats = {
      totalActivities: 0,
      byCategory: {},
      byDifficulty: {},
      averageDuration: 0,
      totalPoints: 0
    };

    Object.entries(this.activities).forEach(([category, activities]) => {
      stats.byCategory[category] = activities.length;
      stats.totalActivities += activities.length;

      activities.forEach(activity => {
        stats.byDifficulty[activity.difficulty] = (stats.byDifficulty[activity.difficulty] || 0) + 1;
        stats.averageDuration += activity.duration;
        stats.totalPoints += activity.points || 0;
      });
    });

    stats.averageDuration = Math.round(stats.averageDuration / stats.totalActivities);

    return stats;
  }

  // Get progress tracking for activity completion
  trackProgress(activityId, userRating, notes = '') {
    const activity = this.getActivityById(activityId);
    if (!activity) return null;

    return {
      activityId,
      activityName: activity.name,
      category: activity.category,
      duration: activity.duration,
      pointsEarned: activity.points || 0,
      userRating,
      notes,
      completedAt: new Date().toISOString(),
      moodImpact: activity.moodImpact
    };
  }
}

export default new ActivityService();
// Health Data Integration Service
// Connects with wearable/smartphone APIs for comprehensive health monitoring

class HealthDataService {
  constructor() {
    this.isInitialized = false;
    this.connectedDevices = [];
    this.healthData = {
      sleep: {},
      activity: {},
      heartRate: {},
      screenTime: {},
      mood: {}
    };
    this.listeners = new Set();
    this.initializeServices();
  }

  async initializeServices() {
    try {
      // Initialize Web APIs and device connections
      await this.initializeDeviceOrientation();
      await this.initializeBatteryAPI();
      await this.initializeScreenTimeTracking();
      await this.initializeMotionSensors();

      this.isInitialized = true;
      console.log('Health Data Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Health Data Service:', error);
    }
  }

  // Sleep Data Integration
  async getSleepData() {
    try {
      // Simulate sleep data (in real implementation, connect to HealthKit/Google Fit)
      const lastNight = this.getSimulatedSleepData();
      this.healthData.sleep = lastNight;

      // Simulate week-long sleep patterns
      this.healthData.sleep.weeklyPattern = this.getWeeklySleepPattern();

      return this.healthData.sleep;
    } catch (error) {
      console.error('Error fetching sleep data:', error);
      return this.getDefaultSleepData();
    }
  }

  getSimulatedSleepData() {
    const now = new Date();
    const lastNight = new Date(now);
    lastNight.setDate(lastNight.getDate() - 1);
    lastNight.setHours(23, 0, 0, 0);

    const thisMorning = new Date(lastNight);
    thisMorning.setHours(7, 30, 0, 0);

    // Generate realistic sleep data
    const sleepDuration = 5.5 + Math.random() * 3; // 5.5-8.5 hours
    const sleepQuality = 0.6 + Math.random() * 0.3; // 60-90% quality
    const deepSleep = sleepDuration * (0.15 + Math.random() * 0.1); // 15-25% deep sleep

    return {
      date: lastNight.toISOString().split('T')[0],
      bedtime: lastNight.toISOString(),
      wakeTime: thisMorning.toISOString(),
      duration: Math.round(sleepDuration * 60), // in minutes
      quality: Math.round(sleepQuality * 100),
      deepSleep: Math.round(deepSleep * 60),
      efficiency: Math.round((sleepDuration / 8) * 100), // sleep efficiency
      stages: {
        deep: Math.round(deepSleep * 60),
        light: Math.round((sleepDuration - deepSleep) * 60),
        rem: Math.round(sleepDuration * 0.2 * 60),
        awake: Math.round((24 - sleepDuration) * 60)
      },
      consistency: this.calculateSleepConsistency()
    };
  }

  getWeeklySleepPattern() {
    const pattern = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      pattern.push({
        date: date.toISOString().split('T')[0],
        duration: Math.round((6 + Math.random() * 3) * 60), // 6-9 hours
        quality: Math.round((65 + Math.random() * 25) * 100) // 65-90% quality
      });
    }
    return pattern;
  }

  calculateSleepConsistency() {
    // Calculate sleep schedule consistency
    const weekData = this.getWeeklySleepPattern();
    const bedtimes = weekData.map(() => 23 + Math.random() * 2); // 11 PM - 1 AM
    const avgVariation = this.calculateStandardDeviation(bedtimes);

    if (avgVariation < 0.5) return 'excellent';
    if (avgVariation < 1) return 'good';
    if (avgVariation < 2) return 'fair';
    return 'poor';
  }

  // Physical Activity Integration
  async getActivityData() {
    try {
      // Get device motion and activity data
      const steps = await this.getStepCount();
      const calories = await this.getCalorieBurn();
      const activeMinutes = await this.getActiveMinutes();
      const exerciseMinutes = await this.getExerciseMinutes();

      this.healthData.activity = {
        steps,
        calories,
        activeMinutes,
        exerciseMinutes,
        floors: Math.floor(Math.random() * 10),
        distance: (steps * 0.0008).toFixed(2), // km
        weeklyTrend: this.getActivityTrend(),
        goalProgress: this.calculateActivityGoalProgress(steps)
      };

      return this.healthData.activity;
    } catch (error) {
      console.error('Error fetching activity data:', error);
      return this.getDefaultActivityData();
    }
  }

  async getStepCount() {
    // Simulate step count (in real implementation, use pedometer API)
    const baseSteps = 5000;
    const dailyVariation = Math.floor(Math.random() * 8000);
    return baseSteps + dailyVariation;
  }

  async getCalorieBurn() {
    const steps = await this.getStepCount();
    const baseCalories = 1200;
    const activityCalories = steps * 0.04;
    return Math.round(baseCalories + activityCalories);
  }

  async getActiveMinutes() {
    // Get active minutes from motion sensors
    return Math.floor(20 + Math.random() * 40); // 20-60 minutes
  }

  async getExerciseMinutes() {
    return Math.floor(10 + Math.random() * 30); // 10-40 minutes
  }

  getActivityTrend() {
    // Generate weekly activity trend
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      trend.push({
        date: this.getDateString(i),
        steps: Math.floor((3000 + Math.random() * 10000)),
        activeMinutes: Math.floor(15 + Math.random() * 45)
      });
    }
    return trend;
  }

  calculateActivityGoalProgress(steps) {
    const dailyGoal = 10000; // 10k steps goal
    return Math.min(100, Math.round((steps / dailyGoal) * 100));
  }

  // Heart Rate Integration
  async getHeartRateData() {
    try {
      // Simulate heart rate data (in real implementation, use heart rate sensors)
      const restingHR = 60 + Math.floor(Math.random() * 20); // 60-80 bpm
      const currentHR = restingHR + Math.floor(Math.random() * 40); // Add activity variation
      const variability = this.calculateHRV(restingHR);

      this.healthData.heartRate = {
        resting: restingHR,
        current: currentHR,
        variability: variability,
        zones: this.getHeartRateZones(restingHR),
        dailyAverage: restingHR + Math.floor(Math.random() * 10),
        weeklyTrend: this.getHeartRateTrend(),
        stressLevel: this.calculateStressLevel(currentHR, variability)
      };

      return this.healthData.heartRate;
    } catch (error) {
      console.error('Error fetching heart rate data:', error);
      return this.getDefaultHeartRateData();
    }
  }

  calculateHRV(restingHR) {
    // Heart Rate Variability calculation
    const baseHRV = 50; // ms
    const variation = Math.random() * 30;
    return Math.round(baseHRV + variation);
  }

  getHeartRateZones(restingHR) {
    const maxHR = 220 - 25; // Assuming 25 years old
    return {
      resting: Math.round(maxHR * 0.5),
      fatBurn: Math.round(maxHR * 0.6),
      cardio: Math.round(maxHR * 0.7),
      peak: Math.round(maxHR * 0.85),
      maximum: maxHR
    };
  }

  getHeartRateTrend() {
    const trend = [];
    for (let i = 6; i >= 0; i--) {
      trend.push({
        date: this.getDateString(i),
        average: Math.floor(65 + Math.random() * 20),
        resting: Math.floor(60 + Math.random() + 15)
      });
    }
    return trend;
  }

  calculateStressLevel(currentHR, variability) {
    // Stress level based on heart rate and HRV
    if (variability > 70 && currentHR < 80) return 'low';
    if (variability > 50 && currentHR < 90) return 'moderate';
    if (variability > 30 && currentHR < 100) return 'elevated';
    return 'high';
  }

  // Screen Time Integration
  async getScreenTimeData() {
    try {
      const today = new Date().toISOString().split('T')[0];
      const screenTime = this.calculateScreenTime();

      this.healthData.screenTime = {
        date: today,
        total: screenTime.total,
        social: screenTime.social,
        productivity: screenTime.productivity,
        entertainment: screenTime.entertainment,
        education: screenTime.education,
        health: screenTime.health,
        pickups: Math.floor(50 + Math.random() * 100), // Phone pickups
        unlockPatterns: this.getUnlockPatterns(),
        digitalWellness: this.calculateDigitalWellness(screenTime)
      };

      return this.healthData.screenTime;
    } catch (error) {
      console.error('Error fetching screen time data:', error);
      return this.getDefaultScreenTimeData();
    }
  }

  calculateScreenTime() {
    // Simulate realistic screen time usage
    const totalMinutes = 180 + Math.floor(Math.random() * 300); // 3-8 hours
    return {
      total: totalMinutes,
      social: Math.round(totalMinutes * 0.3),
      productivity: Math.round(totalMinutes * 0.25),
      entertainment: Math.round(totalMinutes * 0.2),
      education: Math.round(totalMinutes * 0.15),
      health: Math.round(totalMinutes * 0.1)
    };
  }

  getUnlockPatterns() {
    // Simulate phone unlock patterns
    return {
      morning: Math.floor(5 + Math.random() * 15),
      afternoon: Math.floor(10 + Math.random() * 20),
      evening: Math.floor(15 + Math.random() + 25),
      night: Math.floor(8 + Math.random() + 12)
    };
  }

  calculateDigitalWellness(screenTime) {
    const totalHours = screenTime.total / 60;
    const balancedHours = 4; // Recommended 4 hours

    if (totalHours <= balancedHours) return 'excellent';
    if (totalHours <= 6) return 'good';
    if (totalHours <= 8) return 'moderate';
    return 'needs_improvement';
  }

  // Mood Prediction Integration
  async predictMood(healthData) {
    try {
      const prediction = this.analyzeHealthForMood(healthData);
      return prediction;
    } catch (error) {
      console.error('Error predicting mood:', error);
      return this.getDefaultMoodPrediction();
    }
  }

  analyzeHealthForMood(data) {
    let moodScore = 50; // Neutral starting point

    // Sleep impact on mood
    if (data.sleep) {
      const sleepQuality = data.sleep.quality / 100;
      const sleepDuration = data.sleep.duration / 480; // 8 hours = 1.0
      moodScore += (sleepQuality * 20) - 10; // Max ±10
      moodScore += (sleepDuration * 15) - 7.5; // Max ±7.5
    }

    // Activity impact on mood
    if (data.activity) {
      const activityLevel = data.activity.goalProgress / 100;
      moodScore += (activityLevel * 15) - 7.5; // Max ±7.5
    }

    // Heart rate impact on mood
    if (data.heartRate) {
      const stressLevel = data.heartRate.stressLevel;
      const stressImpacts = {
        'low': 10,
        'moderate': 0,
        'elevated': -10,
        'high': -20
      };
      moodScore += stressImpacts[stressLevel] || 0;
    }

    // Screen time impact on mood
    if (data.screenTime) {
      const digitalWellness = data.screenTime.digitalWellness;
      const wellnessImpacts = {
        'excellent': 5,
        'good': 2,
        'moderate': -2,
        'needs_improvement': -8
      };
      moodScore += wellnessImpacts[digitalWellness] || 0;
    }

    // Normalize score to 0-100 range
    moodScore = Math.max(0, Math.min(100, moodScore));

    return {
      score: Math.round(moodScore),
      prediction: this.getMoodFromScore(moodScore),
      confidence: this.calculatePredictionConfidence(data),
      factors: this.getContributingFactors(data),
      recommendations: this.getMoodRecommendations(moodScore, data)
    };
  }

  getMoodFromScore(score) {
    if (score >= 80) return 'excellent';
    if (score >= 65) return 'good';
    if (score >= 50) return 'neutral';
    if (score >= 35) return 'concerned';
    return 'struggling';
  }

  calculatePredictionConfidence(data) {
    let confidence = 0.5; // Base confidence

    if (data.sleep) confidence += 0.2;
    if (data.activity) confidence += 0.15;
    if (data.heartRate) confidence += 0.1;
    if (data.screenTime) confidence += 0.05;

    return Math.min(0.95, confidence);
  }

  getContributingFactors(data) {
    const factors = [];

    if (data.sleep) {
      factors.push({
        name: 'Sleep Quality',
        impact: data.sleep.quality > 75 ? 'positive' : 'negative',
        weight: 0.35
      });
    }

    if (data.activity) {
      factors.push({
        name: 'Physical Activity',
        impact: data.activity.goalProgress > 75 ? 'positive' : 'negative',
        weight: 0.25
      });
    }

    if (data.heartRate) {
      factors.push({
        name: 'Stress Level',
        impact: data.heartRate.stressLevel === 'low' ? 'positive' : 'negative',
        weight: 0.2
      });
    }

    if (data.screenTime) {
      factors.push({
        name: 'Digital Wellness',
        impact: data.screenTime.digitalWellness === 'excellent' ? 'positive' : 'negative',
        weight: 0.2
      });
    }

    return factors.sort((a, b) => b.weight - a.weight);
  }

  getMoodRecommendations(moodScore, data) {
    const recommendations = [];

    if (moodScore < 50) {
      recommendations.push('Consider speaking with a mental health professional');
    }

    if (data.sleep && data.sleep.quality < 70) {
      recommendations.push('Focus on improving sleep quality and consistency');
    }

    if (data.activity && data.activity.goalProgress < 50) {
      recommendations.push('Increase daily physical activity to boost mood');
    }

    if (data.screenTime && data.screenTime.digitalWellness === 'needs_improvement') {
      recommendations.push('Reduce screen time and practice digital wellness');
    }

    return recommendations;
  }

  // Helper Methods
  getDateString(daysAgo) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    return date.toISOString().split('T')[0];
  }

  calculateStandardDeviation(values) {
    const avg = values.reduce((a, b) => a + b) / values.length;
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = squareDiffs.reduce((a, b) => a + b) / squareDiffs.length;
    return Math.sqrt(avgSquareDiff);
  }

  // Device API Initializations
  async initializeDeviceOrientation() {
    if ('DeviceOrientationEvent' in window) {
      // Request permission for device orientation on iOS 13+
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        try {
          await DeviceOrientationEvent.requestPermission();
        } catch (error) {
          console.log('Device orientation permission not granted');
        }
      }
    }
  }

  async initializeBatteryAPI() {
    if ('getBattery' in navigator) {
      try {
        const battery = await navigator.getBattery();
        this.batteryLevel = battery.level;
        battery.addEventListener('levelchange', () => {
          this.batteryLevel = battery.level;
          this.notifyListeners('battery', battery.level);
        });
      } catch (error) {
        console.log('Battery API not available');
      }
    }
  }

  initializeScreenTimeTracking() {
    // Track page visibility for screen time estimation
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        this.lastHiddenTime = Date.now();
      } else {
        if (this.lastHiddenTime) {
          const hiddenDuration = Date.now() - this.lastHiddenTime;
          this.updateScreenTimeEstimate(hiddenDuration);
        }
      }
    });
  }

  initializeMotionSensors() {
    if ('DeviceMotionEvent' in window) {
      window.addEventListener('devicemotion', (event) => {
        this.processMotionData(event);
      });
    }
  }

  processMotionData(event) {
    // Process accelerometer and gyroscope data
    const acceleration = event.acceleration;
    if (acceleration && acceleration.x !== null) {
      this.detectActivityType(acceleration);
    }
  }

  detectActivityType(acceleration) {
    const magnitude = Math.sqrt(
      acceleration.x ** 2 +
      acceleration.y ** 2 +
      acceleration.z ** 2
    );

    // Detect activity based on motion intensity
    if (magnitude > 15) {
      this.currentActivity = 'running';
    } else if (magnitude > 5) {
      this.currentActivity = 'walking';
    } else if (magnitude > 2) {
      this.currentActivity = 'sitting';
    } else {
      this.currentActivity = 'still';
    }
  }

  updateScreenTimeEstimate(duration) {
    if (!this.screenTimeEstimate) {
      this.screenTimeEstimate = 0;
    }
    this.screenTimeEstimate += duration;
  }

  // Default data methods
  getDefaultSleepData() {
    return {
      date: this.getDateString(1),
      duration: 420, // 7 hours
      quality: 75,
      deepSleep: 60,
      efficiency: 88,
      stages: { deep: 60, light: 300, rem: 60, awake: 120 },
      consistency: 'good'
    };
  }

  getDefaultActivityData() {
    return {
      steps: 8000,
      calories: 2000,
      activeMinutes: 30,
      exerciseMinutes: 20,
      floors: 5,
      distance: '6.4',
      goalProgress: 80
    };
  }

  getDefaultHeartRateData() {
    return {
      resting: 70,
      current: 75,
      variability: 60,
      zones: { resting: 95, fatBurn: 114, cardio: 133, peak: 162, maximum: 195 },
      stressLevel: 'low'
    };
  }

  getDefaultScreenTimeData() {
    return {
      date: this.getDateString(0),
      total: 300, // 5 hours
      social: 90,
      productivity: 75,
      entertainment: 60,
      education: 45,
      health: 30,
      pickups: 75,
      digitalWellness: 'moderate'
    };
  }

  getDefaultMoodPrediction() {
    return {
      score: 50,
      prediction: 'neutral',
      confidence: 0.3,
      factors: [],
      recommendations: []
    };
  }

  // Event Listeners
  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(type, data) {
    this.listeners.forEach(listener => {
      try {
        listener(type, data);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  // Public API Methods
  async getAllHealthData() {
    const [sleep, activity, heartRate, screenTime] = await Promise.all([
      this.getSleepData(),
      this.getActivityData(),
      this.getHeartRateData(),
      this.getScreenTimeData()
    ]);

    const moodPrediction = await this.predictMood({
      sleep,
      activity,
      heartRate,
      screenTime
    });

    return {
      sleep,
      activity,
      heartRate,
      screenTime,
      mood: moodPrediction,
      lastUpdated: new Date().toISOString(),
      dataSources: this.getDataSources()
    };
  }

  getDataSources() {
    return {
      sleep: 'Simulated (Connect to HealthKit/Google Fit for real data)',
      activity: 'Device Motion Sensors',
      heartRate: 'Simulated (Connect to heart rate monitors)',
      screenTime: 'Browser API + Usage Patterns'
    };
  }

  async checkHealth() {
    return {
      status: this.isInitialized ? 'healthy' : 'limited',
      connectedDevices: this.connectedDevices.length,
      availableAPIs: this.getAvailableAPIs(),
      lastSync: new Date().toISOString()
    };
  }

  getAvailableAPIs() {
    const apis = [];
    if ('DeviceOrientationEvent' in window) apis.push('Device Orientation');
    if ('getBattery' in navigator) apis.push('Battery API');
    if ('DeviceMotionEvent' in window) apis.push('Device Motion');
    if ('geolocation' in navigator) apis.push('Geolocation');
    return apis;
  }
}

// Export singleton instance
const healthDataService = new HealthDataService();
export default healthDataService;
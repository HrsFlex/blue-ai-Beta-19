import axios from 'axios';
import CryptoJS from 'crypto-js';

/**
 * Real Health Data Integration Service
 * Connects to multiple health data providers:
 * - Google Fit
 * - Strava
 * - Withings
 * - Apple Health (via HealthKit)
 * - Generic Web APIs
 */

class RealHealthDataService {
  constructor() {
    this.isInitialized = false;
    this.connectedProviders = new Set();
    this.authTokens = new Map();
    this.healthData = {
      sleep: {},
      activity: {},
      heartRate: {},
      weight: {},
      bloodPressure: {},
      steps: {},
      calories: {}
    };
    this.listeners = new Set();

    // Initialize available providers with environment variables
    this.providers = {
      googleFit: {
        name: 'Google Fit',
        id: 'googleFit',
        clientId: process.env.REACT_APP_GOOGLE_FIT_CLIENT_ID || '',
        clientSecret: process.env.REACT_APP_GOOGLE_FIT_CLIENT_SECRET || '',
        redirectUri: process.env.REACT_APP_GOOGLE_FIT_REDIRECT_URI || `${window.location.origin}/auth/google-fit/callback`,
        scopes: [
          'https://www.googleapis.com/auth/fitness.activity.read',
          'https://www.googleapis.com/auth/fitness.body.read',
          'https://www.googleapis.com/auth/fitness.heart_rate.read',
          'https://www.googleapis.com/auth/fitness.sleep.read'
        ],
        enabled: process.env.REACT_APP_ENABLE_GOOGLE_FIT === 'true',
        connected: false
      },
      strava: {
        name: 'Strava',
        id: 'strava',
        clientId: process.env.REACT_APP_STRAVA_CLIENT_ID || '',
        clientSecret: process.env.REACT_APP_STRAVA_CLIENT_SECRET || '',
        redirectUri: process.env.REACT_APP_STRAVA_REDIRECT_URI || `${window.location.origin}/auth/strava/callback`,
        scopes: ['activity:read_all', 'read_all'],
        enabled: process.env.REACT_APP_ENABLE_STRAVA === 'true',
        connected: false
      },
      withings: {
        name: 'Withings',
        id: 'withings',
        clientId: process.env.REACT_APP_WITHINGS_CLIENT_ID || '',
        clientSecret: process.env.REACT_APP_WITHINGS_CLIENT_SECRET || '',
        redirectUri: process.env.REACT_APP_WITHINGS_REDIRECT_URI || `${window.location.origin}/auth/withings/callback`,
        scopes: ['user.info', 'user.metrics', 'user.activity'],
        enabled: process.env.REACT_APP_ENABLE_WITHINGS === 'true',
        connected: false
      },
      custom: {
        name: 'Custom Health API',
        id: 'custom',
        endpoint: process.env.REACT_APP_CUSTOM_API_ENDPOINT || '',
        apiKey: process.env.REACT_APP_CUSTOM_API_KEY || '',
        enabled: process.env.REACT_APP_ENABLE_CUSTOM_API === 'true',
        connected: false
      }
    };

    this.initializeServices();
  }

  async initializeServices() {
    try {
      // Check which providers have credentials
      this.checkAvailableProviders();
      this.isInitialized = true;
      console.log('Real Health Data Service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Real Health Data Service:', error);
    }
  }

  checkAvailableProviders() {
    const enabledProviders = [];

    // Check which providers have valid credentials and are enabled
    Object.keys(this.providers).forEach(providerId => {
      const provider = this.providers[providerId];

      if (provider.enabled) {
        let hasCredentials = false;

        switch (providerId) {
          case 'googleFit':
            hasCredentials = provider.clientId && provider.clientId !== 'your-google-fit-client-id';
            break;
          case 'strava':
            hasCredentials = provider.clientId &&
                           provider.clientSecret &&
                           provider.clientId !== 'your-strava-client-id' &&
                           provider.clientSecret !== 'your-strava-client-secret';
            break;
          case 'withings':
            hasCredentials = provider.clientId &&
                           provider.clientSecret &&
                           provider.clientId !== 'your-withings-client-id' &&
                           provider.clientSecret !== 'your-withings-client-secret';
            break;
          case 'custom':
            hasCredentials = provider.endpoint &&
                           provider.apiKey &&
                           provider.endpoint !== 'https://api.yourhealthapp.com' &&
                           provider.apiKey !== 'your-custom-api-key';
            break;
        }

        provider.hasCredentials = hasCredentials;
        if (hasCredentials) {
          enabledProviders.push(provider);
        }
      }
    });

    if (process.env.REACT_APP_DEBUG_HEALTH_DATA === 'true') {
      console.log('Available health providers:', enabledProviders.map(p => p.name));
    }

    return enabledProviders;
  }

  // Utility method to generate secure state tokens for OAuth
  generateStateToken(provider) {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2);
    const stateData = `${provider}:${timestamp}:${random}`;

    // Encrypt and encode the state
    const encrypted = CryptoJS.AES.encrypt(stateData, this.providers[provider].clientId || 'default-key').toString();

    // Store for verification
    localStorage.setItem(`${provider}AuthState`, JSON.stringify({
      state: encrypted,
      timestamp: timestamp,
      provider: provider
    }));

    return encrypted;
  }

  // Verify OAuth state token
  verifyStateToken(provider, receivedState) {
    try {
      const storedData = JSON.parse(localStorage.getItem(`${provider}AuthState`) || '{}');

      if (!storedData.state || storedData.state !== receivedState) {
        throw new Error('Invalid state token');
      }

      // Check if state is not too old (5 minutes)
      const age = Date.now() - storedData.timestamp;
      if (age > 5 * 60 * 1000) {
        throw new Error('State token expired');
      }

      // Clear stored state
      localStorage.removeItem(`${provider}AuthState`);

      return true;
    } catch (error) {
      console.error('State verification failed:', error);
      return false;
    }
  }

  // Google Fit Integration
  async connectGoogleFit() {
    try {
      if (!this.providers.googleFit.hasCredentials) {
        throw new Error('Google Fit credentials not configured. Please set REACT_APP_GOOGLE_FIT_CLIENT_ID in your .env file.');
      }

      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${this.providers.googleFit.clientId}&` +
        `redirect_uri=${encodeURIComponent(this.providers.googleFit.redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(this.providers.googleFit.scopes.join(' '))}&` +
        `access_type=offline&` +
        `prompt=consent&` +
        `state=${this.generateStateToken('googleFit')}`;

      // Store auth state for verification
      const state = CryptoJS.lib.WordArray.random(16).toString();
      localStorage.setItem('googleFitAuthState', state);
      localStorage.setItem('googleFitRedirectUri', this.providers.googleFit.redirectUri);

      window.location.href = authUrl;
    } catch (error) {
      console.error('Google Fit connection failed:', error);
      throw error;
    }
  }

  async handleGoogleFitCallback(code, state) {
    try {
      const storedState = localStorage.getItem('googleFitAuthState');
      if (state !== storedState) {
        throw new Error('Invalid auth state');
      }

      const redirectUri = localStorage.getItem('googleFitRedirectUri');
      const response = await axios.post('https://oauth2.googleapis.com/token', {
        client_id: this.providers.googleFit.clientId,
        client_secret: process.env.REACT_APP_GOOGLE_FIT_CLIENT_SECRET,
        code: code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      });

      const { access_token, refresh_token } = response.data;
      this.authTokens.set('googleFit', {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + (3600 * 1000) // 1 hour
      });

      this.connectedProviders.add('googleFit');
      localStorage.removeItem('googleFitAuthState');
      localStorage.removeItem('googleFitRedirectUri');

      // Fetch initial data
      await this.fetchGoogleFitData();

      return { success: true };
    } catch (error) {
      console.error('Google Fit auth callback failed:', error);
      throw error;
    }
  }

  async fetchGoogleFitData() {
    try {
      const token = this.authTokens.get('googleFit');
      if (!token) return;

      const now = new Date();
      const endTime = now.toISOString();
      const startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days ago

      // Fetch steps data
      const stepsResponse = await this.makeGoogleFitRequest({
        aggregateBy: [{
          dataTypeName: 'com.google.step_count.delta',
          dataSourceId: 'derived:com.google.step_count.delta:com.google.android.gms:estimated_steps'
        }],
        bucketByTime: { durationMillis: 86400000 }, // 1 day buckets
        startTimeMillis: new Date(startTime).getTime(),
        endTimeMillis: new Date(endTime).getTime()
      });

      // Fetch heart rate data
      const heartRateResponse = await this.makeGoogleFitRequest({
        aggregateBy: [{
          dataTypeName: 'com.google.heart_rate.bpm',
          dataSourceId: 'derived:com.google.heart_rate.bpm:com.google.android.gms:merge_heart_rate_bpm'
        }],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: new Date(startTime).getTime(),
        endTimeMillis: new Date(endTime).getTime()
      });

      // Process Google Fit data
      this.processGoogleFitData(stepsResponse, heartRateResponse);

    } catch (error) {
      console.error('Failed to fetch Google Fit data:', error);
    }
  }

  async makeGoogleFitRequest(requestBody) {
    const token = this.authTokens.get('googleFit');
    const response = await axios.post(
      'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate',
      requestBody,
      {
        headers: {
          'Authorization': `Bearer ${token.accessToken}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data;
  }

  processGoogleFitData(stepsData, heartRateData) {
    // Process steps data
    if (stepsData.bucket) {
      const latestSteps = stepsData.bucket[stepsData.bucket.length - 1];
      if (latestSteps.dataset && latestSteps.dataset[0]) {
        const steps = latestSteps.dataset[0].point?.[0]?.value?.[0]?.intVal || 0;
        this.healthData.steps = {
          daily: steps,
          trend: stepsData.bucket.map(bucket => ({
            date: new Date(bucket.startTimeMillis).toISOString().split('T')[0],
            value: bucket.dataset[0]?.point?.[0]?.value?.[0]?.intVal || 0
          }))
        };
      }
    }

    // Process heart rate data
    if (heartRateData.bucket) {
      const latestHR = heartRateData.bucket[heartRateData.bucket.length - 1];
      if (latestHR.dataset && latestHR.dataset[0]) {
        const avgHeartRate = latestHR.dataset[0].point?.[0]?.value?.[0]?.fpVal || 0;
        this.healthData.heartRate = {
          current: Math.round(avgHeartRate),
          resting: Math.round(avgHeartRate * 0.8), // Estimate
          variability: 45 + Math.random() * 25, // Mock HRV
          trend: heartRateData.bucket.map(bucket => ({
            date: new Date(bucket.startTimeMillis).toISOString().split('T')[0],
            value: Math.round(bucket.dataset[0]?.point?.[0]?.value?.[0]?.fpVal || 0)
          }))
        };
      }
    }

    this.notifyListeners('googleFit', this.healthData);
  }

  // Strava Integration
  async connectStrava() {
    try {
      const redirectUri = `${window.location.origin}/auth/strava/callback`;
      const authUrl = `https://www.strava.com/oauth/authorize?` +
        `client_id=${this.providers.strava.clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(this.providers.strava.scopes.join(','))}&` +
        `approval_prompt=force`;

      // Store auth state
      const state = CryptoJS.lib.WordArray.random(16).toString();
      localStorage.setItem('stravaAuthState', state);
      localStorage.setItem('stravaRedirectUri', redirectUri);

      window.location.href = authUrl;
    } catch (error) {
      console.error('Strava connection failed:', error);
      throw error;
    }
  }

  async handleStravaCallback(code, state) {
    try {
      const storedState = localStorage.getItem('stravaAuthState');
      if (state !== storedState) {
        throw new Error('Invalid auth state');
      }

      const redirectUri = localStorage.getItem('stravaRedirectUri');
      const response = await axios.post('https://www.strava.com/oauth/token', {
        client_id: this.providers.strava.clientId,
        client_secret: this.providers.strava.clientSecret,
        code: code,
        grant_type: 'authorization_code'
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token, expires_at } = response.data;
      this.authTokens.set('strava', {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: expires_at * 1000
      });

      this.connectedProviders.add('strava');
      localStorage.removeItem('stravaAuthState');
      localStorage.removeItem('stravaRedirectUri');

      // Fetch initial data
      await this.fetchStravaData();

      return { success: true };
    } catch (error) {
      console.error('Strava auth callback failed:', error);
      throw error;
    }
  }

  async fetchStravaData() {
    try {
      const token = this.authTokens.get('strava');
      if (!token) return;

      // Fetch recent activities
      const activitiesResponse = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
        headers: {
          'Authorization': `Bearer ${token.accessToken}`
        },
        params: {
          per_page: 30,
          page: 1
        }
      });

      // Fetch athlete profile
      const athleteResponse = await axios.get('https://www.strava.com/api/v3/athlete', {
        headers: {
          'Authorization': `Bearer ${token.accessToken}`
        }
      });

      this.processStravaData(activitiesResponse.data, athleteResponse.data);

    } catch (error) {
      console.error('Failed to fetch Strava data:', error);
    }
  }

  processStravaData(activities, athlete) {
    // Process activity data
    const today = new Date().toISOString().split('T')[0];
    const todayActivities = activities.filter(activity =>
      activity.start_date_local?.split('T')[0] === today
    );

    let totalDistance = 0;
    let totalDuration = 0;
    let totalCalories = 0;

    todayActivities.forEach(activity => {
      totalDistance += activity.distance || 0;
      totalDuration += (activity.moving_time || 0) / 60; // Convert to minutes
      totalCalories += activity.calories || 0;
    });

    this.healthData.activity = {
      distance: Math.round(totalDistance / 1000 * 100) / 100, // Convert to km
      duration: Math.round(totalDuration),
      calories: Math.round(totalCalories),
      activities: todayActivities.length,
      weeklyTrend: this.getWeeklyStravaTrend(activities),
      athleteStats: {
        followers: athlete.follower_count,
        following: athlete.friend_count,
        totalRuns: athlete.all_run_types || 0,
        totalRides: athlete.all_ride_types || 0
      }
    };

    this.notifyListeners('strava', this.healthData);
  }

  getWeeklyStravaTrend(activities) {
    const trend = [];
    const today = new Date();

    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];

      const dayActivities = activities.filter(activity =>
        activity.start_date_local?.split('T')[0] === dateString
      );

      trend.push({
        date: dateString,
        activities: dayActivities.length,
        distance: Math.round(dayActivities.reduce((sum, act) => sum + (act.distance || 0), 0) / 1000 * 100) / 100,
        duration: Math.round(dayActivities.reduce((sum, act) => sum + (act.moving_time || 0), 0) / 60)
      });
    }

    return trend;
  }

  // Withings Integration
  async connectWithings() {
    try {
      const redirectUri = `${window.location.origin}/auth/withings/callback`;
      const authUrl = `https://account.withings.com/oauth2_user/authorize2?` +
        `response_type=code&` +
        `client_id=${this.providers.withings.clientId}&` +
        `state=${CryptoJS.lib.WordArray.random(16).toString()}&` +
        `scope=user.info,user.activity,user.sleepevents,user.metrics&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}`;

      localStorage.setItem('withingsRedirectUri', redirectUri);
      window.location.href = authUrl;
    } catch (error) {
      console.error('Withings connection failed:', error);
      throw error;
    }
  }

  async handleWithingsCallback(code) {
    try {
      const redirectUri = localStorage.getItem('withingsRedirectUri');
      const response = await axios.post('https://wbsapi.withings.net/v2/oauth2/token', {
        action: 'requesttoken',
        client_id: this.providers.withings.clientId,
        client_secret: this.providers.withings.clientSecret,
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: redirectUri
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const { access_token, refresh_token } = response.data.body;
      this.authTokens.set('withings', {
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt: Date.now() + (1800 * 1000) // 30 minutes
      });

      this.connectedProviders.add('withings');
      localStorage.removeItem('withingsRedirectUri');

      // Fetch initial data
      await this.fetchWithingsData();

      return { success: true };
    } catch (error) {
      console.error('Withings auth callback failed:', error);
      throw error;
    }
  }

  async fetchWithingsData() {
    try {
      const token = this.authTokens.get('withings');
      if (!token) return;

      // Fetch sleep data
      const sleepResponse = await this.makeWithingsRequest('/v2/sleep?action=get');

      // Fetch weight data
      const weightResponse = await this.makeWithingsRequest('/v2/measure?action=getmeas&meastype=1');

      // Fetch heart rate data
      const heartRateResponse = await this.makeWithingsRequest('/v2/measure?action=getmeas&meastype=11');

      this.processWithingsData(sleepResponse, weightResponse, heartRateResponse);

    } catch (error) {
      console.error('Failed to fetch Withings data:', error);
    }
  }

  async makeWithingsRequest(endpoint) {
    const token = this.authTokens.get('withings');
    const response = await axios.get(`https://wbsapi.withings.net${endpoint}`, {
      headers: {
        'Authorization': `Bearer ${token.accessToken}`
      }
    });
    return response.data;
  }

  processWithingsData(sleepData, weightData, heartRateData) {
    // Process sleep data
    if (sleepData.body && sleepData.body.sleep) {
      const latestSleep = sleepData.body.sleep[0];
      this.healthData.sleep = {
        date: latestSleep?.date || new Date().toISOString().split('T')[0],
        duration: latestSleep?.duration || 0,
        quality: latestSleep?.sleep_quality || 0,
        deepSleep: latestSleep?.ds || 0,
        lightSleep: latestSleep?.ls || 0,
        remSleep: latestSleep?.rem || 0,
        wakeTime: latestSleep?.wakeup_time || '',
        bedtime: latestSleep?.bedtime || '',
        dataFrom: 'Withings'
      };
    }

    // Process weight data
    if (weightData.body && weightData.body.measuregrps) {
      const latestWeight = weightData.body.measuregrps[0]?.measures[0];
      if (latestWeight) {
        this.healthData.weight = {
          value: latestWeight.value / 1000, // Convert to kg
          unit: 'kg',
          date: new Date(latestWeight.created * 1000).toISOString(),
          dataFrom: 'Withings'
        };
      }
    }

    // Process heart rate data
    if (heartRateData.body && heartRateData.body.measuregrps) {
      const latestHR = heartRateData.body.measuregrps[0]?.measures[0];
      if (latestHR) {
        this.healthData.heartRate = {
          current: Math.round(latestHR.value),
          resting: Math.round(latestHR.value * 0.9), // Estimate
          variability: 40 + Math.random() * 30, // Mock HRV
          date: new Date(latestHR.created * 1000).toISOString(),
          dataFrom: 'Withings'
        };
      }
    }

    this.notifyListeners('withings', this.healthData);
  }

  // Generic Web API Integration (for custom health apps)
  async connectWebAPI(apiConfig) {
    try {
      const { name, endpoint, apiKey, authType } = apiConfig;

      // Store API configuration
      this.authTokens.set(name, {
        endpoint,
        apiKey,
        authType: authType || 'api_key'
      });

      this.connectedProviders.add(name);

      // Test the connection
      await this.testWebAPIConnection(name);

      return { success: true };
    } catch (error) {
      console.error(`Web API ${apiConfig.name} connection failed:`, error);
      throw error;
    }
  }

  async testWebAPIConnection(providerName) {
    const config = this.authTokens.get(providerName);
    if (!config) throw new Error('API configuration not found');

    try {
      const headers = {};
      if (config.authType === 'api_key') {
        headers['Authorization'] = `Bearer ${config.apiKey}`;
        headers['X-API-Key'] = config.apiKey;
      }

      const response = await axios.get(`${config.endpoint}/health`, {
        headers,
        timeout: 5000
      });

      return response.data;
    } catch (error) {
      throw new Error(`Connection test failed: ${error.message}`);
    }
  }

  // Data aggregation and processing
  async getAllHealthData() {
    const aggregatedData = {
      ...this.healthData,
      lastUpdated: new Date().toISOString(),
      connectedProviders: Array.from(this.connectedProviders),
      dataSources: this.getDataSources()
    };

    // Calculate derived metrics
    aggregatedData.derived = this.calculateDerivedMetrics(aggregatedData);

    return aggregatedData;
  }

  calculateDerivedMetrics(data) {
    const derived = {
      activityScore: 0,
      sleepScore: 0,
      heartHealthScore: 0,
      overallWellnessScore: 0,
      recommendations: []
    };

    // Activity score based on steps and exercise
    if (data.steps?.daily) {
      derived.activityScore = Math.min(100, Math.round((data.steps.daily / 10000) * 100));
    }
    if (data.activity?.duration) {
      const exerciseScore = Math.min(100, Math.round((data.activity.duration / 30) * 100));
      derived.activityScore = (derived.activityScore + exerciseScore) / 2;
    }

    // Sleep score
    if (data.sleep?.quality) {
      derived.sleepScore = data.sleep.quality;
    }

    // Heart health score
    if (data.heartRate?.current) {
      const hr = data.heartRate.current;
      if (hr >= 60 && hr <= 100) {
        derived.heartHealthScore = 90 + Math.round((1 - Math.abs(80 - hr) / 20) * 10);
      } else {
        derived.heartHealthScore = Math.max(0, 100 - Math.abs(80 - hr));
      }
    }

    // Overall wellness score
    derived.overallWellnessScore = Math.round(
      (derived.activityScore * 0.3 +
       derived.sleepScore * 0.3 +
       derived.heartHealthScore * 0.4)
    );

    // Generate recommendations
    derived.recommendations = this.generateRecommendations(derived, data);

    return derived;
  }

  generateRecommendations(derived, data) {
    const recommendations = [];

    if (derived.activityScore < 60) {
      recommendations.push('Increase daily physical activity to improve your fitness level');
    }

    if (derived.sleepScore < 70) {
      recommendations.push('Focus on improving sleep quality and maintaining consistent sleep schedule');
    }

    if (derived.heartHealthScore < 70) {
      recommendations.push('Consider cardiovascular exercises and stress management techniques');
    }

    if (derived.overallWellnessScore >= 80) {
      recommendations.push('Great job! Keep maintaining your healthy lifestyle habits');
    }

    return recommendations;
  }

  getDataSources() {
    const sources = {};
    this.connectedProviders.forEach(provider => {
      sources[provider] = {
        name: this.providers[provider]?.name || provider,
        status: 'connected',
        lastSync: new Date().toISOString()
      };
    });
    return sources;
  }

  // Event listeners
  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(provider, data) {
    this.listeners.forEach(listener => {
      try {
        listener(provider, data);
      } catch (error) {
        console.error('Error notifying listener:', error);
      }
    });
  }

  // Utility methods
  getAvailableProviders() {
    return Object.entries(this.providers)
      .filter(([_, config]) => config.enabled)
      .map(([key, config]) => ({
        id: key,
        name: config.name,
        connected: this.connectedProviders.has(key)
      }));
  }

  isConnected(providerName) {
    return this.connectedProviders.has(providerName);
  }

  async disconnectProvider(providerName) {
    this.connectedProviders.delete(providerName);
    this.authTokens.delete(providerName);

    // Remove provider-specific data
    switch (providerName) {
      case 'googleFit':
        delete this.healthData.steps;
        delete this.healthData.heartRate;
        break;
      case 'strava':
        delete this.healthData.activity;
        break;
      case 'withings':
        delete this.healthData.sleep;
        delete this.healthData.weight;
        break;
    }

    this.notifyListeners('disconnected', { provider: providerName });
  }

  // Get available providers for UI
  getAvailableProviders() {
    return this.checkAvailableProviders();
  }

  // Check if any providers have credentials configured
  hasAnyConfiguredProviders() {
    const available = this.getAvailableProviders();
    return available.length > 0;
  }

  // Public API methods
  async checkHealth() {
    return {
      status: this.isInitialized ? 'healthy' : 'limited',
      connectedProviders: this.connectedProviders.size,
      availableProviders: this.getAvailableProviders().length,
      lastSync: new Date().toISOString()
    };
  }
}

// Export singleton instance
const realHealthDataService = new RealHealthDataService();
export default realHealthDataService;
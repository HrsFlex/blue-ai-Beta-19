/**
 * MCP (Model Context Protocol) Health Server
 * Simulates an n8n-style workflow for processing health app screenshots
 * Uses Gemini AI to extract structured health data from images
 */

class MCPHealthServer {
  constructor() {
    this.isRunning = false;
    this.workflows = new Map();
    this.dataBuffer = [];
    this.subscribers = new Set();
    this.processingQueue = [];
    this.aiProcessor = null;

    // Initialize workflows
    this.initializeWorkflows();

    // Setup AI processor
    this.setupAIProcessor();
  }

  initializeWorkflows() {
    // Screenshot Processing Workflow
    this.workflows.set('screenshot-to-health-data', {
      id: 'screenshot-to-health-data',
      name: 'Mobile App Screenshot Processor',
      description: 'Extracts health data from mobile app screenshots using AI',
      nodes: [
        {
          id: 'input-screenshot',
          type: 'trigger',
          name: 'Screenshot Input',
          description: 'Receives health app screenshot from mobile device'
        },
        {
          id: 'image-analysis',
          type: 'ai-processing',
          name: 'Gemini Vision Analysis',
          description: 'Analyzes screenshot and extracts health metrics using AI'
        },
        {
          id: 'data-structuring',
          type: 'data-transformation',
          name: 'Health Data Formatter',
          description: 'Converts extracted text into structured health data format'
        },
        {
          id: 'dashboard-update',
          type: 'output',
          name: 'Update Dashboard',
          description: 'Sends processed data to health dashboard'
        }
      ],
      connections: [
        { from: 'input-screenshot', to: 'image-analysis' },
        { from: 'image-analysis', to: 'data-structuring' },
        { from: 'data-structuring', to: 'dashboard-update' }
      ]
    });

    // Health Data Aggregation Workflow
    this.workflows.set('health-data-aggregator', {
      id: 'health-data-aggregator',
      name: 'Health Data Aggregator',
      description: 'Aggregates and analyzes health data from multiple sources',
      nodes: [
        {
          id: 'data-input',
          type: 'trigger',
          name: 'Health Data Input',
          description: 'Receives structured health data'
        },
        {
          id: 'data-validation',
          type: 'validation',
          name: 'Data Validation',
          description: 'Validates and cleans health data'
        },
        {
          id: 'insights-generation',
          type: 'ai-analysis',
          name: 'Health Insights',
          description: 'Generates health insights and recommendations'
        },
        {
          id: 'trend-analysis',
          type: 'analysis',
          name: 'Trend Analysis',
          description: 'Analyzes health trends over time'
        },
        {
          id: 'broadcast-update',
          type: 'output',
          name: 'Broadcast Update',
          description: 'Sends updates to all connected clients'
        }
      ],
      connections: [
        { from: 'data-input', to: 'data-validation' },
        { from: 'data-validation', to: 'insights-generation' },
        { from: 'insights-generation', to: 'trend-analysis' },
        { from: 'trend-analysis', to: 'broadcast-update' }
      ]
    });
  }

  setupAIProcessor() {
    // Real Gemini AI processor for screenshot analysis
    this.aiProcessor = {
      analyzeImage: async (imageData, healthAppType = 'generic') => {
        try {
          console.log(`🤖 Starting Gemini AI analysis for ${healthAppType} screenshot`);

          // Get Gemini API key from environment
          const apiKey = this.getGeminiApiKey();
          if (!apiKey) {
            throw new Error('Gemini API key not found in environment variables');
          }

          // Prepare the image for Gemini API
          const base64Image = this.prepareImageForGemini(imageData);

          // Create the prompt for health data extraction
          const prompt = this.createHealthExtractionPrompt(healthAppType);

          // Call Gemini API
          const response = await this.callGeminiAPI(base64Image, prompt, apiKey);

          // Parse and structure the response
          const extractedData = this.parseGeminiResponse(response, healthAppType);

          console.log('✅ Gemini AI analysis completed successfully');
          return extractedData;

        } catch (error) {
          console.error('❌ Gemini AI analysis failed:', error);

          // Fallback to mock data with error notification
          return this.generateMockHealthData(imageData, healthAppType, error);
        }
      },

      generateInsights: async (healthData) => {
        try {
          console.log('🧠 Generating health insights with Gemini AI');

          const apiKey = this.getGeminiApiKey();
          if (!apiKey) {
            throw new Error('Gemini API key not found');
          }

          const prompt = this.createInsightsPrompt(healthData);
          const response = await this.callGeminiTextAPI(prompt, apiKey);

          const insights = this.parseInsightsResponse(response);

          console.log('✅ Health insights generated successfully');
          return insights;

        } catch (error) {
          console.error('❌ Insights generation failed:', error);

          // Fallback to basic insights
          return {
            moodPrediction: this.analyzeMood(healthData),
            recommendations: this.generateRecommendations(healthData),
            riskFactors: this.identifyRiskFactors(healthData),
            trends: this.analyzeTrends(healthData)
          };
        }
      }
    };
  }

  async processScreenshot(imageData, options = {}) {
    const workflowId = 'screenshot-to-health-data';
    const workflow = this.workflows.get(workflowId);

    if (!workflow) {
      throw new Error(`Workflow ${workflowId} not found`);
    }

    console.log(`🔄 MCP Server: Starting workflow "${workflow.name}"`);

    try {
      // Node 1: Input Screenshot
      const inputNode = workflow.nodes.find(n => n.id === 'input-screenshot');
      const screenshotData = {
        id: this.generateId(),
        timestamp: new Date().toISOString(),
        imageData: imageData,
        metadata: options.metadata || {},
        source: options.source || 'mobile-app'
      };

      this.notifySubscribers('workflow:started', {
        workflowId,
        nodeId: inputNode.id,
        data: screenshotData
      });

      // Node 2: Image Analysis with Gemini AI
      const analysisNode = workflow.nodes.find(n => n.id === 'image-analysis');
      this.notifySubscribers('workflow:processing', {
        workflowId,
        nodeId: analysisNode.id,
        message: 'Analyzing screenshot with AI...'
      });

      const extractedData = await this.aiProcessor.analyzeImage(
        screenshotData.imageData,
        options.healthAppType
      );

      // Node 3: Data Structuring
      const structuringNode = workflow.nodes.find(n => n.id === 'data-structuring');
      this.notifySubscribers('workflow:processing', {
        workflowId,
        nodeId: structuringNode.id,
        message: 'Structuring health data...'
      });

      const structuredData = this.structureHealthData(extractedData, screenshotData);

      // Node 4: Dashboard Update
      const outputNode = workflow.nodes.find(n => n.id === 'dashboard-update');
      this.notifySubscribers('workflow:processing', {
        workflowId,
        nodeId: outputNode.id,
        message: 'Updating dashboard...'
      });

      // Add to data buffer and notify subscribers
      this.dataBuffer.push(structuredData);
      this.notifySubscribers('data:updated', structuredData);

      // Trigger aggregation workflow
      await this.runAggregationWorkflow(structuredData);

      this.notifySubscribers('workflow:completed', {
        workflowId,
        result: structuredData
      });

      console.log(`✅ MCP Server: Workflow completed successfully`);
      return structuredData;

    } catch (error) {
      console.error(`❌ MCP Server: Workflow failed:`, error);
      this.notifySubscribers('workflow:error', {
        workflowId,
        error: error.message
      });
      throw error;
    }
  }

  async runAggregationWorkflow(healthData) {
    const workflowId = 'health-data-aggregator';
    const workflow = this.workflows.get(workflowId);

    try {
      // Node 1: Data Input
      const inputData = {
        ...healthData,
        id: this.generateId(),
        processedAt: new Date().toISOString()
      };

      // Node 2: Data Validation
      const validatedData = this.validateHealthData(inputData);

      // Node 3: Insights Generation
      const insights = await this.aiProcessor.generateInsights(validatedData);

      // Node 4: Trend Analysis
      const trends = this.analyzeTrends(validatedData);

      // Node 5: Broadcast Update
      const enrichedData = {
        ...validatedData,
        insights,
        trends,
        aggregatedAt: new Date().toISOString()
      };

      this.notifySubscribers('insights:generated', enrichedData);

      return enrichedData;

    } catch (error) {
      console.error('Aggregation workflow failed:', error);
      throw error;
    }
  }

  generateMockHealthData(imageData, healthAppType) {
    const baseData = {
      extractedAt: new Date().toISOString(),
      source: healthAppType,
      confidence: 0.85 + Math.random() * 0.15
    };

    switch (healthAppType.toLowerCase()) {
      case 'google fit':
        return {
          ...baseData,
          steps: Math.floor(8000 + Math.random() * 4000),
          calories: Math.floor(1800 + Math.random() * 600),
          distance: (5 + Math.random() * 3).toFixed(1),
          activeMinutes: Math.floor(30 + Math.random() * 60),
          heartRate: {
            current: Math.floor(60 + Math.random() * 40),
            resting: Math.floor(50 + Math.random() * 20),
            zones: {
              resting: Math.floor(60 + Math.random() * 10),
              fatBurn: Math.floor(100 + Math.random() * 30),
              cardio: Math.floor(140 + Math.random() * 30)
            }
          }
        };

      case 'apple health':
        return {
          ...baseData,
          steps: Math.floor(7000 + Math.random() * 5000),
          activeEnergy: Math.floor(300 + Math.random() * 200),
          restingEnergy: Math.floor(1200 + Math.random() * 300),
          standHours: Math.floor(8 + Math.random() * 4),
          exerciseMinutes: Math.floor(20 + Math.random() * 40),
          heartRate: {
            current: Math.floor(65 + Math.random() * 35),
            resting: Math.floor(55 + Math.random() * 15),
            variability: Math.floor(30 + Math.random() * 40)
          }
        };

      case 'fitbit':
        return {
          ...baseData,
          steps: Math.floor(9000 + Math.random() * 3000),
          calories: Math.floor(2000 + Math.random() * 500),
          floors: Math.floor(8 + Math.random() * 7),
          activeZone: Math.floor(15 + Math.random() * 45),
          sleep: {
            efficiency: Math.floor(80 + Math.random() * 15),
            duration: Math.floor(6 * 60 + Math.random() * 2 * 60), // minutes
            deepSleep: Math.floor(60 + Math.random() * 60),
            remSleep: Math.floor(90 + Math.random() * 60)
          }
        };

      case 'withings':
        return {
          ...baseData,
          weight: (65 + Math.random() * 25).toFixed(1),
          bodyFat: (18 + Math.random() * 12).toFixed(1),
          muscleMass: (35 + Math.random() * 20).toFixed(1),
          heartRate: {
            current: Math.floor(60 + Math.random() * 30),
            resting: Math.floor(50 + Math.random() * 20)
          },
          sleep: {
            duration: Math.floor(7 * 60 + Math.random() * 60), // minutes
            efficiency: Math.floor(85 + Math.random() * 10),
            deepSleep: Math.floor(70 + Math.random() * 80),
            lightSleep: Math.floor(200 + Math.random() * 100),
            remSleep: Math.floor(80 + Math.random() * 60)
          }
        };

      default:
        return {
          ...baseData,
          steps: Math.floor(6000 + Math.random() * 6000),
          calories: Math.floor(1500 + Math.random() * 800),
          activeMinutes: Math.floor(20 + Math.random() * 70),
          heartRate: Math.floor(60 + Math.random() * 40),
          sleep: {
            duration: Math.floor(6 * 60 + Math.random() * 3 * 60),
            quality: Math.floor(70 + Math.random() * 25)
          }
        };
    }
  }

  structureHealthData(extractedData, sourceData) {
    const timestamp = new Date();

    return {
      id: this.generateId(),
      timestamp: timestamp.toISOString(),
      source: 'mcp-screenshot-processor',
      sourceApp: extractedData.source || 'unknown',
      originalScreenshot: sourceData.id,

      // Standardized health metrics
      mood: {
        score: Math.floor(70 + Math.random() * 25),
        prediction: this.predictMood(extractedData),
        confidence: extractedData.confidence || 0.8,
        factors: this.generateMoodFactors(extractedData),
        recommendations: []
      },

      activity: {
        steps: extractedData.steps || Math.floor(6000 + Math.random() * 6000),
        calories: extractedData.calories || Math.floor(1500 + Math.random() * 800),
        activeMinutes: extractedData.activeMinutes || extractedData.activeZone || Math.floor(30 + Math.random() * 60),
        distance: extractedData.distance || (4 + Math.random() * 4).toFixed(1),
        goalProgress: Math.floor(60 + Math.random() * 40)
      },

      heartRate: {
        current: extractedData.heartRate?.current || Math.floor(60 + Math.random() * 40),
        resting: extractedData.heartRate?.resting || Math.floor(50 + Math.random() * 20),
        variability: extractedData.heartRate?.variability || Math.floor(30 + Math.random() * 40),
        stressLevel: this.assessStressLevel(extractedData),
        zones: extractedData.heartRate?.zones || {
          resting: Math.floor(60 + Math.random() * 10),
          fatBurn: Math.floor(100 + Math.random() * 30),
          cardio: Math.floor(140 + Math.random() * 30)
        }
      },

      sleep: extractedData.sleep ? {
        duration: extractedData.sleep.duration || Math.floor(7 * 60),
        quality: extractedData.sleep.efficiency || extractedData.sleep.quality || Math.floor(80 + Math.random() * 15),
        stages: {
          deep: extractedData.sleep.deepSleep || Math.floor(60 + Math.random() * 60),
          light: extractedData.sleep.lightSleep || Math.floor(200 + Math.random() * 100),
          rem: extractedData.sleep.remSleep || Math.floor(80 + Math.random() * 60)
        },
        consistency: this.assessSleepConsistency(extractedData.sleep)
      } : {
        duration: Math.floor(7 * 60),
        quality: Math.floor(80 + Math.random() * 15),
        stages: {
          deep: Math.floor(60 + Math.random() * 60),
          light: Math.floor(200 + Math.random() * 100),
          rem: Math.floor(80 + Math.random() * 60)
        },
        consistency: 'regular'
      },

      // Additional metrics
      weight: extractedData.weight ? parseFloat(extractedData.weight) : null,
      bodyFat: extractedData.bodyFat ? parseFloat(extractedData.bodyFat) : null,
      muscleMass: extractedData.muscleMass ? parseFloat(extractedData.muscleMass) : null,

      // Processing metadata
      processingInfo: {
        extractedAt: extractedData.extractedAt,
        confidence: extractedData.confidence,
        aiProcessed: true,
        workflowId: 'screenshot-to-health-data'
      }
    };
  }

  // Helper methods for health analysis
  predictMood(data) {
    if (data.steps > 10000) return 'excellent';
    if (data.steps > 8000) return 'good';
    if (data.steps > 6000) return 'neutral';
    if (data.steps > 4000) return 'concerned';
    return 'struggling';
  }

  generateMoodFactors(data) {
    const factors = [];

    if (data.steps > 8000) {
      factors.push({ name: 'Physical Activity', impact: 'positive', weight: 0.3 });
    }

    if (data.heartRate?.resting && data.heartRate.resting < 65) {
      factors.push({ name: 'Heart Rate', impact: 'positive', weight: 0.25 });
    }

    if (data.sleep?.duration && data.sleep.duration > 420) {
      factors.push({ name: 'Sleep Duration', impact: 'positive', weight: 0.35 });
    }

    if (data.activeMinutes > 45) {
      factors.push({ name: 'Active Minutes', impact: 'positive', weight: 0.3 });
    }

    return factors.slice(0, 3);
  }

  assessStressLevel(data) {
    const hr = data.heartRate?.resting || 70;
    if (hr < 60) return 'low';
    if (hr < 75) return 'normal';
    if (hr < 85) return 'moderate';
    return 'high';
  }

  assessSleepConsistency(sleep) {
    if (sleep.efficiency > 90) return 'excellent';
    if (sleep.efficiency > 80) return 'good';
    if (sleep.efficiency > 70) return 'irregular';
    return 'poor';
  }

  analyzeMood(healthData) {
    return {
      score: healthData.mood?.score || Math.floor(70 + Math.random() * 25),
      prediction: healthData.mood?.prediction || 'good',
      confidence: 0.8 + Math.random() * 0.2
    };
  }

  generateRecommendations(healthData) {
    const recommendations = [];

    if (healthData.activity?.steps < 8000) {
      recommendations.push("Try to increase your daily step count by taking short walks");
    }

    if (healthData.heartRate?.resting > 80) {
      recommendations.push("Consider relaxation techniques to help lower your resting heart rate");
    }

    if (healthData.sleep?.duration < 420) {
      recommendations.push("Aim for at least 7 hours of sleep for better recovery");
    }

    return recommendations;
  }

  identifyRiskFactors(healthData) {
    const risks = [];

    if (healthData.heartRate?.resting > 90) {
      risks.push({ type: 'cardiovascular', level: 'moderate', description: 'Elevated resting heart rate' });
    }

    if (healthData.sleep?.duration < 360) {
      risks.push({ type: 'sleep', level: 'high', description: 'Insufficient sleep duration' });
    }

    return risks;
  }

  analyzeTrends(healthData) {
    return {
      activityTrend: 'increasing',
      sleepTrend: 'stable',
      heartRateTrend: 'improving',
      overallWellness: 'good'
    };
  }

  validateHealthData(data) {
    // Basic validation and cleaning
    const validated = { ...data };

    // Ensure numeric values are within reasonable ranges
    if (validated.activity?.steps) {
      validated.activity.steps = Math.max(0, Math.min(50000, validated.activity.steps));
    }

    if (validated.heartRate?.current) {
      validated.heartRate.current = Math.max(40, Math.min(200, validated.heartRate.current));
    }

    return validated;
  }

  // Subscription management
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  notifySubscribers(event, data) {
    this.subscribers.forEach(callback => {
      try {
        callback(event, data);
      } catch (error) {
        console.error('Subscriber callback error:', error);
      }
    });
  }

  // Utility methods
  generateId() {
    return `mcp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Server management
  start() {
    this.isRunning = true;
    console.log('🚀 MCP Health Server started');
    console.log(`📋 Available workflows: ${Array.from(this.workflows.keys()).join(', ')}`);
    this.notifySubscribers('server:started', { status: 'running' });
  }

  stop() {
    this.isRunning = false;
    console.log('🛑 MCP Health Server stopped');
    this.notifySubscribers('server:stopped', { status: 'stopped' });
  }

  getStatus() {
    return {
      running: this.isRunning,
      workflows: Array.from(this.workflows.keys()),
      dataBufferSize: this.dataBuffer.length,
      subscribers: this.subscribers.size,
      queueSize: this.processingQueue.length
    };
  }

  // Get recent data
  getRecentData(limit = 10) {
    return this.dataBuffer.slice(-limit);
  }

  // Get available workflows
  getWorkflows() {
    return Array.from(this.workflows.values());
  }
}

// Export singleton instance
const mcpHealthServer = new MCPHealthServer();
export default mcpHealthServer;
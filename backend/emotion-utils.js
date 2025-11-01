/**
 * Emotion Detection Utilities for Sakhi Client
 * Helper functions for processing emotion data and creating visualizations
 */

class EmotionUtils {
  constructor() {
    this.emotionColors = {
      'Sadness': '#4A90E2',
      'Joyful': '#F5A623',
      'Love': '#D0021B',
      'Anger': '#E85D75',
      'Fear': '#9013FE',
      'Surprise': '#50E3C2',
      'Happy': '#F5A623',
      'Neutral': '#9B9B9B',
      'uncertain': '#CCCCCC'
    };

    this.facialEmotionMapping = {
      'Angry': 'Anger',
      'Disgust': 'Fear',
      'Fear': 'Fear',
      'Happy': 'Joyful',
      'Neutral': 'uncertain',
      'Sad': 'Sadness',
      'Surprise': 'Surprise'
    };

    this.emotionIcons = {
      'Sadness': '😢',
      'Joyful': '😊',
      'Love': '❤️',
      'Anger': '😠',
      'Fear': '😨',
      'Surprise': '😲',
      'Happy': '😊',
      'Neutral': '😐',
      'uncertain': '🤔'
    };
  }

  /**
   * Get color for emotion
   */
  getEmotionColor(emotion) {
    return this.emotionColors[emotion] || '#CCCCCC';
  }

  /**
   * Get icon for emotion
   */
  getEmotionIcon(emotion) {
    return this.emotionIcons[emotion] || '🤔';
  }

  /**
   * Map facial emotion to text emotion
   */
  mapFacialToTextEmotion(facialEmotion) {
    return this.facialEmotionMapping[facialEmotion] || 'uncertain';
  }

  /**
   * Calculate emotion confidence score
   */
  calculateConfidenceScore(confidence) {
    if (confidence >= 0.8) return { level: 'high', color: '#4CAF50' };
    if (confidence >= 0.6) return { level: 'medium', color: '#FF9800' };
    return { level: 'low', color: '#F44336' };
  }

  /**
   * Process emotion data for charts
   */
  processEmotionDataForChart(emotionHistory) {
    const emotionCounts = {};
    const emotionData = [];

    emotionHistory.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
    });

    Object.keys(emotionCounts).forEach(emotion => {
      emotionData.push({
        emotion,
        count: emotionCounts[emotion],
        color: this.getEmotionColor(emotion),
        icon: this.getEmotionIcon(emotion)
      });
    });

    return emotionData.sort((a, b) => b.count - a.count);
  }

  /**
   * Create time series data for emotion trends
   */
  createEmotionTimeSeries(emotionHistory, timeRange = '24h') {
    const now = new Date();
    let timeLimit;

    switch (timeRange) {
      case '1h':
        timeLimit = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case '24h':
        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        timeLimit = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      default:
        timeLimit = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    }

    const filteredData = emotionHistory.filter(
      entry => new Date(entry.timestamp) >= timeLimit
    );

    // Group by hour or day depending on time range
    const grouped = {};
    filteredData.forEach(entry => {
      const date = new Date(entry.timestamp);
      let key;

      if (timeRange === '1h') {
        key = date.getMinutes();
      } else if (timeRange === '24h') {
        key = date.getHours();
      } else {
        key = date.toISOString().split('T')[0]; // Date only
      }

      if (!grouped[key]) {
        grouped[key] = { time: key, emotions: {} };
      }

      grouped[key].emotions[entry.emotion] = (grouped[key].emotions[entry.emotion] || 0) + 1;
    });

    return Object.values(grouped).sort((a, b) => a.time - b.time);
  }

  /**
   * Generate emotion insights
   */
  generateEmotionInsights(emotionHistory) {
    if (emotionHistory.length === 0) {
      return {
        primaryEmotion: 'No data',
        emotionalStability: 'Unknown',
        recommendation: 'Start chatting to see emotion insights'
      };
    }

    const recentEmotions = emotionHistory.slice(-10); // Last 10 entries
    const emotionCounts = {};
    let totalConfidence = 0;

    recentEmotions.forEach(entry => {
      emotionCounts[entry.emotion] = (emotionCounts[entry.emotion] || 0) + 1;
      totalConfidence += entry.confidence;
    });

    const primaryEmotion = Object.keys(emotionCounts).reduce((a, b) =>
      emotionCounts[a] > emotionCounts[b] ? a : b
    );

    const avgConfidence = totalConfidence / recentEmotions.length;
    const uniqueEmotions = Object.keys(emotionCounts).length;

    let emotionalStability;
    if (uniqueEmotions <= 2 && avgConfidence > 0.7) {
      emotionalStability = 'Stable';
    } else if (uniqueEmotions <= 4) {
      emotionalStability = 'Moderate';
    } else {
      emotionalStability = 'Variable';
    }

    let recommendation;
    switch (primaryEmotion) {
      case 'Sadness':
        recommendation = 'Consider trying mood-boosting activities or talking to a friend';
        break;
      case 'Anger':
        recommendation = 'Practice deep breathing or take a short walk to calm down';
        break;
      case 'Fear':
        recommendation = 'Try mindfulness exercises or write down your worries';
        break;
      case 'Joyful':
        recommendation = 'Keep up the positive momentum! Share your joy with others';
        break;
      case 'Love':
        recommendation = 'Nurture your relationships and express gratitude';
        break;
      case 'Surprise':
        recommendation = 'Take time to process unexpected events and adjust';
        break;
      default:
        recommendation = 'Continue monitoring your emotional patterns';
    }

    return {
      primaryEmotion,
      emotionalStability,
      avgConfidence: avgConfidence.toFixed(2),
      uniqueEmotions,
      recommendation
    };
  }

  /**
   * Format emotion data for avatar expressions
   */
  formatForAvatar(emotionData) {
    const emotion = emotionData.emotion;
    const confidence = emotionData.confidence;

    // Map emotions to avatar blend shape weights
    const blendShapes = {
      'Sadness': {
        browDownLeft: confidence * 0.3,
        browDownRight: confidence * 0.3,
        eyeSquintLeft: confidence * 0.2,
        eyeSquintRight: confidence * 0.2,
        mouthFrown: confidence * 0.8,
        mouthShrugLower: confidence * 0.4
      },
      'Joyful': {
        mouthSmile: confidence * 0.9,
        mouthDimpleLeft: confidence * 0.6,
        mouthDimpleRight: confidence * 0.6,
        eyeSquintLeft: confidence * 0.3,
        eyeSquintRight: confidence * 0.3,
        cheekPuff: confidence * 0.2
      },
      'Love': {
        mouthSmile: confidence * 0.6,
        browDownLeft: confidence * 0.1,
        browDownRight: confidence * 0.1,
        eyeSquintLeft: confidence * 0.2,
        eyeSquintRight: confidence * 0.2
      },
      'Anger': {
        browDownLeft: confidence * 0.8,
        browDownRight: confidence * 0.8,
        eyeSquintLeft: confidence * 0.5,
        eyeSquintRight: confidence * 0.5,
        mouthFrown: confidence * 0.7,
        noseSneer: confidence * 0.3
      },
      'Fear': {
        browUpLeft: confidence * 0.6,
        browUpRight: confidence * 0.6,
        eyeWideLeft: confidence * 0.8,
        eyeWideRight: confidence * 0.8,
        mouthUpperDeepLeft: confidence * 0.4,
        mouthUpperDeepRight: confidence * 0.4
      },
      'Surprise': {
        browUpLeft: confidence * 0.7,
        browUpRight: confidence * 0.7,
        eyeWideLeft: confidence * 0.9,
        eyeWideRight: confidence * 0.9,
        jawOpen: confidence * 0.5,
        mouthPucker: confidence * 0.2
      }
    };

    return blendShapes[emotion] || {};
  }

  /**
   * Create emotion radar data
   */
  createEmotionRadarData(emotionHistory) {
    const emotionAverages = {};
    const emotionCounts = {};

    emotionHistory.forEach(entry => {
      if (!emotionAverages[entry.emotion]) {
        emotionAverages[entry.emotion] = 0;
        emotionCounts[entry.emotion] = 0;
      }
      emotionAverages[entry.emotion] += entry.confidence;
      emotionCounts[entry.emotion] += 1;
    });

    // Calculate averages
    Object.keys(emotionAverages).forEach(emotion => {
      emotionAverages[emotion] = emotionAverages[emotion] / emotionCounts[emotion];
    });

    // Ensure all emotions are present
    const allEmotions = ['Sadness', 'Joyful', 'Love', 'Anger', 'Fear', 'Surprise'];
    return allEmotions.map(emotion => ({
      emotion,
      value: emotionAverages[emotion] || 0,
      fullMark: 1
    }));
  }
}

module.exports = EmotionUtils;
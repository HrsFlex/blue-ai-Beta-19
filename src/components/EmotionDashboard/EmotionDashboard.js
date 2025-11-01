import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import './EmotionDashboard.css';

const EmotionDashboard = ({ userId }) => {
  const [emotionData, setEmotionData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [realtimeEmotion, setRealtimeEmotion] = useState(null);

  const emotionColors = {
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

  const emotionIcons = {
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

  useEffect(() => {
    fetchEmotionData();

    // Set up WebSocket for real-time updates
    const ws = new WebSocket('ws://localhost:5000');

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'emotion_update' || data.type === 'multimodal_emotion_update') {
        setRealtimeEmotion(data);
        // Refresh data after receiving real-time update
        setTimeout(fetchEmotionData, 1000);
      }
    };

    return () => {
      ws.close();
    };
  }, [userId, timeRange]);

  const fetchEmotionData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/emotion/dashboard?userId=${userId}&timeRange=${timeRange}`);
      setEmotionData(response.data.analytics);
      setError(null);
    } catch (err) {
      console.error('Error fetching emotion data:', err);
      setError('Failed to load emotion data');
    } finally {
      setLoading(false);
    }
  };

  const processTimeSeriesData = () => {
    if (!emotionData || !emotionData.recentEntries) return [];

    return emotionData.recentEntries.map((entry, index) => ({
      time: new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: entry.emotion,
      confidence: entry.confidence,
      multimodal: entry.multimodal
    })).reverse();
  };

  const processRadarData = () => {
    if (!emotionData || !emotionData.emotionDistribution) return [];

    return Object.keys(emotionColors).map(emotion => ({
      emotion,
      value: emotionData.emotionDistribution[emotion] || 0,
      fullMark: Math.max(...Object.values(emotionData.emotionDistribution || {}), 1)
    }));
  };

  const getEmotionInsights = () => {
    if (!emotionData) return null;

    const { primaryEmotion, multimodalPercentage, averageConfidence } = emotionData;

    let insights = [];

    // Primary emotion insight
    if (primaryEmotion && primaryEmotion !== 'uncertain') {
      insights.push({
        type: 'primary',
        icon: emotionIcons[primaryEmotion],
        text: `Your primary emotion is ${primaryEmotion.toLowerCase()}`,
        color: emotionColors[primaryEmotion]
      });
    }

    // Multimodal insight
    if (multimodalPercentage > 50) {
      insights.push({
        type: 'multimodal',
        icon: '🎭',
        text: `${multimodalPercentage}% of your emotions were detected through multiple inputs`,
        color: '#4CAF50'
      });
    }

    // Confidence insight
    const avgConf = Object.values(averageConfidence || {}).reduce((a, b) => a + b, 0) / Object.keys(averageConfidence || {}).length;
    if (avgConf > 0.7) {
      insights.push({
        type: 'confidence',
        icon: '🎯',
        text: 'High confidence in emotion detection',
        color: '#2196F3'
      });
    }

    return insights;
  };

  if (loading) {
    return (
      <div className="emotion-dashboard loading">
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Analyzing your emotions...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="emotion-dashboard error">
        <div className="error-message">
          <h3>⚠️ Unable to load emotion data</h3>
          <p>{error}</p>
          <button onClick={fetchEmotionData} className="retry-button">Try Again</button>
        </div>
      </div>
    );
  }

  const timeSeriesData = processTimeSeriesData();
  const radarData = processRadarData();
  const insights = getEmotionInsights();

  return (
    <div className="emotion-dashboard">
      <div className="dashboard-header">
        <h2>Emotion Analytics</h2>
        <div className="controls">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-selector"
          >
            <option value="1h">Last Hour</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
        </div>
      </div>

      {/* Real-time Emotion Indicator */}
      {realtimeEmotion && (
        <div className="realtime-emotion">
          <div className="realtime-indicator">
            <span className="live-dot"></span>
            <span>Live</span>
          </div>
          <div className="current-emotion">
            <span className="emotion-icon">{emotionIcons[realtimeEmotion.emotion]}</span>
            <span className="emotion-text">{realtimeEmotion.emotion}</span>
            <span className="confidence-score">
              {Math.round(realtimeEmotion.confidence * 100)}%
            </span>
            {realtimeEmotion.multimodal && (
              <span className="multimodal-badge">Multi-Modal</span>
            )}
          </div>
        </div>
      )}

      {/* Insights Section */}
      {insights && insights.length > 0 && (
        <div className="insights-section">
          <h3>Key Insights</h3>
          <div className="insights-grid">
            {insights.map((insight, index) => (
              <div key={index} className="insight-card" style={{ borderLeftColor: insight.color }}>
                <span className="insight-icon">{insight.icon}</span>
                <span className="insight-text">{insight.text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Overview */}
      <div className="stats-overview">
        <div className="stat-card">
          <h4>Total Entries</h4>
          <span className="stat-value">{emotionData.totalEntries}</span>
        </div>
        <div className="stat-card">
          <h4>Primary Emotion</h4>
          <span className="stat-value">
            {emotionIcons[emotionData.primaryEmotion]} {emotionData.primaryEmotion}
          </span>
        </div>
        <div className="stat-card">
          <h4>Multi-Modal</h4>
          <span className="stat-value">{emotionData.multimodalPercentage}%</span>
        </div>
        <div className="stat-card">
          <h4>Time Range</h4>
          <span className="stat-value">{timeRange}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Emotion Distribution Pie Chart */}
        <div className="chart-card">
          <h3>Emotion Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={Object.entries(emotionData.emotionDistribution || {}).map(([emotion, count]) => ({
                  name: emotion,
                  value: count,
                  color: emotionColors[emotion]
                }))}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${emotionIcons[name]} ${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {Object.entries(emotionData.emotionDistribution || {}).map(([emotion, count], index) => (
                  <Cell key={`cell-${index}`} fill={emotionColors[emotion]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Emotion Radar Chart */}
        <div className="chart-card">
          <h3>Emotion Pattern</h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={radarData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="emotion" />
              <PolarRadiusAxis angle={90} domain={[0, 'dataMax']} />
              <Radar
                name="Emotion Intensity"
                dataKey="value"
                stroke="#8884d8"
                fill="#8884d8"
                fillOpacity={0.6}
              />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Confidence Over Time */}
        {timeSeriesData.length > 0 && (
          <div className="chart-card full-width">
            <h3>Emotion Confidence Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 1]} />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="confidence"
                  stroke="#8884d8"
                  strokeWidth={2}
                  name="Confidence"
                  dot={{ fill: '#8884d8', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Recent Emotions Table */}
      {emotionData.recentEntries && emotionData.recentEntries.length > 0 && (
        <div className="recent-emotions">
          <h3>Recent Emotions</h3>
          <div className="emotions-table">
            <div className="table-header">
              <span>Time</span>
              <span>Emotion</span>
              <span>Confidence</span>
              <span>Modality</span>
            </div>
            <div className="table-body">
              {emotionData.recentEntries.slice(0, 10).map((entry, index) => (
                <div key={index} className="table-row">
                  <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
                  <span>
                    {emotionIcons[entry.emotion]} {entry.emotion}
                  </span>
                  <span>
                    <div className="confidence-bar">
                      <div
                        className="confidence-fill"
                        style={{
                          width: `${entry.confidence * 100}%`,
                          backgroundColor: emotionColors[entry.emotion]
                        }}
                      ></div>
                      <span className="confidence-text">{Math.round(entry.confidence * 100)}%</span>
                    </div>
                  </span>
                  <span>
                    {entry.multimodal ? (
                      <span className="multimodal-indicator">Multi-Modal</span>
                    ) : (
                      <span className="single-modal-indicator">Text</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmotionDashboard;
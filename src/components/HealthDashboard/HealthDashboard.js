import React, { useState, useEffect } from 'react';
import './HealthDashboard.css';
import HealthDataService from '../../services/HealthDataService';
import RealHealthDataService from '../../services/RealHealthDataService';
import HealthDataConnector from '../HealthDataConnector/HealthDataConnector';
import mcpHealthServer from '../../services/MCPHealthServer';

const HealthDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showConnector, setShowConnector] = useState(false);
  const [dataSource, setDataSource] = useState('mock'); // 'mock', 'real', or 'mcp'
  const [refreshing, setRefreshing] = useState(false);
  const [realDataAvailable, setRealDataAvailable] = useState(false);
  const [mcpDataAvailable, setMcpDataAvailable] = useState(false);

  useEffect(() => {
    loadHealthData();
    checkRealDataAvailability();

    // Subscribe to MCP server events
    const unsubscribeMCP = mcpHealthServer.subscribe((event, data) => {
      handleMCPEvent(event, data);
    });

    // Start MCP server
    mcpHealthServer.start();

    const interval = setInterval(loadHealthData, 60000); // Refresh every minute
    return () => {
      clearInterval(interval);
      unsubscribeMCP();
    };
  }, []);

  const checkRealDataAvailability = () => {
    const availableProviders = RealHealthDataService.getAvailableProviders();
    const connectedProviders = availableProviders.filter(p => p.connected);
    setRealDataAvailable(connectedProviders.length > 0);

    // Check MCP data availability
    const recentMCPData = mcpHealthServer.getRecentData(1);
    setMcpDataAvailable(recentMCPData.length > 0);
  };

  const handleMCPEvent = (event, data) => {
    console.log(`MCP Event: ${event}`, data);

    switch (event) {
      case 'data:updated':
        // Update dashboard with MCP processed data
        if (data.source === 'mcp-screenshot-processor') {
          setHealthData(data);
          setDataSource('mcp');
          setMcpDataAvailable(true);
          setError(null);
          setLoading(false);
        }
        break;
      case 'insights:generated':
        // Update with enriched data containing insights
        if (data.source === 'mcp-screenshot-processor') {
          setHealthData(data);
        }
        break;
      case 'workflow:error':
        console.error('MCP Workflow Error:', data.error);
        break;
    }
  };

  const loadHealthData = async () => {
    try {
      setRefreshing(true);

      let data;
      if (realDataAvailable) {
        // Load real health data
        data = await RealHealthDataService.getAllHealthData();
        setDataSource('real');
      } else {
        // Fall back to mock data
        data = await HealthDataService.getAllHealthData();
        setDataSource('mock');
      }

      setHealthData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load health data');
      console.error('Health data loading error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDataConnected = (data) => {
    console.log('Health data connected:', data);
    setRealDataAvailable(true);
    loadHealthData();
  };

  const handleConnectionError = (provider, error) => {
    console.error(`Connection error for ${provider}:`, error);
    setError(`Failed to connect to ${provider}: ${error.message}`);
  };

  const toggleDataSource = () => {
    // Cycle through: mock → real → mcp → mock
    switch (dataSource) {
      case 'mock':
        if (realDataAvailable) {
          setDataSource('real');
          loadHealthData();
        } else if (mcpDataAvailable) {
          setDataSource('mcp');
          // Use latest MCP data
          const recentData = mcpHealthServer.getRecentData(1);
          if (recentData.length > 0) {
            setHealthData(recentData[0]);
          }
        } else {
          setShowConnector(true);
        }
        break;
      case 'real':
        if (mcpDataAvailable) {
          setDataSource('mcp');
          // Use latest MCP data
          const recentData = mcpHealthServer.getRecentData(1);
          if (recentData.length > 0) {
            setHealthData(recentData[0]);
          }
        } else {
          setDataSource('mock');
          loadHealthData();
        }
        break;
      case 'mcp':
        setDataSource('mock');
        loadHealthData();
        break;
      default:
        setDataSource('mock');
        loadHealthData();
    }
  };

  const refreshData = async () => {
    await loadHealthData();
  };

  const getMoodColor = (prediction) => {
    const colors = {
      excellent: '#10b981',
      good: '#3b82f6',
      neutral: '#f59e0b',
      concerned: '#f97316',
      struggling: '#ef4444'
    };
    return colors[prediction] || '#6b7280';
  };

  const getMoodIcon = (prediction) => {
    const icons = {
      excellent: '😊',
      good: '🙂',
      neutral: '😐',
      concerned: '😟',
      struggling: '😢'
    };
    return icons[prediction] || '😐';
  };

  const renderOverviewCard = () => {
    if (!healthData) return null;

    const { mood } = healthData;
    return (
      <div className="metric-card mood-overview">
        <div className="card-header">
          <h3>Today's Mood Prediction</h3>
          <span className="refresh-icon" onClick={refreshData}>
            {refreshing ? '🔄' : '🔄'}
          </span>
        </div>
        <div className="mood-main">
          <div className="mood-emoji">{getMoodIcon(mood.prediction)}</div>
          <div className="mood-details">
            <div className="mood-score">{mood.score}/100</div>
            <div className="mood-prediction" style={{ color: getMoodColor(mood.prediction) }}>
              {mood.prediction.charAt(0).toUpperCase() + mood.prediction.slice(1)}
            </div>
            <div className="mood-confidence">Confidence: {Math.round(mood.confidence * 100)}%</div>
          </div>
        </div>
        <div className="mood-factors">
          <h4>Key Factors</h4>
          {mood.factors.slice(0, 3).map((factor, index) => (
            <div key={index} className="factor-item">
              <span className={`factor-indicator ${factor.impact}`}></span>
              <span className="factor-name">{factor.name}</span>
              <span className="factor-weight">{Math.round(factor.weight * 100)}%</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderSleepCard = () => {
    if (!healthData?.sleep) return null;

    const { sleep } = healthData;
    return (
      <div className="metric-card sleep-card">
        <div className="card-header">
          <h3>😴 Sleep Analysis</h3>
        </div>
        <div className="sleep-metrics">
          <div className="sleep-main">
            <div className="sleep-duration">
              <div className="metric-value">{Math.round(sleep.duration / 60 * 10) / 10}h</div>
              <div className="metric-label">Duration</div>
            </div>
            <div className="sleep-quality">
              <div className="metric-value">{sleep.quality}%</div>
              <div className="metric-label">Quality</div>
            </div>
          </div>

          <div className="sleep-stages">
            <h4>Sleep Stages</h4>
            <div className="stage-bar">
              <div className="stage deep" style={{ width: `${(sleep.stages.deep / sleep.duration) * 100}%` }}></div>
              <div className="stage light" style={{ width: `${(sleep.stages.light / sleep.duration) * 100}%` }}></div>
              <div className="stage rem" style={{ width: `${(sleep.stages.rem / sleep.duration) * 100}%` }}></div>
            </div>
            <div className="stage-legend">
              <span className="legend-item deep">Deep {Math.round(sleep.stages.deep)}min</span>
              <span className="legend-item light">Light {Math.round(sleep.stages.light)}min</span>
              <span className="legend-item rem">REM {Math.round(sleep.stages.rem)}min</span>
            </div>
          </div>

          <div className="sleep-consistency">
            <div className="consistency-badge {sleep.consistency}">
              Consistency: {sleep.consistency}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActivityCard = () => {
    if (!healthData?.activity) return null;

    const { activity } = healthData;
    return (
      <div className="metric-card activity-card">
        <div className="card-header">
          <h3>🏃 Physical Activity</h3>
        </div>
        <div className="activity-metrics">
          <div className="activity-main">
            <div className="steps-count">
              <div className="metric-value">{activity.steps.toLocaleString()}</div>
              <div className="metric-label">Steps</div>
            </div>
            <div className="calories-burned">
              <div className="metric-value">{activity.calories}</div>
              <div className="metric-label">Calories</div>
            </div>
            <div className="active-minutes">
              <div className="metric-value">{activity.activeMinutes}</div>
              <div className="metric-label">Active Min</div>
            </div>
          </div>

          <div className="goal-progress">
            <div className="progress-header">
              <span>Daily Goal</span>
              <span>{activity.goalProgress}%</span>
            </div>
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${activity.goalProgress}%` }}
              ></div>
            </div>
          </div>

          <div className="activity-details">
            <div className="detail-item">
              <span>Distance</span>
              <span>{activity.distance} km</span>
            </div>
            <div className="detail-item">
              <span>Exercise</span>
              <span>{activity.exerciseMinutes} min</span>
            </div>
            <div className="detail-item">
              <span>Floors</span>
              <span>{activity.floors}</span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderHeartRateCard = () => {
    if (!healthData?.heartRate) return null;

    const { heartRate } = healthData;
    return (
      <div className="metric-card heart-rate-card">
        <div className="card-header">
          <h3>❤️ Heart Rate</h3>
        </div>
        <div className="heart-rate-metrics">
          <div className="heart-rate-main">
            <div className="current-hr">
              <div className="metric-value">{heartRate.current}</div>
              <div className="metric-label">Current BPM</div>
            </div>
            <div className="resting-hr">
              <div className="metric-value">{heartRate.resting}</div>
              <div className="metric-label">Resting BPM</div>
            </div>
          </div>

          <div className="hr-variability">
            <div className="hrv-value">
              <span className="hrv-number">{heartRate.variability}</span>
              <span className="hrv-unit">ms</span>
            </div>
            <div className="hrv-label">Heart Rate Variability</div>
          </div>

          <div className="stress-level">
            <div className="stress-indicator">
              <div className={`stress-dot ${heartRate.stressLevel}`}></div>
              <span className="stress-text">
                Stress: {heartRate.stressLevel.charAt(0).toUpperCase() + heartRate.stressLevel.slice(1)}
              </span>
            </div>
          </div>

          <div className="hr-zones">
            <h4>Heart Rate Zones</h4>
            <div className="zones-list">
              <div className="zone-item">
                <span className="zone-name">Resting</span>
                <span className="zone-range">0-{heartRate.zones.resting}</span>
              </div>
              <div className="zone-item">
                <span className="zone-name">Fat Burn</span>
                <span className="zone-range">{heartRate.zones.resting}-{heartRate.zones.fatBurn}</span>
              </div>
              <div className="zone-item">
                <span className="zone-name">Cardio</span>
                <span className="zone-range">{heartRate.zones.fatBurn}-{heartRate.zones.cardio}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderScreenTimeCard = () => {
    if (!healthData?.screenTime) return null;

    const { screenTime } = healthData;
    const totalHours = Math.round(screenTime.total / 60 * 10) / 10;

    return (
      <div className="metric-card screen-time-card">
        <div className="card-header">
          <h3>📱 Screen Time</h3>
        </div>
        <div className="screen-time-metrics">
          <div className="screen-time-main">
            <div className="total-time">
              <div className="metric-value">{totalHours}h</div>
              <div className="metric-label">Total Today</div>
            </div>
            <div className="pickups">
              <div className="metric-value">{screenTime.pickups}</div>
              <div className="metric-label">Pickups</div>
            </div>
          </div>

          <div className="digital-wellness">
            <div className={`wellness-badge ${screenTime.digitalWellness}`}>
              {screenTime.digitalWellness === 'excellent' && '🟢 Excellent'}
              {screenTime.digitalWellness === 'good' && '🟡 Good'}
              {screenTime.digitalWellness === 'moderate' && '🟠 Moderate'}
              {screenTime.digitalWellness === 'needs_improvement' && '🔴 Needs Improvement'}
            </div>
          </div>

          <div className="screen-time-breakdown">
            <h4>Time by Category</h4>
            <div className="category-list">
              <div className="category-item">
                <div className="category-bar">
                  <div className="bar-fill social" style={{ width: `${(screenTime.social / screenTime.total) * 100}%` }}></div>
                </div>
                <span className="category-name">Social</span>
                <span className="category-time">{Math.round(screenTime.social / 60)}h {screenTime.social % 60}min</span>
              </div>
              <div className="category-item">
                <div className="category-bar">
                  <div className="bar-fill productivity" style={{ width: `${(screenTime.productivity / screenTime.total) * 100}%` }}></div>
                </div>
                <span className="category-name">Productivity</span>
                <span className="category-time">{Math.round(screenTime.productivity / 60)}h {screenTime.productivity % 60}min</span>
              </div>
              <div className="category-item">
                <div className="category-bar">
                  <div className="bar-fill entertainment" style={{ width: `${(screenTime.entertainment / screenTime.total) * 100}%` }}></div>
                </div>
                <span className="category-name">Entertainment</span>
                <span className="category-time">{Math.round(screenTime.entertainment / 60)}h {screenTime.entertainment % 60}min</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderRecommendations = () => {
    if (!healthData?.mood?.recommendations) return null;

    return (
      <div className="metric-card recommendations-card">
        <div className="card-header">
          <h3>💡 Personalized Recommendations</h3>
        </div>
        <div className="recommendations-list">
          {healthData.mood.recommendations.map((rec, index) => (
            <div key={index} className="recommendation-item">
              <span className="recommendation-bullet">•</span>
              <span className="recommendation-text">{rec}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="health-dashboard loading">
        <div className="loading-spinner">🔄</div>
        <p>Loading health data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="health-dashboard error">
        <div className="error-icon">⚠️</div>
        <h3>Health Data Unavailable</h3>
        <p>{error}</p>
        <button onClick={refreshData} className="retry-button">Retry</button>
      </div>
    );
  }

  return (
    <div className="health-dashboard">
      <div className="dashboard-header">
        <h2>🏥 Health Dashboard</h2>
        <p>Real-time health metrics and mood prediction analysis</p>
        <div className="data-controls">
          <div className="data-source-toggle">
            <button
              className={`toggle-btn ${dataSource === 'real' || dataSource === 'mcp' ? 'active' : ''}`}
              onClick={toggleDataSource}
            >
              {dataSource === 'mcp' ? '🤖 AI Processed' : dataSource === 'real' ? '🟢 Real Data' : '🟡 Mock Data'}
            </button>
            {dataSource === 'real' && (
              <span className="connection-indicator">
                {realDataAvailable ? '✅ Connected' : '🔌 Not Connected'}
              </span>
            )}
            {dataSource === 'mcp' && (
              <span className="connection-indicator">
                {mcpDataAvailable ? '🤖 MCP Active' : '⚡ Ready'}
              </span>
            )}
          </div>
          <button className="refresh-btn" onClick={refreshData}>
            {refreshing ? '🔄 Refreshing...' : '🔄 Refresh'}
          </button>
        </div>
        <div className="last-updated">
          Last updated: {new Date(healthData?.lastUpdated).toLocaleString()}
        </div>
      </div>

      <div className="dashboard-grid">
        {renderOverviewCard()}
        {renderSleepCard()}
        {renderActivityCard()}
        {renderHeartRateCard()}
        {renderScreenTimeCard()}
        {renderRecommendations()}
      </div>

      <div className="dashboard-footer">
        <div className="data-sources">
          <h4>Data Sources</h4>
          <div className="source-list">
            <div className="source-item">
              <span className="source-name">Mode:</span>
              <span className="source-description">
                {dataSource === 'mcp' ? 'AI-processed data from mobile app screenshots' :
                 dataSource === 'real' ? 'Real-time data from connected apps' : 'Simulated demo data'}
              </span>
            </div>
            {dataSource === 'mcp' && mcpDataAvailable && (
              <div className="source-item">
                <span className="source-name">AI Processing:</span>
                <span className="source-description">
                  Screenshot analysis with workflow automation
                </span>
              </div>
            )}
            {dataSource === 'real' && realDataAvailable && (
              <div className="source-item">
                <span className="source-name">Connected Apps:</span>
                <span className="source-description">
                  Real-time synchronization active
                </span>
              </div>
            )}
            {Object.entries(healthData?.dataSources || {}).map(([source, description]) => (
              <div key={source} className="source-item">
                <span className="source-name">{source.charAt(0).toUpperCase() + source.slice(1)}:</span>
                <span className="source-description">{description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Health Data Connector Modal */}
      {showConnector && (
        <div className="modal-overlay">
          <div className="modal-content">
            <HealthDataConnector
              onDataConnected={handleDataConnected}
              onConnectionError={handleConnectionError}
            />
            <button
              className="close-connector-btn"
              onClick={() => setShowConnector(false)}
            >
              ✕ Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default HealthDashboard;
import React, { useState, useEffect } from 'react';
import './HealthDataConnector.css';
import realHealthDataService from '../../services/RealHealthDataService';

const HealthDataConnector = ({ onDataConnected, onConnectionError }) => {
  const [availableProviders, setAvailableProviders] = useState([]);
  const [connectingProvider, setConnectingProvider] = useState(null);
  const [connectedProviders, setConnectedProviders] = useState(new Set());
  const [showCustomAPI, setShowCustomAPI] = useState(false);
  const [customAPI, setCustomAPI] = useState({
    name: '',
    endpoint: '',
    apiKey: '',
    authType: 'api_key'
  });
  const [connectionStatus, setConnectionStatus] = useState({});

  useEffect(() => {
    // Initialize service and load providers
    realHealthDataService.addListener(handleDataUpdate);
    loadProviders();
    checkExistingConnections();

    return () => {
      realHealthDataService.removeListener(handleDataUpdate);
    };
  }, []);

  const handleDataUpdate = (provider, data) => {
    if (provider === 'disconnected') {
      setConnectedProviders(prev => {
        const newSet = new Set(prev);
        newSet.delete(data.provider);
        return newSet;
      });
      setConnectionStatus(prev => ({
        ...prev,
        [data.provider]: { status: 'disconnected', message: 'Disconnected' }
      }));
    } else {
      setConnectedProviders(prev => new Set(prev).add(provider));
      setConnectionStatus(prev => ({
        ...prev,
        [provider]: { status: 'connected', message: 'Connected successfully' }
      }));
      if (onDataConnected) {
        onDataConnected(data);
      }
    }
  };

  const loadProviders = () => {
    const providers = realHealthDataService.getAvailableProviders();
    setAvailableProviders(providers);
  };

  const checkExistingConnections = () => {
    // Check for OAuth callbacks in URL
    const urlParams = new URLSearchParams(window.location.search);

    // Handle Google Fit callback
    const googleCode = urlParams.get('code');
    const googleState = urlParams.get('state');
    if (googleCode && googleState) {
      handleGoogleFitCallback(googleCode, googleState);
      return;
    }

    // Handle Strava callback
    const stravaCode = urlParams.get('code');
    const stravaState = urlParams.get('state');
    if (stravaCode && window.location.href.includes('strava')) {
      handleStravaCallback(stravaCode, stravaState);
      return;
    }

    // Handle Withings callback
    const withingsCode = urlParams.get('code');
    if (withingsCode && window.location.href.includes('withings')) {
      handleWithingsCallback(withingsCode);
      return;
    }

    // Clean up URL
    if (googleCode || stravaCode || withingsCode) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  };

  const handleGoogleFitCallback = async (code, state) => {
    try {
      setConnectingProvider('googleFit');
      setConnectionStatus(prev => ({
        ...prev,
        googleFit: { status: 'connecting', message: 'Connecting to Google Fit...' }
      }));

      await realHealthDataService.handleGoogleFitCallback(code, state);
    } catch (error) {
      console.error('Google Fit connection failed:', error);
      setConnectionStatus(prev => ({
        ...prev,
        googleFit: { status: 'error', message: error.message }
      }));
      if (onConnectionError) {
        onConnectionError('googleFit', error);
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleStravaCallback = async (code, state) => {
    try {
      setConnectingProvider('strava');
      setConnectionStatus(prev => ({
        ...prev,
        strava: { status: 'connecting', message: 'Connecting to Strava...' }
      }));

      await realHealthDataService.handleStravaCallback(code, state);
    } catch (error) {
      console.error('Strava connection failed:', error);
      setConnectionStatus(prev => ({
        ...prev,
        strava: { status: 'error', message: error.message }
      }));
      if (onConnectionError) {
        onConnectionError('strava', error);
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const handleWithingsCallback = async (code) => {
    try {
      setConnectingProvider('withings');
      setConnectionStatus(prev => ({
        ...prev,
        withings: { status: 'connecting', message: 'Connecting to Withings...' }
      }));

      await realHealthDataService.handleWithingsCallback(code);
    } catch (error) {
      console.error('Withings connection failed:', error);
      setConnectionStatus(prev => ({
        ...prev,
        withings: { status: 'error', message: error.message }
      }));
      if (onConnectionError) {
        onConnectionError('withings', error);
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const connectProvider = async (providerId) => {
    try {
      setConnectingProvider(providerId);
      setConnectionStatus(prev => ({
        ...prev,
        [providerId]: { status: 'connecting', message: `Connecting to ${availableProviders.find(p => p.id === providerId)?.name}...` }
      }));

      switch (providerId) {
        case 'googleFit':
          await realHealthDataService.connectGoogleFit();
          break;
        case 'strava':
          await realHealthDataService.connectStrava();
          break;
        case 'withings':
          await realHealthDataService.connectWithings();
          break;
        default:
          throw new Error('Unknown provider');
      }
    } catch (error) {
      console.error(`Failed to connect to ${providerId}:`, error);
      setConnectionStatus(prev => ({
        ...prev,
        [providerId]: { status: 'error', message: error.message }
      }));
      if (onConnectionError) {
        onConnectionError(providerId, error);
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const disconnectProvider = async (providerId) => {
    try {
      await realHealthDataService.disconnectProvider(providerId);
    } catch (error) {
      console.error(`Failed to disconnect from ${providerId}:`, error);
    }
  };

  const connectCustomAPI = async () => {
    if (!customAPI.name || !customAPI.endpoint || !customAPI.apiKey) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setConnectingProvider('custom');
      setConnectionStatus(prev => ({
        ...prev,
        custom: { status: 'connecting', message: 'Connecting to custom API...' }
      }));

      await realHealthDataService.connectWebAPI(customAPI);
      setCustomAPI({ name: '', endpoint: '', apiKey: '', authType: 'api_key' });
      setShowCustomAPI(false);
    } catch (error) {
      console.error('Custom API connection failed:', error);
      setConnectionStatus(prev => ({
        ...prev,
        custom: { status: 'error', message: error.message }
      }));
      if (onConnectionError) {
        onConnectionError('custom', error);
      }
    } finally {
      setConnectingProvider(null);
    }
  };

  const getStatusIcon = (providerId) => {
    const status = connectionStatus[providerId];
    switch (status?.status) {
      case 'connecting':
        return '⏳';
      case 'connected':
        return '✅';
      case 'error':
        return '❌';
      case 'disconnected':
        return '🔌';
      default:
        return '🔌';
    }
  };

  const getStatusColor = (providerId) => {
    const status = connectionStatus[providerId];
    switch (status?.status) {
      case 'connecting':
        return '#f59e0b';
      case 'connected':
        return '#10b981';
      case 'error':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const getProviderIcon = (providerId) => {
    const icons = {
      googleFit: '🏃‍♂️',
      strava: '🚴‍♀️',
      withings: '⚖️',
      custom: '🔗'
    };
    return icons[providerId] || '📊';
  };

  return (
    <div className="health-data-connector">
      <div className="connector-header">
        <h2>🏥 Connect Health Data</h2>
        <p>Connect your fitness and health apps to see real-time data in your dashboard</p>
      </div>

      <div className="providers-section">
        <h3>Available Health Providers</h3>
        <div className="providers-grid">
          {availableProviders.map(provider => (
            <div key={provider.id} className="provider-card">
              <div className="provider-header">
                <div className="provider-icon">
                  {getProviderIcon(provider.id)}
                </div>
                <div className="provider-info">
                  <h4>{provider.name}</h4>
                  <p>
                    {provider.id === 'googleFit' && 'Connect your Google Fit account for steps, heart rate, and activity data'}
                    {provider.id === 'strava' && 'Connect your Strava account for workouts and activities'}
                    {provider.id === 'withings' && 'Connect your Withings account for sleep, weight, and health metrics'}
                  </p>
                </div>
                <div className="provider-status" style={{ color: getStatusColor(provider.id) }}>
                  <span className="status-icon">{getStatusIcon(provider.id)}</span>
                  <span className="status-text">
                    {connectionStatus[provider.id]?.message || 'Not connected'}
                  </span>
                </div>
              </div>
              <div className="provider-actions">
                {connectedProviders.has(provider.id) ? (
                  <button
                    className="disconnect-btn"
                    onClick={() => disconnectProvider(provider.id)}
                    disabled={connectingProvider === provider.id}
                  >
                    Disconnect
                  </button>
                ) : (
                  <button
                    className="connect-btn"
                    onClick={() => connectProvider(provider.id)}
                    disabled={connectingProvider === provider.id}
                  >
                    {connectingProvider === provider.id ? 'Connecting...' : 'Connect'}
                  </button>
                )}
              </div>
            </div>
          ))}

          {/* Custom API Provider */}
          <div className="provider-card custom-api-card">
            <div className="provider-header">
              <div className="provider-icon">
                {getProviderIcon('custom')}
              </div>
              <div className="provider-info">
                <h4>Custom Health API</h4>
                <p>Connect to any custom health data API or fitness tracking service</p>
              </div>
              <div className="provider-status" style={{ color: getStatusColor('custom') }}>
                <span className="status-icon">{getStatusIcon('custom')}</span>
                <span className="status-text">
                  {connectionStatus.custom?.message || 'Not connected'}
                </span>
              </div>
            </div>
            <div className="provider-actions">
              <button
                className="connect-btn"
                onClick={() => setShowCustomAPI(true)}
                disabled={connectingProvider === 'custom'}
              >
                {connectingProvider === 'custom' ? 'Connecting...' : 'Configure'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom API Modal */}
      {showCustomAPI && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Configure Custom Health API</h3>
              <button
                className="close-btn"
                onClick={() => setShowCustomAPI(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="api-name">API Name *</label>
                <input
                  id="api-name"
                  type="text"
                  value={customAPI.name}
                  onChange={(e) => setCustomAPI(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="My Health Tracker API"
                />
              </div>
              <div className="form-group">
                <label htmlFor="api-endpoint">API Endpoint *</label>
                <input
                  id="api-endpoint"
                  type="url"
                  value={customAPI.endpoint}
                  onChange={(e) => setCustomAPI(prev => ({ ...prev, endpoint: e.target.value }))}
                  placeholder="https://api.myhealthtracker.com"
                />
              </div>
              <div className="form-group">
                <label htmlFor="api-key">API Key *</label>
                <input
                  id="api-key"
                  type="password"
                  value={customAPI.apiKey}
                  onChange={(e) => setCustomAPI(prev => ({ ...prev, apiKey: e.target.value }))}
                  placeholder="your-api-key-here"
                />
              </div>
              <div className="form-group">
                <label htmlFor="auth-type">Authentication Type</label>
                <select
                  id="auth-type"
                  value={customAPI.authType}
                  onChange={(e) => setCustomAPI(prev => ({ ...prev, authType: e.target.value }))}
                >
                  <option value="api_key">API Key</option>
                  <option value="bearer">Bearer Token</option>
                  <option value="basic">Basic Auth</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="cancel-btn"
                onClick={() => setShowCustomAPI(false)}
              >
                Cancel
              </button>
              <button
                className="connect-btn"
                onClick={connectCustomAPI}
                disabled={connectingProvider === 'custom'}
              >
                {connectingProvider === 'custom' ? 'Connecting...' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="connection-summary">
        <h3>Connection Summary</h3>
        <div className="summary-stats">
          <div className="stat-item">
            <span className="stat-value">{connectedProviders.size}</span>
            <span className="stat-label">Connected Providers</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{availableProviders.length}</span>
            <span className="stat-label">Available Providers</span>
          </div>
        </div>
        {connectedProviders.size > 0 && (
          <div className="connected-list">
            <h4>Active Connections:</h4>
            <ul>
              {Array.from(connectedProviders).map(providerId => {
                const provider = availableProviders.find(p => p.id === providerId);
                return (
                  <li key={providerId}>
                    {getProviderIcon(providerId)} {provider?.name || providerId}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>

      <div className="help-section">
        <h3>📚 Help & Information</h3>
        <div className="help-content">
          <div className="help-item">
            <h4>🔒 Privacy & Security</h4>
            <p>Your health data is encrypted and transmitted securely. We only read the data necessary for wellness tracking.</p>
          </div>
          <div className="help-item">
            <h4>📊 What data is collected?</h4>
            <p>Steps, heart rate, sleep patterns, weight, and workout activities are synchronized to provide personalized insights.</p>
          </div>
          <div className="help-item">
            <h4>🔧 Need help?</h4>
            <p>Check the documentation for each provider or contact support for assistance with API setup.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthDataConnector;
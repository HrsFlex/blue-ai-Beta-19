import React, { useState, useRef } from 'react';
import './ScreenshotProcessor.css';
import mcpHealthServer from '../../services/MCPHealthServer';

const ScreenshotProcessor = ({ onDataProcessed, onError }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [workflowStatus, setWorkflowStatus] = useState('idle');
  const [selectedApp, setSelectedApp] = useState('generic');
  const [uploadedImage, setUploadedImage] = useState(null);
  const [processingLog, setProcessingLog] = useState([]);
  const [recentScreenshots, setRecentScreenshots] = useState([]);
  const fileInputRef = useRef(null);

  // Available health apps
  const healthApps = [
    { id: 'google-fit', name: 'Google Fit', icon: '🏃‍♂️' },
    { id: 'apple-health', name: 'Apple Health', icon: '🍎' },
    { id: 'fitbit', name: 'Fitbit', icon: '⌚' },
    { id: 'withings', name: 'Withings', icon: '⚖️' },
    { id: 'garmin', name: 'Garmin Connect', icon: '📱' },
    { id: 'samsung-health', name: 'Samsung Health', icon: '📱' },
    { id: 'xiaomi-mi-fit', name: 'Xiaomi Mi Fit', icon: '⌚' },
    { id: 'generic', name: 'Generic Health App', icon: '📊' }
  ];

  React.useEffect(() => {
    // Subscribe to MCP server events
    const unsubscribe = mcpHealthServer.subscribe((event, data) => {
      handleMCPEvent(event, data);
    });

    // Start MCP server
    mcpHealthServer.start();

    // Load recent screenshots from localStorage
    loadRecentScreenshots();

    return () => {
      unsubscribe();
    };
  }, []);

  const handleMCPEvent = (event, data) => {
    addLogEntry(event, data);

    switch (event) {
      case 'workflow:started':
        setWorkflowStatus('🚀 Starting AI Vision analysis...');
        break;
      case 'workflow:processing':
        // Show more specific processing status
        if (data.message) {
          if (data.message.includes('AI')) {
            setWorkflowStatus('🤖 ' + data.message);
          } else if (data.message.includes('Analyzing')) {
            setWorkflowStatus('🔍 ' + data.message);
          } else if (data.message.includes('structuring')) {
            setWorkflowStatus('📊 ' + data.message);
          } else {
            setWorkflowStatus('⚙️ ' + data.message);
          }
        }
        break;
      case 'workflow:completed':
        setWorkflowStatus('✅ Analysis complete!');
        if (onDataProcessed) {
          onDataProcessed(data.result);
        }
        break;
      case 'workflow:error':
        setWorkflowStatus('❌ Processing failed');
        if (onError) {
          onError(data.error);
        }
        break;
      case 'data:updated':
        // Update recent screenshots list
        if (data.source === 'mcp-screenshot-processor') {
          updateRecentScreenshots(data);
        }
        break;
    }
  };

  const addLogEntry = (event, data) => {
    const timestamp = new Date().toLocaleTimeString();
    setProcessingLog(prev => [
      ...prev,
      {
        timestamp,
        event,
        message: data.message || event,
        type: getEventType(event)
      }
    ]);
  };

  const getEventType = (event) => {
    if (event.includes('started')) return 'info';
    if (event.includes('processing')) return 'processing';
    if (event.includes('completed')) return 'success';
    if (event.includes('error')) return 'error';
    return 'info';
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsProcessing(true);
    setWorkflowStatus('preparing');
    setProcessingLog([]);

    try {
      // Convert file to base64
      const imageData = await fileToBase64(file);
      setUploadedImage(imageData);

      // Add to processing log
      addLogEntry('file:selected', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      // Process with MCP server
      setWorkflowStatus('analyzing');

      const result = await mcpHealthServer.processScreenshot(imageData, {
        healthAppType: selectedApp,
        metadata: {
          fileName: file.name,
          fileSize: file.size,
          uploadedAt: new Date().toISOString()
        }
      });

      console.log('Screenshot processing completed:', result);

    } catch (error) {
      console.error('Screenshot processing failed:', error);
      addLogEntry('processing:error', { error: error.message });
      if (onError) {
        onError(error.message);
      }
    } finally {
      setIsProcessing(false);
      setWorkflowStatus('idle');
    }
  };

  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const loadRecentScreenshots = () => {
    try {
      const saved = localStorage.getItem('mcp_recent_screenshots');
      if (saved) {
        setRecentScreenshots(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load recent screenshots:', error);
    }
  };

  const updateRecentScreenshots = (data) => {
    const newScreenshot = {
      id: data.id,
      timestamp: data.timestamp,
      sourceApp: data.sourceApp,
      moodScore: data.mood.score,
      moodPrediction: data.mood.prediction,
      steps: data.activity.steps,
      processedAt: data.processingInfo.extractedAt,
      thumbnail: uploadedImage ? uploadedImage.substring(0, 100) : null
    };

    const updated = [newScreenshot, ...recentScreenshots].slice(0, 10);
    setRecentScreenshots(updated);

    try {
      localStorage.setItem('mcp_recent_screenshots', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent screenshots:', error);
    }
  };

  const clearRecentScreenshots = () => {
    setRecentScreenshots([]);
    localStorage.removeItem('mcp_recent_screenshots');
  };

  const simulateMobileScreenshot = () => {
    // Simulate receiving a screenshot from mobile app
    const mockScreenshots = [
      {
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        appType: 'google-fit',
        metadata: { source: 'mobile-app-simulation' }
      },
      {
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        appType: 'apple-health',
        metadata: { source: 'mobile-app-simulation' }
      },
      {
        dataUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
        appType: 'fitbit',
        metadata: { source: 'mobile-app-simulation' }
      }
    ];

    const randomScreenshot = mockScreenshots[Math.floor(Math.random() * mockScreenshots.length)];
    setSelectedApp(randomScreenshot.appType);

    // Create a mock file from the data URL
    fetch(randomScreenshot.dataUrl)
      .then(res => res.blob())
      .then(blob => {
        const file = new File([blob], `mock-${randomScreenshot.appType}-screenshot.png`, {
          type: 'image/png'
        });
        processFile(file);
      });
  };

  return (
    <div className="screenshot-processor">
      <div className="processor-header">
        <h3>📸 AI-Powered Health Screenshot Analyzer</h3>
        <p>Extract real health data from your app screenshots using AI Vision Analysis</p>
      </div>

      <div className="processor-content">
        {/* Health App Selection */}
        <div className="app-selection">
          <label>Select Health App Type:</label>
          <div className="app-grid">
            {healthApps.map(app => (
              <button
                key={app.id}
                className={`app-option ${selectedApp === app.id ? 'selected' : ''}`}
                onClick={() => setSelectedApp(app.id)}
                disabled={isProcessing}
              >
                <span className="app-icon">{app.icon}</span>
                <span className="app-name">{app.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* File Upload Area */}
        <div className="upload-area">
          <div
            className={`drop-zone ${isProcessing ? 'processing' : ''}`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              disabled={isProcessing}
            />

            {isProcessing ? (
              <div className="processing-state">
                <div className="spinner">🤖</div>
                <p><strong>AI Vision is analyzing your screenshot...</strong></p>
                <p className="status">{workflowStatus}</p>
                <p style={{ fontSize: '0.85rem', color: '#6b7280', marginTop: '8px' }}>
                  This uses real AI to extract health metrics from your image
                </p>
              </div>
            ) : (
              <div className="upload-state">
                <div className="upload-icon">📱</div>
                <h4>Drop health app screenshot here</h4>
                <p>or click to select file</p>
                <p className="file-types">Supports: PNG, JPG, JPEG, WebP</p>
                <p style={{ fontSize: '0.85rem', color: '#059669', marginTop: '8px' }}>
                  ✨ Powered by AI Vision Analysis
                </p>
              </div>
            )}
          </div>

          {/* Mobile App Simulation Button */}
          <div className="simulation-controls">
            <button
              className="simulate-btn"
              onClick={simulateMobileScreenshot}
              disabled={isProcessing}
            >
              🎭 Simulate Mobile Screenshot
            </button>
          </div>
        </div>

        {/* Preview */}
        {uploadedImage && (
          <div className="image-preview">
            <h4>Screenshot Preview:</h4>
            <img
              src={uploadedImage}
              alt="Health app screenshot"
              style={{ maxWidth: '200px', maxHeight: '300px' }}
            />
          </div>
        )}

        {/* Processing Log */}
        {processingLog.length > 0 && (
          <div className="processing-log">
            <div className="log-header">
              <h4>Processing Log</h4>
              <button
                className="clear-log-btn"
                onClick={() => setProcessingLog([])}
              >
                Clear
              </button>
            </div>
            <div className="log-entries">
              {processingLog.map((entry, index) => (
                <div key={index} className={`log-entry ${entry.type}`}>
                  <span className="timestamp">{entry.timestamp}</span>
                  <span className="message">{entry.message}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent Screenshots */}
        {recentScreenshots.length > 0 && (
          <div className="recent-screenshots">
            <div className="recent-header">
              <h4>Recent Processed Screenshots</h4>
              <button
                className="clear-btn"
                onClick={clearRecentScreenshots}
              >
                Clear All
              </button>
            </div>
            <div className="screenshots-list">
              {recentScreenshots.map((screenshot, index) => (
                <div key={screenshot.id} className="screenshot-item">
                  <div className="screenshot-info">
                    <span className="app-name">
                      {healthApps.find(app => app.id === screenshot.sourceApp)?.icon} {screenshot.sourceApp}
                    </span>
                    <span className="timestamp">
                      {new Date(screenshot.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div className="screenshot-metrics">
                    <div className="metric">
                      <span className="label">Mood:</span>
                      <span className="value">{screenshot.moodPrediction} ({screenshot.moodScore})</span>
                    </div>
                    <div className="metric">
                      <span className="label">Steps:</span>
                      <span className="value">{screenshot.steps.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions */}
        <div className="instructions">
          <h4>How to use:</h4>
          <ol>
            <li>Select your health app type from the grid above</li>
            <li>Take a screenshot of your health app on your phone</li>
            <li>Transfer the screenshot to your computer</li>
            <li>Drop or select the image file here</li>
            <li>AI will analyze the screenshot and extract health data</li>
            <li>Processed data will appear on your health dashboard</li>
          </ol>
          <div className="tips">
            <strong>Tips:</strong>
            <ul>
              <li>Make sure the screenshot clearly shows health metrics</li>
              <li>Good lighting and clear screenshots work best</li>
              <li>Try to include steps, heart rate, and sleep data if possible</li>
              <li>You can use the simulation button to test the system</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenshotProcessor;
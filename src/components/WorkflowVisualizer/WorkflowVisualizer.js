import React, { useState, useEffect } from 'react';
import './WorkflowVisualizer.css';
import mcpHealthServer from '../../services/MCPHealthServer';

const WorkflowVisualizer = () => {
  const [workflows, setWorkflows] = useState([]);
  const [activeWorkflow, setActiveWorkflow] = useState(null);
  const [serverStatus, setServerStatus] = useState(null);
  const [workflowHistory, setWorkflowHistory] = useState([]);

  useEffect(() => {
    // Load workflows and server status
    setWorkflows(mcpHealthServer.getWorkflows());
    setServerStatus(mcpHealthServer.getStatus());

    // Subscribe to server events
    const unsubscribe = mcpHealthServer.subscribe((event, data) => {
      handleServerEvent(event, data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const handleServerEvent = (event, data) => {
    if (event.startsWith('workflow:')) {
      const historyEntry = {
        id: Date.now(),
        event,
        timestamp: new Date().toISOString(),
        data
      };
      setWorkflowHistory(prev => [historyEntry, ...prev].slice(0, 50));
    }
  };

  const renderWorkflow = (workflow) => {
    const isActive = activeWorkflow === workflow.id;

    return (
      <div
        key={workflow.id}
        className={`workflow-card ${isActive ? 'active' : ''}`}
        onClick={() => setActiveWorkflow(isActive ? null : workflow.id)}
      >
        <div className="workflow-header">
          <h4>{workflow.name}</h4>
          <span className={`workflow-status ${isActive ? 'running' : 'idle'}`}>
            {isActive ? '🔄 Active' : '⚡ Ready'}
          </span>
        </div>
        <p className="workflow-description">{workflow.description}</p>

        {isActive && (
          <div className="workflow-nodes">
            {workflow.nodes.map((node, index) => (
              <div key={node.id} className="workflow-node">
                <div className="node-icon">
                  {getNodeIcon(node.type)}
                </div>
                <div className="node-content">
                  <h5>{node.name}</h5>
                  <p>{node.description}</p>
                </div>
                {index < workflow.nodes.length - 1 && (
                  <div className="node-connector">→</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getNodeIcon = (nodeType) => {
    const icons = {
      trigger: '🎯',
      'ai-processing': '🤖',
      'data-transformation': '🔄',
      output: '📤',
      validation: '✅',
      'ai-analysis': '🧠',
      analysis: '📊'
    };
    return icons[nodeType] || '⚙️';
  };

  const renderWorkflowHistory = () => {
    if (workflowHistory.length === 0) {
      return (
        <div className="empty-history">
          <p>No workflow executions yet. Process a screenshot to see workflow activity.</p>
        </div>
      );
    }

    return (
      <div className="history-list">
        {workflowHistory.map(entry => (
          <div key={entry.id} className={`history-entry ${entry.event}`}>
            <span className="timestamp">
              {new Date(entry.timestamp).toLocaleTimeString()}
            </span>
            <span className="event">
              {entry.event.replace('workflow:', '')}
            </span>
            <span className="message">
              {entry.data.message || entry.data.workflowId}
            </span>
          </div>
        ))}
      </div>
    );
  };

  const clearHistory = () => {
    setWorkflowHistory([]);
  };

  return (
    <div className="workflow-visualizer">
      <div className="visualizer-header">
        <h3>🔄 MCP Workflow Visualizer</h3>
        <p>n8n-style automation for health data processing</p>
      </div>

      <div className="visualizer-content">
        {/* Server Status */}
        <div className="server-status">
          <h4>Server Status</h4>
          <div className="status-grid">
            <div className="status-item">
              <span className="label">Status:</span>
              <span className={`value ${serverStatus?.running ? 'running' : 'stopped'}`}>
                {serverStatus?.running ? '🟢 Running' : '🔴 Stopped'}
              </span>
            </div>
            <div className="status-item">
              <span className="label">Workflows:</span>
              <span className="value">{workflows.length}</span>
            </div>
            <div className="status-item">
              <span className="label">Data Buffer:</span>
              <span className="value">{serverStatus?.dataBufferSize || 0} items</span>
            </div>
            <div className="status-item">
              <span className="label">Queue Size:</span>
              <span className="value">{serverStatus?.queueSize || 0}</span>
            </div>
          </div>
        </div>

        {/* Available Workflows */}
        <div className="workflows-section">
          <h4>Available Workflows</h4>
          <div className="workflows-grid">
            {workflows.map(workflow => renderWorkflow(workflow))}
          </div>
        </div>

        {/* Workflow History */}
        <div className="history-section">
          <div className="history-header">
            <h4>Workflow Execution History</h4>
            <button
              className="clear-history-btn"
              onClick={clearHistory}
              disabled={workflowHistory.length === 0}
            >
              Clear History
            </button>
          </div>
          {renderWorkflowHistory()}
        </div>

        {/* Workflow Explanation */}
        <div className="workflow-info">
          <h4>How MCP Workflows Work</h4>
          <div className="info-content">
            <div className="info-item">
              <h5>🎯 Trigger Nodes</h5>
              <p>Start workflows based on events like screenshot uploads or data input</p>
            </div>
            <div className="info-item">
              <h5>🤖 AI Processing Nodes</h5>
              <p>Use Gemini AI to analyze images and extract health metrics</p>
            </div>
            <div className="info-item">
              <h5>🔄 Data Transformation Nodes</h5>
              <p>Convert extracted text into structured health data format</p>
            </div>
            <div className="info-item">
              <h5>📊 Analysis Nodes</h5>
              <p>Generate insights, analyze trends, and create recommendations</p>
            </div>
            <div className="info-item">
              <h5>📤 Output Nodes</h5>
              <p>Send processed data to dashboards and connected clients</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkflowVisualizer;
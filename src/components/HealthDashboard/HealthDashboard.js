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

  // Task Management State
  const [tasks, setTasks] = useState([]);
  const [taskStats, setTaskStats] = useState({ pending: 0, completed: 0, appointments: 0 });
  const [taskLoading, setTaskLoading] = useState(false);
  const [showAppointmentModal, setShowAppointmentModal] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState(null);

  // Notifications State
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'wellness',
      title: '15-minute walk recommended',
      message: 'Take a break for a refreshing walk to boost your mood',
      time: '2 min ago',
      read: false
    },
    {
      id: 2,
      type: 'health',
      title: 'Health data sync complete',
      message: 'Your latest health metrics have been updated',
      time: '1 hour ago',
      read: true
    },
    {
      id: 3,
      type: 'reminder',
      title: 'Mood check-in reminder',
      message: 'How are you feeling today? Take a quick assessment',
      time: '3 hours ago',
      read: false
    }
  ]);

  useEffect(() => {
    loadHealthData();
    checkRealDataAvailability();
    loadTasks(); // Load tasks from Suzi's API

    // Subscribe to MCP server events
    const unsubscribeMCP = mcpHealthServer.subscribe((event, data) => {
      handleMCPEvent(event, data);
    });

    // Start MCP server
    mcpHealthServer.start();

    const interval = setInterval(loadHealthData, 60000); // Refresh every minute
    const taskInterval = setInterval(loadTasks, 30000); // Refresh tasks every 30 seconds
    return () => {
      clearInterval(interval);
      clearInterval(taskInterval);
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
          console.log('🔄 Updating dashboard with MCP data:', data);
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
          console.log('🧠 Updating dashboard with insights:', data);
          setHealthData(data);
          setDataSource('mcp');
          setMcpDataAvailable(true);
          setError(null);
          setLoading(false);
        }
        break;
      case 'workflow:completed':
        // Handle workflow completion - automatically switch to MCP data
        if (data.result && data.result.source === 'mcp-screenshot-processor') {
          console.log('✅ Workflow completed, switching to MCP data:', data.result);
          setHealthData(data.result);
          setDataSource('mcp');
          setMcpDataAvailable(true);
          setError(null);
          setLoading(false);
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

  // Task Management Functions
  const loadTasks = async () => {
    try {
      setTaskLoading(true);
      const response = await fetch('http://127.0.0.1:8001/tasks');
      if (!response.ok) throw new Error('Failed to load tasks');

      const data = await response.json();
      setTasks(data.tasks || []);

      // Calculate task statistics
      const pendingTasks = data.tasks?.filter(t => t.status === 'pending') || [];
      const completedTasks = data.tasks?.filter(t => t.status === 'completed') || [];
      const appointmentTasks = data.tasks?.filter(t => t.type === 'appointment') || [];

      setTaskStats({
        pending: pendingTasks.length,
        completed: completedTasks.length,
        appointments: appointmentTasks.length
      });
    } catch (err) {
      console.error('Error loading tasks:', err);
      // Don't set main error state for task errors
    } finally {
      setTaskLoading(false);
    }
  };

  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`http://127.0.0.1:8001/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (!response.ok) throw new Error('Failed to update task');

      // Reload tasks to get updated state
      await loadTasks();
    } catch (err) {
      console.error('Error updating task:', err);
      alert('Failed to update task status');
    }
  };

  const deleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      const response = await fetch(`http://127.0.0.1:8001/tasks/${taskId}`, {
        method: 'DELETE'
      });

      if (!response.ok) throw new Error('Failed to delete task');

      // Reload tasks to get updated state
      await loadTasks();
    } catch (err) {
      console.error('Error deleting task:', err);
      alert('Failed to delete task');
    }
  };

  const createAppointmentTask = async (doctorInfo, appointmentDate, appointmentTime) => {
    try {
      const taskTitle = `Appointment with Dr. ${doctorInfo.name} - ${doctorInfo.specialty}`;
      const response = await fetch('http://127.0.0.1:8001/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: taskTitle,
          type: 'appointment',
          priority: 'high',
          due_date: `${appointmentDate}T${appointmentTime}`
        })
      });

      if (!response.ok) throw new Error('Failed to create appointment');

      // Add notification for appointment
      addNotification('appointment', 'Appointment Scheduled', `Your appointment with Dr. ${doctorInfo.name} has been scheduled`, 'just now');

      // Reload tasks to get updated state
      await loadTasks();
      setShowAppointmentModal(false);
      setSelectedDoctor(null);

      alert('Appointment booked successfully! Check your tasks dashboard for details.');
    } catch (err) {
      console.error('Error creating appointment:', err);
      alert('Failed to book appointment');
    }
  };

  // Notification Management
  const addNotification = (type, title, message, time) => {
    const newNotification = {
      id: Date.now(),
      type,
      title,
      message,
      time,
      read: false
    };
    setNotifications(prev => [newNotification, ...prev].slice(0, 10)); // Keep only 10 most recent
  };

  const markNotificationAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === notificationId ? { ...notif, read: true } : notif
      )
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifications(prev =>
      prev.map(notif => ({ ...notif, read: true }))
    );
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

    console.log('🎯 Rendering mood card with data:', {
      dataSource,
      mood: healthData.mood,
      activity: healthData.activity?.steps,
      hasMoodData: !!healthData.mood,
      moodPrediction: healthData.mood?.prediction,
      moodScore: healthData.mood?.score
    });

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

    console.log('🏃 Rendering activity card with data:', {
      dataSource,
      activity: healthData.activity,
      steps: healthData.activity?.steps,
      source: healthData.source
    });

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

  const renderNotificationsCard = () => {
    const unreadCount = notifications.filter(n => !n.read).length;

    const getNotificationIcon = (type) => {
      const icons = {
        wellness: '🚶‍♀️',
        health: '💚',
        reminder: '⏰',
        appointment: '📅'
      };
      return icons[type] || '📢';
    };

    const getNotificationColor = (type) => {
      const colors = {
        wellness: '#10b981',
        health: '#3b82f6',
        reminder: '#f59e0b',
        appointment: '#8b5cf6'
      };
      return colors[type] || '#6b7280';
    };

    return (
      <div className="metric-card notifications-card">
        <div className="card-header">
          <h3>🔔 Notifications</h3>
          <div className="header-actions">
            {unreadCount > 0 && (
              <span className="unread-badge">{unreadCount}</span>
            )}
            {unreadCount > 0 && (
              <button
                className="mark-all-read-btn"
                onClick={markAllNotificationsAsRead}
              >
                Mark all read
              </button>
            )}
          </div>
        </div>

        <div className="notifications-list">
          {notifications.length === 0 ? (
            <div className="empty-notifications">
              <p>No notifications yet</p>
            </div>
          ) : (
            notifications.slice(0, 5).map(notification => (
              <div
                key={notification.id}
                className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                onClick={() => markNotificationAsRead(notification.id)}
              >
                <div className="notification-icon" style={{ color: getNotificationColor(notification.type) }}>
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">{notification.time}</div>
                </div>
                <div className="notification-status">
                  {!notification.read && <div className="unread-dot"></div>}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  };

  const renderPendingTasksCard = () => {
    const pendingTasks = tasks.filter(task => task.status === 'pending');

    return (
      <div className="metric-card pending-tasks-card">
        <div className="card-header">
          <h3>📝 Pending Tasks</h3>
          <span className="refresh-icon" onClick={loadTasks}>
            {taskLoading ? '🔄' : '🔄'}
          </span>
        </div>

        <div className="tasks-summary">
          <div className="summary-item">
            <span className="summary-count">{taskStats.pending}</span>
            <span className="summary-label">Pending</span>
          </div>
          <div className="summary-item">
            <span className="summary-count">{taskStats.completed}</span>
            <span className="summary-label">Completed</span>
          </div>
        </div>

        <div className="pending-tasks-list">
          {pendingTasks.length === 0 ? (
            <div className="empty-tasks">
              <p>No pending tasks! You're all caught up.</p>
              <p className="empty-subtitle">Chat with Suzi to get wellness suggestions!</p>
            </div>
          ) : (
            pendingTasks.slice(0, 4).map(task => (
              <div key={task.id} className="task-item">
                <div className="task-checkbox">
                  <input
                    type="checkbox"
                    onChange={() => updateTaskStatus(task.id, 'completed')}
                    checked={false}
                  />
                </div>
                <div className="task-content">
                  <div className="task-title">{task.title}</div>
                  <div className="task-meta">
                    <span className={`task-type ${task.type}`}>{task.type}</span>
                    <span className={`task-priority ${task.priority}`}>{task.priority}</span>
                    {task.due_date && (
                      <span className="task-date">
                        {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  className="delete-task-btn"
                  onClick={() => deleteTask(task.id)}
                >
                  ×
                </button>
              </div>
            ))
          )}

          {tasks.length > 4 && (
            <div className="view-all-tasks">
              <a
                href="http://127.0.0.1:8001/health-dashboard"
                target="_blank"
                rel="noopener noreferrer"
              >
                View all tasks →
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderAppointmentsCard = () => {
    const appointmentTasks = tasks.filter(task => task.type === 'appointment' && task.status === 'pending');
    const upcomingAppointments = appointmentTasks.sort((a, b) => new Date(a.due_date) - new Date(b.due_date));

    return (
      <div className="metric-card appointments-card">
        <div className="card-header">
          <h3>📅 Appointments</h3>
          <button
            className="book-appointment-btn-small"
            onClick={() => setShowAppointmentModal(true)}
          >
            + Book
          </button>
        </div>

        <div className="appointments-summary">
          <div className="summary-item">
            <span className="summary-count">{taskStats.appointments}</span>
            <span className="summary-label">Scheduled</span>
          </div>
        </div>

        <div className="appointments-list">
          {upcomingAppointments.length === 0 ? (
            <div className="empty-appointments">
              <p>No upcoming appointments</p>
              <button
                className="book-appointment-btn"
                onClick={() => setShowAppointmentModal(true)}
              >
                📅 Book Appointment
              </button>
            </div>
          ) : (
            upcomingAppointments.slice(0, 3).map(appointment => (
              <div key={appointment.id} className="appointment-item">
                <div className="appointment-date">
                  <div className="date-day">
                    {new Date(appointment.due_date).getDate()}
                  </div>
                  <div className="date-month">
                    {new Date(appointment.due_date).toLocaleDateString('en', { month: 'short' })}
                  </div>
                </div>
                <div className="appointment-content">
                  <div className="appointment-title">{appointment.title}</div>
                  <div className="appointment-time">
                    {new Date(appointment.due_date).toLocaleTimeString('en', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="appointment-meta">
                    <span className={`task-priority ${appointment.priority}`}>{appointment.priority}</span>
                  </div>
                </div>
                <div className="appointment-actions">
                  <button
                    className="reschedule-btn"
                    onClick={() => {/* TODO: Add reschedule logic */}}
                  >
                    📅
                  </button>
                  <button
                    className="delete-task-btn"
                    onClick={() => deleteTask(appointment.id)}
                  >
                    ×
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="appointment-footer">
          <button
            className="find-doctors-btn"
            onClick={() => window.open('/searchdocs', '_blank')}
          >
            🏥 Find Mental Health Professionals
          </button>
        </div>
      </div>
    );
  };

  const renderAppointmentModal = () => {
    if (!showAppointmentModal) return null;

    const doctors = [
      {
        id: 1,
        name: "Sarah Johnson",
        specialty: "Clinical Psychology",
        degrees: "PhD, PsyD",
        rating: 4.8,
        experience: "15 years",
        availability: "Available today",
        consultationFee: 150,
        telehealth: true,
        phone: "555-0123",
        website: "example.com"
      },
      {
        id: 2,
        name: "Michael Chen",
        specialty: "Psychiatry",
        degrees: "MD, Board Certified",
        rating: 4.9,
        experience: "12 years",
        availability: "Tomorrow",
        consultationFee: 200,
        telehealth: true,
        phone: "555-0124",
        website: "example.com"
      },
      {
        id: 3,
        name: "Emily Rodriguez",
        specialty: "Counseling & Therapy",
        degrees: "MS, LPC",
        rating: 4.7,
        experience: "8 years",
        availability: "This week",
        consultationFee: 120,
        telehealth: true,
        phone: "555-0125",
        website: "example.com"
      }
    ];

    return (
      <div className="modal-overlay" onClick={() => setShowAppointmentModal(false)}>
        <div className="modal-content appointment-modal" onClick={(e) => e.stopPropagation()}>
          <div className="modal-header">
            <h3>📅 Book Doctor Appointment</h3>
            <button
              className="close-modal-btn"
              onClick={() => setShowAppointmentModal(false)}
            >
              ×
            </button>
          </div>

          <div className="doctors-list">
            {doctors.map(doctor => (
              <div key={doctor.id} className="doctor-card">
                <div className="doctor-info">
                  <div className="doctor-header">
                    <h4>Dr. {doctor.name}</h4>
                    <div className="doctor-rating">
                      ⭐ {doctor.rating}
                    </div>
                  </div>
                  <div className="doctor-specialty">{doctor.specialty}</div>
                  <div className="doctor-degrees">{doctor.degrees}</div>
                  <div className="doctor-experience">{doctor.experience}</div>
                  <div className="doctor-availability">
                    Available: {doctor.availability}
                  </div>
                  <div className="doctor-fee">
                    Consultation: ${doctor.consultationFee}
                  </div>
                  {doctor.telehealth && (
                    <div className="telehealth-badge">📱 Telehealth available</div>
                  )}
                </div>

                <div className="doctor-actions">
                  <button
                    className="select-doctor-btn"
                    onClick={() => setSelectedDoctor(doctor)}
                  >
                    Select Doctor
                  </button>
                  <div className="doctor-contact">
                    <span>📞 {doctor.phone}</span>
                    <span>🌐 Website</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {selectedDoctor && (
            <div className="appointment-booking">
              <h4>Book Appointment with Dr. {selectedDoctor.name}</h4>
              <form onSubmit={(e) => {
                e.preventDefault();
                const date = e.target.date.value;
                const time = e.target.time.value;
                createAppointmentTask(selectedDoctor, date, time);
              }}>
                <div className="form-group">
                  <label>Select Date:</label>
                  <input
                    type="date"
                    name="date"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                <div className="form-group">
                  <label>Select Time:</label>
                  <input type="time" name="time" required />
                </div>
                <div className="form-actions">
                  <button type="submit" className="confirm-booking-btn">
                    Confirm Booking
                  </button>
                  <button
                    type="button"
                    className="cancel-booking-btn"
                    onClick={() => setSelectedDoctor(null)}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}
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
              {dataSource === 'mcp' ? '🤖 AI Processed' : dataSource === 'real' ? '🟢 Real Data' : '🟡 Live Data'}
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
        {renderNotificationsCard()}
        {renderPendingTasksCard()}
        {renderAppointmentsCard()}
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

      {/* Appointment Booking Modal */}
      {renderAppointmentModal()}

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
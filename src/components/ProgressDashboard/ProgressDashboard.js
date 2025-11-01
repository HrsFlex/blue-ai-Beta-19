import React, { useState, useEffect } from 'react';
import './ProgressDashboard.css';
import UserDataService from '../../services/UserDataService';
import AppointmentService from '../../services/AppointmentService';

const ProgressDashboard = () => {
  const [userStats, setUserStats] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);
  const [activities, setActivities] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [timeRange, setTimeRange] = useState('week'); // 'week', 'month', 'all'
  const currentUser = UserDataService.getCurrentUser();

  useEffect(() => {
    if (currentUser) {
      loadUserData();
    }
  }, [currentUser, timeRange]);

  const loadUserData = () => {
    // Load user statistics
    const stats = UserDataService.getUserStatistics(currentUser.id);
    setUserStats(stats);

    // Load appointments
    const userAppointments = AppointmentService.getUserAppointments(currentUser.id);
    const allAppointments = Object.values(userAppointments);
    setAppointments(allAppointments);

    // Load mood history
    setMoodHistory(currentUser.wellnessData.moodHistory);

    // Load activities
    setActivities(currentUser.wellnessData.activitiesCompleted);

    // Load achievements
    setAchievements(currentUser.wellnessData.achievements);
  };

  // Filter data based on time range
  const filterDataByTimeRange = (data, dateField) => {
    if (timeRange === 'all') return data;

    const now = new Date();
    const daysBack = timeRange === 'week' ? 7 : 30;
    const cutoffDate = new Date(now.getTime() - daysBack * 24 * 60 * 60 * 1000);

    return data.filter(item => new Date(item[dateField]) >= cutoffDate);
  };

  const filteredMoodHistory = filterDataByTimeRange(moodHistory, 'timestamp');
  const filteredActivities = filterDataByTimeRange(activities, 'timestamp');
  const filteredAppointments = filterDataByTimeRange(appointments, 'createdAt');

  // Calculate mood trends
  const getMoodTrend = () => {
    if (filteredMoodHistory.length < 2) return 'stable';

    const recent = filteredMoodHistory.slice(-5);
    const older = filteredMoodHistory.slice(-10, -5);

    const recentAvg = recent.reduce((sum, mood) => sum + mood.mood, 0) / recent.length;
    const olderAvg = older.length > 0 ? older.reduce((sum, mood) => sum + mood.mood, 0) / older.length : recentAvg;

    if (recentAvg > olderAvg + 10) return 'improving';
    if (recentAvg < olderAvg - 10) return 'declining';
    return 'stable';
  };

  // Get most frequent emotions
  const getTopEmotions = () => {
    const emotionCounts = {};
    filteredMoodHistory.forEach(mood => {
      mood.emotions.forEach(emotion => {
        emotionCounts[emotion] = (emotionCounts[emotion] || 0) + 1;
      });
    });

    return Object.entries(emotionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([emotion, count]) => ({ emotion, count }));
  };

  // Get activity category breakdown
  const getActivityBreakdown = () => {
    const categoryCounts = {};
    filteredActivities.forEach(activity => {
      const category = activity.type || 'wellness';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const total = Object.values(categoryCounts).reduce((sum, count) => sum + count, 0);

    return Object.entries(categoryCounts).map(([category, count]) => ({
      category,
      count,
      percentage: Math.round((count / total) * 100)
    }));
  };

  // Get wellness score history
  const getWellnessScoreHistory = () => {
    const history = [];
    let currentScore = 100;

    // Combine mood and activity data chronologically
    const allEvents = []
      .concat(
        filteredMoodHistory.map(m => ({ ...m, type: 'mood' })),
        filteredActivities.map(a => ({ ...a, type: 'activity' }))
      )
      .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

    allEvents.forEach(event => {
      if (event.type === 'mood') {
        currentScore += Math.round(event.mood / 10);
      } else if (event.pointsEarned) {
        currentScore += event.pointsEarned;
      }
      history.push({
        date: new Date(event.timestamp).toLocaleDateString(),
        score: Math.max(0, Math.min(200, currentScore))
      });
    });

    return history;
  };

  const moodTrend = getMoodTrend();
  const topEmotions = getTopEmotions();
  const activityBreakdown = getActivityBreakdown();
  const wellnessHistory = getWellnessScoreHistory();

  if (!userStats) {
    return <div className="progress-dashboard loading">Loading your progress...</div>;
  }

  return (
    <div className="progress-dashboard">
      <div className="dashboard-header">
        <h2>Your Wellness Journey</h2>
        <div className="time-range-selector">
          <button
            className={`range-btn ${timeRange === 'week' ? 'active' : ''}`}
            onClick={() => setTimeRange('week')}
          >
            This Week
          </button>
          <button
            className={`range-btn ${timeRange === 'month' ? 'active' : ''}`}
            onClick={() => setTimeRange('month')}
          >
            This Month
          </button>
          <button
            className={`range-btn ${timeRange === 'all' ? 'active' : ''}`}
            onClick={() => setTimeRange('all')}
          >
            All Time
          </button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="metrics-grid">
        <div className="metric-card primary">
          <div className="metric-icon">💙</div>
          <div className="metric-content">
            <h3>Wellness Score</h3>
            <div className="metric-value">{userStats.wellnessScore}</div>
            <div className="metric-trend">
              {moodTrend === 'improving' && <span className="trend-up">📈 Improving</span>}
              {moodTrend === 'declining' && <span className="trend-down">📉 Needs attention</span>}
              {moodTrend === 'stable' && <span className="trend-stable">➡️ Stable</span>}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🔥</div>
          <div className="metric-content">
            <h3>Activity Streak</h3>
            <div className="metric-value">{userStats.currentStreak.activities} days</div>
            <div className="metric-subtitle">Keep it going!</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">📊</div>
          <div className="metric-content">
            <h3>Activities Completed</h3>
            <div className="metric-value">{filteredActivities.length}</div>
            <div className="metric-subtitle">This {timeRange}</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon">🎯</div>
          <div className="metric-content">
            <h3>Achievements</h3>
            <div className="metric-value">{achievements.length}</div>
            <div className="metric-subtitle">Unlocked</div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="charts-section">
        {/* Wellness Score Trend */}
        <div className="chart-card">
          <h3>Wellness Score Trend</h3>
          <div className="chart-container">
            {wellnessHistory.length > 0 ? (
              <div className="wellness-chart">
                {wellnessHistory.map((point, index) => (
                  <div key={index} className="chart-point">
                    <div className="chart-bar" style={{ height: `${(point.score / 200) * 100}%` }}></div>
                    <div className="chart-label">{point.date.split('/').slice(0, 2).join('/')}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">Start activities to see your wellness score trend</div>
            )}
          </div>
        </div>

        {/* Activity Breakdown */}
        <div className="chart-card">
          <h3>Activity Breakdown</h3>
          <div className="chart-container">
            {activityBreakdown.length > 0 ? (
              <div className="activity-breakdown">
                {activityBreakdown.map((item, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-bar">
                      <div
                        className="activity-fill"
                        style={{ width: `${item.percentage}%` }}
                      ></div>
                    </div>
                    <div className="activity-label">
                      <span className="category">{item.category}</span>
                      <span className="count">{item.count} times</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-data">No activities completed yet</div>
            )}
          </div>
        </div>
      </div>

      {/* Emotions and Insights */}
      <div className="insights-section">
        <div className="insight-card">
          <h3>Top Emotions</h3>
          <div className="emotions-list">
            {topEmotions.length > 0 ? (
              topEmotions.map((item, index) => (
                <div key={index} className="emotion-item">
                  <span className="emotion-name">{item.emotion}</span>
                  <span className="emotion-count">{item.count} times</span>
                </div>
              ))
            ) : (
              <div className="no-data">Start checking in to see your emotions</div>
            )}
          </div>
        </div>

        <div className="insight-card">
          <h3>Recent Insights</h3>
          <div className="insights-list">
            {filteredMoodHistory.length > 0 ? (
              <>
                <div className="insight-item">
                  <span className="insight-icon">💡</span>
                  <span>You've been tracking your mood for {filteredMoodHistory.length} days</span>
                </div>
                <div className="insight-item">
                  <span className="insight-icon">📈</span>
                  <span>
                    {moodTrend === 'improving' && 'Your overall mood is improving!'}
                    {moodTrend === 'declining' && 'Consider trying more self-care activities'}
                    {moodTrend === 'stable' && 'You\'re maintaining emotional balance'}
                  </span>
                </div>
                <div className="insight-item">
                  <span className="insight-icon">🎯</span>
                  <span>You've earned {userStats.weeklyStats?.totalPointsEarned || 0} wellness points this period</span>
                </div>
              </>
            ) : (
              <div className="no-data">More data needed for insights</div>
            )}
          </div>
        </div>
      </div>

      {/* Appointments */}
      <div className="appointments-section">
        <h3>Upcoming Appointments</h3>
        <div className="appointments-list">
          {filteredAppointments.filter(apt => apt.status === 'confirmed').length > 0 ? (
            filteredAppointments
              .filter(apt => apt.status === 'confirmed')
              .slice(0, 3)
              .map((appointment, index) => (
                <div key={index} className="appointment-item">
                  <div className="appointment-info">
                    <h4>{appointment.doctor?.name || 'Healthcare Provider'}</h4>
                    <p>{appointment.date} at {appointment.timeSlot}</p>
                    <span className="appointment-type">{appointment.type}</span>
                  </div>
                  <div className="appointment-status confirmed">
                    Confirmed ✓
                  </div>
                </div>
              ))
          ) : (
            <div className="no-appointments">
              <p>No upcoming appointments scheduled</p>
              <button className="schedule-btn">Schedule Appointment</button>
            </div>
          )}
        </div>
      </div>

      {/* Achievements */}
      {achievements.length > 0 && (
        <div className="achievements-section">
          <h3>Recent Achievements</h3>
          <div className="achievements-grid">
            {achievements.slice(-6).map((achievement, index) => (
              <div key={index} className="achievement-badge">
                <div className="achievement-icon">{achievement.icon}</div>
                <div className="achievement-info">
                  <h4>{achievement.name}</h4>
                  <p>{achievement.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Export Data */}
      <div className="export-section">
        <h3>Export Your Data</h3>
        <div className="export-options">
          <button
            className="export-btn"
            onClick={() => {
              const data = UserDataService.exportUserData(currentUser.id);
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `sakhi-wellness-data-${new Date().toISOString().split('T')[0]}.json`;
              a.click();
            }}
          >
            📊 Download Wellness Report
          </button>
          <button className="export-btn">
            📧 Share with Healthcare Provider
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProgressDashboard;
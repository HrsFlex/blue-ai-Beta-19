import React, { useState, useEffect } from 'react';
import Navbar from '../../components/Navbar/Navbar';
import JournalingPrompt from '../../components/Journaling/JournalingPrompt';
import MeditationLibrary from '../../components/MeditationLibrary/MeditationLibrary';
import Meditation from '../../components/Meditation/Meditation';
import './WellnessRecommendations.css';

const WellnessRecommendations = () => {
  const [activeView, setActiveView] = useState('overview');
  const [showMeditation, setShowMeditation] = useState(false);
  const [wellnessStats, setWellnessStats] = useState({
    journalEntries: 0,
    meditationMinutes: 0,
    breathingSessions: 0,
    currentStreak: 0,
    weeklyGoal: 5
  });

  useEffect(() => {
    // Calculate stats from localStorage
    const journalEntries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const meditationSessions = JSON.parse(localStorage.getItem('meditationSessions') || '[]');
    const breathingSessions = JSON.parse(localStorage.getItem('breathingSessions') || '[]');

    const stats = {
      journalEntries: journalEntries.length,
      meditationMinutes: meditationSessions.reduce((total, session) => total + session.duration, 0),
      breathingSessions: breathingSessions.length,
      currentStreak: calculateStreak(journalEntries, meditationSessions, breathingSessions)
    };

    setWellnessStats(prev => ({ ...prev, ...stats }));
  }, []);

  const calculateStreak = (journalEntries, meditationSessions, breathingSessions) => {
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();

    const allActivities = [
      ...journalEntries.map(e => e.date),
      ...meditationSessions.map(e => e.date),
      ...breathingSessions.map(e => e.date)
    ];

    if (allActivities.includes(today)) return 1;
    if (allActivities.includes(yesterday)) return 1;
    return 0;
  };

  const handleMeditationComplete = () => {
    setShowMeditation(false);
    const session = {
      date: new Date().toDateString(),
      duration: 3,
      timestamp: new Date().toISOString()
    };

    const sessions = JSON.parse(localStorage.getItem('breathingSessions') || '[]');
    sessions.push(session);
    localStorage.setItem('breathingSessions', JSON.stringify(sessions));

    setWellnessStats(prev => ({
      ...prev,
      breathingSessions: prev.breathingSessions + 1,
      currentStreak: calculateStreak(
        JSON.parse(localStorage.getItem('journalEntries') || '[]'),
        JSON.parse(localStorage.getItem('meditationSessions') || '[]'),
        sessions
      )
    }));
  };

  const handleJournalEntry = (entry) => {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    entries.push(entry);
    localStorage.setItem('journalEntries', JSON.stringify(entries));

    setWellnessStats(prev => ({
      ...prev,
      journalEntries: prev.journalEntries + 1,
      currentStreak: calculateStreak(
        entries,
        JSON.parse(localStorage.getItem('meditationSessions') || '[]'),
        JSON.parse(localStorage.getItem('breathingSessions') || '[]')
      )
    }));
  };

  const tools = [
    {
      id: 'journaling',
      name: 'Journaling',
      icon: '📝',
      description: 'Write your thoughts',
      color: 'blue',
      time: '5 min',
      views: 'journaling'
    },
    {
      id: 'breathing',
      name: 'Breathing',
      icon: '🫁',
      description: 'Quick stress relief',
      color: 'green',
      time: '3 min',
      action: () => setShowMeditation(true)
    },
    {
      id: 'meditation',
      name: 'Meditation',
      icon: '🧘',
      description: 'Guided sessions',
      color: 'purple',
      time: '10 min',
      views: 'meditation'
    }
  ];

  const getWeeklyProgress = () => {
    const weekTotal = wellnessStats.journalEntries + wellnessStats.breathingSessions;
    return Math.min((weekTotal / wellnessStats.weeklyGoal) * 100, 100);
  };

  return (
    <div className="flex">
      <Navbar />
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="p-4 lg:p-6">
          <div className="wellness-header">
            <h1 className="wellness-title">Daily Wellness</h1>
            <p className="wellness-subtitle">Take a few minutes for your mental health</p>
          </div>

        {activeView === 'overview' && (
          <div className="wellness-overview">
            {/* Weekly Progress */}
            <div className="progress-card">
              <div className="progress-header">
                <div>
                  <h2 className="progress-title">This Week</h2>
                  <p className="progress-subtitle">
                    {wellnessStats.journalEntries + wellnessStats.breathingSessions} of {wellnessStats.weeklyGoal} sessions
                  </p>
                </div>
                <div className="progress-circle">
                  <svg className="progress-svg">
                    <circle
                      className="progress-background"
                      cx="40"
                      cy="40"
                      r="36"
                    />
                    <circle
                      className="progress-bar"
                      cx="40"
                      cy="40"
                      r="36"
                      strokeDasharray={`${2 * Math.PI * 36}`}
                      strokeDashoffset={`${2 * Math.PI * 36 * (1 - getWeeklyProgress() / 100)}`}
                    />
                  </svg>
                  <span className="progress-text">{Math.round(getWeeklyProgress())}%</span>
                </div>
              </div>
            </div>

            {/* Quick Tools */}
            <div className="tools-grid">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => tool.action ? tool.action() : setActiveView(tool.views)}
                  className={`tool-card tool-${tool.color}`}
                >
                  <div className="tool-icon">{tool.icon}</div>
                  <div className="tool-content">
                    <h3 className="tool-name">{tool.name}</h3>
                    <p className="tool-description">{tool.description}</p>
                    <span className="tool-time">{tool.time}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Recent Activity */}
            <div className="activity-card">
              <h2 className="activity-title">Recent Activity</h2>
              <div className="activity-list">
                {wellnessStats.currentStreak > 0 ? (
                  <div className="activity-item">
                    <span className="activity-icon">🔥</span>
                    <span className="activity-text">Active streak: {wellnessStats.currentStreak} day</span>
                  </div>
                ) : (
                  <div className="activity-item">
                    <span className="activity-icon">💫</span>
                    <span className="activity-text">Start your wellness journey today</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeView === 'journaling' && (
          <JournalingPrompt
            onJournalEntry={handleJournalEntry}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'meditation' && (
          <MeditationLibrary
            onBack={() => setActiveView('overview')}
          />
        )}

        {/* Breathing Modal */}
        {showMeditation && (
          <Meditation
            onComplete={handleMeditationComplete}
            onClose={() => setShowMeditation(false)}
          />
        )}
        </div>
      </div>
    </div>
  );
};

export default WellnessRecommendations;
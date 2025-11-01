import React, { useState, useEffect } from 'react';
import Meditation from '../Meditation/Meditation';
import './MeditationLibrary.css';

const MeditationLibrary = ({ onBack }) => {
  const [selectedSession, setSelectedSession] = useState(null);
  const [showMeditation, setShowMeditation] = useState(false);
  const [completedSessions, setCompletedSessions] = useState([]);
  const [currentCategory, setCurrentCategory] = useState('all');

  const meditationSessions = [
    // 3-Minute Sessions
    {
      id: 'stress-relief-3',
      title: 'Quick Stress Relief',
      duration: 3,
      category: 'stress',
      level: 'beginner',
      description: 'A quick 3-minute session to immediately reduce stress and anxiety.',
      benefits: ['Reduces cortisol', 'Calms nervous system', 'Quick relief'],
      thumbnail: '🌊',
      bgColor: 'from-blue-400 to-cyan-300',
      audioUrl: null, // Placeholder for future audio
      transcript: `Welcome to your 3-minute stress relief session. Find a comfortable position and gently close your eyes.

Begin by taking a deep breath in through your nose, counting to four. Hold for two seconds, and exhale slowly through your mouth for six counts.

Imagine a wave of calm washing over you with each exhale. Any tension in your shoulders releases. Your jaw unclenches. Your brow smooths.

Continue breathing deeply. With each breath in, gather peace. With each breath out, release stress.

One more deep breath. Inhale calm, exhale tension.

When you're ready, slowly open your eyes. You've completed your stress relief session.`
    },
    {
      id: 'focus-3',
      title: 'Focus & Clarity',
      duration: 3,
      category: 'focus',
      level: 'beginner',
      description: 'Quick mental reset to improve concentration and mental clarity.',
      benefits: ['Improves focus', 'Clears mental fog', 'Enhances productivity'],
      thumbnail: '🎯',
      bgColor: 'from-purple-400 to-pink-300',
      audioUrl: null,
      transcript: `Let's begin your 3-minute focus session. Sit comfortably with your back straight and feet flat on the floor.

Close your eyes and bring your attention to your breath. Notice the sensation of air entering and leaving your body.

If your mind wanders, gently guide it back to your breath. No judgment, just return to the present moment.

Imagine your mind as a clear blue sky. Thoughts are like clouds passing through. You are the sky, not the clouds.

Return to your breath. One more minute of focused awareness.

When ready, open your eyes. Your mind is clear and ready for focused work.`
    },
    {
      id: 'anxiety-3',
      title: 'Anxiety Relief',
      duration: 3,
      category: 'anxiety',
      level: 'beginner',
      description: 'Soothing techniques to manage anxiety and panic symptoms.',
      benefits: ['Calms anxiety', 'Reduces panic', 'Grounding technique'],
      thumbnail: '🕊️',
      bgColor: 'from-green-400 to-teal-300',
      audioUrl: null,
      transcript: `Welcome to your anxiety relief practice. Place your feet firmly on the ground and your hands on your lap.

Notice five things you can see around you. Four things you can touch. Three things you can hear. Two things you can smell. One thing you can taste.

Now focus on your breath. Breathe in for four counts, hold for four, exhale for four, hold for four. This box breathing calms your nervous system.

You are safe. You are grounded. This feeling will pass.

Continue breathing. You are in control.

Slowly open your eyes when you feel ready.`
    },
    // 5-Minute Sessions
    {
      id: 'stress-relief-5',
      title: 'Deep Stress Release',
      duration: 5,
      category: 'stress',
      level: 'intermediate',
      description: 'A deeper 5-minute session for thorough stress relief and relaxation.',
      benefits: ['Deep relaxation', 'Muscle tension release', 'Mental clarity'],
      thumbnail: '🌊',
      bgColor: 'from-blue-500 to-blue-300',
      audioUrl: null,
      transcript: `Welcome to your 5-minute deep stress release session. Find a comfortable position where you won't be disturbed.

Start with three deep cleansing breaths. Inhale peace, exhale tension.

Now bring your attention to your body. Starting at your toes, notice any tension. Imagine warmth flowing down, releasing all tightness.

Move to your feet, ankles, calves. With each exhale, let go of stress.

Your thighs, hips, and lower back. Allow them to feel heavy and relaxed.

Your stomach and chest. Breathe into these areas, releasing any holding.

Your shoulders, neck, and jaw. Let them drop and soften.

Your forehead and scalp. Smooth away any tension.

You are completely relaxed. Sit in this peace for one more minute.

When ready, slowly return to awareness, feeling refreshed and renewed.`
    },
    {
      id: 'sleep-5',
      title: 'Sleep Preparation',
      duration: 5,
      category: 'sleep',
      level: 'beginner',
      description: 'Gentle meditation to prepare your mind and body for restful sleep.',
      benefits: ['Better sleep quality', 'Faster sleep onset', 'Reduced insomnia'],
      thumbnail: '🌙',
      bgColor: 'from-indigo-500 to-purple-300',
      audioUrl: null,
      transcript: `Welcome to your sleep preparation meditation. Lie down comfortably in your bed.

Close your eyes and take a deep breath. Today is complete. Tomorrow can wait.

Bring your attention to your body. Feel the weight of your body sinking into the mattress.

Your legs feel heavy and relaxed. Your arms feel heavy and relaxed.

Your breathing is slow and regular. Each breath takes you deeper into relaxation.

Any thoughts that arise, acknowledge them and let them float away like clouds.

Your mind is becoming quiet. Your body is becoming heavy.

You are ready for sleep. Safe, comfortable, and at peace.

Drift off naturally when you're ready. Good night.`
    },
    {
      id: 'mindfulness-5',
      title: 'Mindful Awareness',
      duration: 5,
      category: 'mindfulness',
      level: 'intermediate',
      description: 'Practice present-moment awareness and non-judgmental observation.',
      benefits: ['Increases awareness', 'Reduces rumination', 'Emotional regulation'],
      thumbnail: '🧘',
      bgColor: 'from-teal-500 to-green-300',
      audioUrl: null,
      transcript: `Welcome to your mindfulness practice. Sit comfortably with an upright but relaxed posture.

Close your eyes and bring your attention to the present moment.

Notice the sounds around you without judging them. Just observe.

Notice the temperature of the air on your skin. The feeling of your clothes.

Bring attention to your breath. Notice the rhythm without trying to change it.

Thoughts will come and go. Watch them like clouds passing in the sky.

Emotions will arise. Acknowledge them without getting carried away.

You are the observer, not the experience. You are awareness itself.

Rest in this open, accepting awareness for one more minute.

When ready, gently open your eyes, bringing this mindful quality into your day.`
    },
    // 10-Minute Sessions
    {
      id: 'stress-relief-10',
      title: 'Complete Stress Reset',
      duration: 10,
      category: 'stress',
      level: 'advanced',
      description: 'Comprehensive stress relief with progressive muscle relaxation and visualization.',
      benefits: ['Complete stress release', 'Body scan', 'Visualization technique'],
      thumbnail: '🌊',
      bgColor: 'from-blue-600 to-cyan-400',
      audioUrl: null,
      transcript: `Welcome to your 10-minute complete stress reset. Make yourself comfortable and prepare for deep relaxation.

Begin with diaphragmatic breathing. Place one hand on your belly and feel it rise and fall.

Now we'll practice progressive muscle relaxation. Start with your feet. Tense them tightly for 5 seconds, then completely release.

Your calves and shins. Tense, hold, and release. Feel the warmth of relaxation.

Your thighs and glutes. Tense, hold, and release.

Your abdomen and lower back. Tense, hold, and release.

Your chest and upper back. Tense, hold, and release.

Your shoulders. Shrug them up to your ears, hold, and let them drop completely.

Your arms and hands. Make fists, hold, and release with a sigh.

Your neck and jaw. Gently tense, hold, and release.

Your face. Scrunch everything up, hold, and completely relax.

Your entire body is now deeply relaxed. Imagine you're floating on a peaceful lake. The sun warms your skin. Gentle waves rock you comfortingly.

Any remaining stress dissolves into the water. You are completely at peace.

Stay here, floating in tranquility, for several more minutes.

When you're ready, slowly bring your awareness back. Wiggle your fingers and toes. Take a deep refreshing breath.

You are renewed, refreshed, and completely stress-free.`
    },
    {
      id: 'anxiety-10',
      title: 'Anxiety Transformation',
      duration: 10,
      category: 'anxiety',
      level: 'advanced',
      description: 'Advanced techniques to transform anxiety into calm confidence.',
      benefits: ['Transforms anxiety', 'Builds resilience', 'Long-term relief'],
      thumbnail: '🕊️',
      bgColor: 'from-green-600 to-teal-400',
      audioUrl: null,
      transcript: `Welcome to your 10-minute anxiety transformation practice. Today, we'll transform anxious energy into peaceful strength.

Start by acknowledging your anxiety without judgment. It's just your body trying to protect you.

Place your hand on your heart. Feel its rhythm. Thank your body for caring about your wellbeing.

Now, visualize your anxiety as a storm cloud overhead. Watch it without fear.

Breathe in courage, breathe out doubt. With each exhale, the cloud becomes smaller.

Imagine roots growing from your feet deep into the earth. You are stable and grounded.

The storm cloud begins to transform. Rain starts falling - but this is cleansing rain, nourishing the earth.

As the rain falls, new growth appears. Flowers of peace, trees of strength.

The cloud has completely transformed into a gentle, nourishing rain that helps everything grow.

You are the earth - strong, grounded, able to weather any storm.

Sit in this transformed state. Feel the strength and peace that comes from accepting and transforming difficult emotions.

You have the power to transform any challenge into growth.

When ready, take a deep breath and open your eyes, bringing this strength with you.`
    },
    {
      id: 'focus-10',
      title: 'Deep Concentration',
      duration: 10,
      category: 'focus',
      level: 'advanced',
      description: 'Advanced concentration practice for enhanced mental performance and clarity.',
      benefits: ['Laser focus', 'Mental endurance', 'Peak performance'],
      thumbnail: '🎯',
      bgColor: 'from-purple-600 to-pink-400',
      audioUrl: null,
      transcript: `Welcome to your 10-minute deep concentration practice. This session will train your mind to maintain focus for extended periods.

Sit with a straight spine and alert but relaxed posture.

Close your eyes and bring your attention to the point between your eyebrows. This is your third eye center.

Visualize a small, bright point of light at this spot. This light represents your focused awareness.

Your only task for the next 8 minutes is to keep your attention on this point of light.

When your mind wanders - and it will - gently return your attention to the light. No frustration, no judgment. Just return.

The light grows brighter with each return of your attention. It becomes more stable, more radiant.

Your thoughts become quieter. Your mind becomes clearer. The light fills your entire inner landscape.

You are completely absorbed in this focused awareness. Time seems to stand still.

This is the state of flow, of complete concentration. You can achieve anything in this state.

Rest in this powerful focus for two more minutes.

When you're ready, slowly let the light fade but keep the feeling of focused clarity with you.

Open your eyes. Your mind is sharp, clear, and ready for any task.`
    }
  ];

  const categories = [
    { id: 'all', name: 'All Sessions', icon: '📚' },
    { id: 'stress', name: 'Stress Relief', icon: '🌊' },
    { id: 'anxiety', name: 'Anxiety', icon: '🕊️' },
    { id: 'focus', name: 'Focus', icon: '🎯' },
    { id: 'sleep', name: 'Sleep', icon: '🌙' },
    { id: 'mindfulness', name: 'Mindfulness', icon: '🧘' }
  ];

  useEffect(() => {
    const sessions = JSON.parse(localStorage.getItem('meditationSessions') || '[]');
    setCompletedSessions(sessions);
  }, []);

  const handleSessionSelect = (session) => {
    setSelectedSession(session);
    setShowMeditation(true);
  };

  const handleMeditationComplete = () => {
    if (selectedSession) {
      const newSession = {
        id: selectedSession.id,
        title: selectedSession.title,
        duration: selectedSession.duration,
        category: selectedSession.category,
        date: new Date().toDateString(),
        timestamp: new Date().toISOString(),
        completed: true
      };

      const sessions = JSON.parse(localStorage.getItem('meditationSessions') || '[]');
      sessions.push(newSession);
      localStorage.setItem('meditationSessions', JSON.stringify(sessions));
      setCompletedSessions(sessions);
    }
    setShowMeditation(false);
    setSelectedSession(null);
  };

  const isSessionCompleted = (sessionId) => {
    return completedSessions.some(session => session.id === sessionId);
  };

  const getFilteredSessions = () => {
    if (currentCategory === 'all') {
      return meditationSessions;
    }
    return meditationSessions.filter(session => session.category === currentCategory);
  };

  const getSessionsByDuration = () => {
    const filtered = getFilteredSessions();
    return {
      '3 min': filtered.filter(s => s.duration === 3),
      '5 min': filtered.filter(s => s.duration === 5),
      '10 min': filtered.filter(s => s.duration === 10)
    };
  };

  const sessionsByDuration = getSessionsByDuration();

  return (
    <div className="meditation-layout">
      {onBack && (
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
      )}

      <div className="meditation-header">
        <h1 className="meditation-title">Meditation</h1>
        <p className="meditation-subtitle">
          Guided sessions for relaxation and focus
        </p>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        <div className="category-tabs">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setCurrentCategory(category.id)}
              className={`category-tab ${currentCategory === category.id ? 'active' : ''}`}
            >
              <span className="category-icon">{category.icon}</span>
              <span className="category-name">{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Session Groups by Duration */}
      <div className="session-groups">
        {Object.entries(sessionsByDuration).map(([duration, sessions]) => (
          <div key={duration} className="duration-group">
            <h3 className="duration-title">{duration} Sessions</h3>
            <div className="sessions-grid">
              {sessions.map((session) => (
                <div
                  key={session.id}
                  className={`session-card ${isSessionCompleted(session.id) ? 'completed' : ''}`}
                  onClick={() => handleSessionSelect(session)}
                >
                  <div className={`session-header bg-gradient-to-br ${session.bgColor}`}>
                    <div className="session-thumbnail">{session.thumbnail}</div>
                    <div className="session-duration">{session.duration} min</div>
                    {isSessionCompleted(session.id) && (
                      <div className="completed-badge">✅</div>
                    )}
                  </div>

                  <div className="session-content">
                    <h4 className="session-title">{session.title}</h4>
                    <p className="session-description">{session.description}</p>

                    <div className="session-meta">
                      <span className="session-level">
                        {session.level === 'beginner' && '🌱'}
                        {session.level === 'intermediate' && '🌿'}
                        {session.level === 'advanced' && '🌳'}
                        {session.level}
                      </span>
                      <span className="session-category">
                        {categories.find(c => c.id === session.category)?.icon}
                      </span>
                    </div>

                    <div className="session-benefits">
                      {session.benefits.map((benefit, index) => (
                        <span key={index} className="benefit-tag">
                          {benefit}
                        </span>
                      ))}
                    </div>

                    <button className="start-session-btn">
                      {isSessionCompleted(session.id) ? '🔄 Repeat' : '▶️ Start'} Session
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {sessions.length === 0 && (
              <div className="no-sessions">
                <p>No sessions available in this category yet.</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress Summary */}
      <div className="progress-summary">
        <h3>Your Meditation Progress</h3>
        <div className="progress-stats">
          <div className="stat-item">
            <span className="stat-number">{completedSessions.length}</span>
            <span className="stat-label">Sessions Completed</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {completedSessions.reduce((total, session) => total + session.duration, 0)}
            </span>
            <span className="stat-label">Total Minutes</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">
              {completedSessions.filter(s =>
                s.date === new Date().toDateString()
              ).length}
            </span>
            <span className="stat-label">Today</span>
          </div>
        </div>
      </div>

      {/* Meditation Modal */}
      {showMeditation && selectedSession && (
        <div className="meditation-modal">
          <div className="meditation-overlay">
            <Meditation
              onComplete={handleMeditationComplete}
              onClose={() => setShowMeditation(false)}
            />
            <div className="session-info">
              <h4>{selectedSession.title}</h4>
              <p>{selectedSession.transcript}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeditationLibrary;
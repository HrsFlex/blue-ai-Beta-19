import React, { useState } from 'react';
import './MoodTracker.css';

const MoodTracker = ({ onMoodSelect, mandatory = false }) => {
  const [selectedMood, setSelectedMood] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const moods = [
    {
      id: 'great',
      emoji: '😊',
      label: 'Feeling Great',
      description: 'Much better than before!',
      color: '#34a853'
    },
    {
      id: 'good',
      emoji: '🙂',
      label: 'Feeling Good',
      description: 'Some improvement',
      color: '#4285f4'
    },
    {
      id: 'same',
      emoji: '😐',
      label: 'About the Same',
      description: 'No real change',
      color: '#fbbc04'
    },
    {
      id: 'bad',
      emoji: '😔',
      label: 'Still Feeling Down',
      description: 'Need more support',
      color: '#ea4335'
    }
  ];

  const handleMoodClick = (mood) => {
    setSelectedMood(mood);
    setShowDetails(true);
  };

  const handleConfirm = () => {
    if (selectedMood) {
      const isPositive = selectedMood.id === 'great' || selectedMood.id === 'good';
      onMoodSelect(isPositive ? 'good' : 'bad');
    }
  };

  const handleRetry = () => {
    setSelectedMood(null);
    setShowDetails(false);
  };

  return (
    <div className="mood-tracker-container">
      <div className="mood-tracker-card">
        <div className="mood-header">
          <div className="mood-emoji">💭</div>
          <h3>How are you feeling now?</h3>
          <p>After watching those videos, has your mood improved?</p>
        </div>

        {!showDetails ? (
          <div className="mood-options">
            {moods.map((mood) => (
              <button
                key={mood.id}
                className="mood-option"
                onClick={() => handleMoodClick(mood)}
                style={{ '--mood-color': mood.color }}
              >
                <div className="mood-emoji-large">{mood.emoji}</div>
                <div className="mood-label">{mood.label}</div>
              </button>
            ))}
          </div>
        ) : (
          <div className="mood-confirmation">
            <div className="selected-mood">
              <div className="selected-emoji" style={{ color: selectedMood.color }}>
                {selectedMood.emoji}
              </div>
              <h4>{selectedMood.label}</h4>
              <p>{selectedMood.description}</p>
            </div>

            <div className="confirmation-message">
              {selectedMood.id === 'great' || selectedMood.id === 'good' ? (
                <div className="positive-message">
                  <div className="message-icon">🎉</div>
                  <p>That's wonderful! I'm so glad the content helped brighten your day!</p>
                </div>
              ) : (
                <div className="concern-message">
                  <div className="message-icon">💙</div>
                  <p>It's okay to still feel down. Sometimes we need additional support, and that's perfectly fine.</p>
                </div>
              )}
            </div>

            <div className="confirmation-actions">
              <button
                className="retry-button"
                onClick={handleRetry}
              >
                Choose Different Mood
              </button>
              <button
                className="confirm-button"
                onClick={handleConfirm}
                style={{
                  background: selectedMood.id === 'great' || selectedMood.id === 'good'
                    ? 'linear-gradient(135deg, #34a853, #4285f4)'
                    : 'linear-gradient(135deg, #ea4335, #fbbc04)'
                }}
              >
                {selectedMood.id === 'great' || selectedMood.id === 'good'
                  ? 'Complete Session ✨'
                  : 'Get More Support 💙'}
              </button>
            </div>
          </div>
        )}

        <div className="mood-footer">
          <div className="wellness-tip">
            <span className="tip-icon">💡</span>
            <span>Remember: Your mental health journey is unique, and every step counts!</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodTracker;
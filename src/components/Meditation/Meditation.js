import React, { useState, useEffect } from 'react';
import './Meditation.css';

const Meditation = ({ onComplete, onClose }) => {
  const [isActive, setIsActive] = useState(false);
  const [phase, setPhase] = useState('prepare'); // prepare, inhale, hold, exhale, complete
  const [countdown, setCountdown] = useState(3);
  const [breathCount, setBreathCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(180); // 3 minutes in seconds

  useEffect(() => {
    let interval;

    if (isActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isActive) {
      handleComplete();
    }

    return () => clearInterval(interval);
  }, [isActive, timeRemaining]);

  useEffect(() => {
    let interval;

    if (isActive && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(count => count - 1);
      }, 1000);
    } else if (countdown === 0 && phase === 'prepare') {
      setPhase('inhale');
      setCountdown(4);
      setIsActive(true);
    }

    return () => clearInterval(interval);
  }, [isActive, countdown, phase]);

  useEffect(() => {
    let interval;

    if (isActive && phase !== 'prepare' && countdown > 0) {
      interval = setInterval(() => {
        setCountdown(count => count - 1);
      }, 1000);
    } else if (countdown === 0 && phase !== 'prepare') {
      handlePhaseTransition();
    }

    return () => clearInterval(interval);
  }, [isActive, countdown, phase]);

  const handlePhaseTransition = () => {
    switch (phase) {
      case 'inhale':
        setPhase('hold');
        setCountdown(4);
        break;
      case 'hold':
        setPhase('exhale');
        setCountdown(6);
        break;
      case 'exhale':
        setBreathCount(count => count + 1);
        if (breathCount >= 11) { // After 12 breaths
          handleComplete();
        } else {
          setPhase('inhale');
          setCountdown(4);
        }
        break;
      default:
        break;
    }
  };

  const handleComplete = () => {
    setPhase('complete');
    setIsActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getPhaseMessage = () => {
    switch (phase) {
      case 'prepare':
        return "Get ready to start your breathing exercise...";
      case 'inhale':
        return "Breathe In Slowly Through Your Nose";
      case 'hold':
        return "Hold Your Breath Gently";
      case 'exhale':
        return "Exhale Slowly Through Your Mouth";
      case 'complete':
        return "Excellent! You've completed your breathing exercise!";
      default:
        return "";
    }
  };

  const getPhaseColor = () => {
    switch (phase) {
      case 'inhale':
        return '#4CAF50'; // Green
      case 'hold':
        return '#FF9800'; // Orange
      case 'exhale':
        return '#2196F3'; // Blue
      case 'complete':
        return '#9C27B0'; // Purple
      default:
        return '#666';
    }
  };

  return (
    <div className="meditation-overlay">
      <div className="meditation-container">
        <button className="close-button" onClick={onClose}>×</button>

        <div className="meditation-header">
          <h2>🧘‍♀️ Breathing Exercise</h2>
          <p className="timer">{formatTime(timeRemaining)}</p>
          <p className="breath-counter">Breath {Math.min(breathCount + 1, 12)} of 12</p>
        </div>

        <div className="breathing-circle" style={{ borderColor: getPhaseColor() }}>
          <div
            className={`breath-indicator ${phase}`}
            style={{
              transform: phase === 'inhale' ? 'scale(1.3)' : phase === 'exhale' ? 'scale(0.7)' : 'scale(1)',
              backgroundColor: getPhaseColor()
            }}
          >
            <span className="countdown-number">{countdown}</span>
          </div>
        </div>

        <div className="meditation-instructions">
          <h3 style={{ color: getPhaseColor() }}>{getPhaseMessage()}</h3>

          {phase === 'prepare' && (
            <p>Find a comfortable position, close your eyes, and relax your shoulders.</p>
          )}

          {phase === 'inhale' && (
            <p>Breathe in through your nose for 4 counts, feeling your belly expand.</p>
          )}

          {phase === 'hold' && (
            <p>Hold your breath gently for 4 counts. Don't strain.</p>
          )}

          {phase === 'exhale' && (
            <p>Exhale slowly through your mouth for 6 counts, feeling your body relax.</p>
          )}
        </div>

        {phase === 'complete' && (
          <div className="completion-section">
            <h3>🎉 Well Done!</h3>
            <p>You've completed a 3-minute breathing exercise!</p>
            <p>You earned +15 wellness points! 🌟</p>
            <div className="completion-buttons">
              <button className="complete-button" onClick={onComplete}>
                Complete & Continue
              </button>
              <button className="repeat-button" onClick={() => window.location.reload()}>
                Do Another Session
              </button>
            </div>
          </div>
        )}

        {phase !== 'complete' && (
          <div className="meditation-controls">
            <button
              className="pause-button"
              onClick={() => setIsActive(!isActive)}
            >
              {isActive ? '⏸️ Pause' : '▶️ Resume'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Meditation;
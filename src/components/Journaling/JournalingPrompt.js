import React, { useState, useEffect } from 'react';
import './JournalingPrompt.css';

const JournalingPrompt = ({ onJournalEntry, onBack }) => {
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [journalText, setJournalText] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes in seconds
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [savedEntries, setSavedEntries] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [moodBefore, setMoodBefore] = useState('');
  const [moodAfter, setMoodAfter] = useState('');

  const journalPrompts = [
    "What is one thing you are grateful for today and why?",
    "Describe a moment today when you felt proud of yourself.",
    "What challenged you today, and how did you handle it?",
    "Write about something that made you smile today.",
    "What is something you learned about yourself recently?",
    "Describe your ideal peaceful moment.",
    "What would you tell your younger self today?",
    "List three things that went well today.",
    "What are you looking forward to tomorrow?",
    "Describe a recent act of kindness you witnessed or performed.",
    "What is something you need to forgive yourself for?",
    "Write about a place where you feel completely at peace.",
    "What are three things you appreciate about yourself?",
    "Describe your happiest memory in detail.",
    "What is something you're currently worried about? How can you reframe it?"
  ];

  const moods = [
    { emoji: '😊', label: 'Happy', color: '#34a853' },
    { emoji: '😌', label: 'Calm', color: '#4285f4' },
    { emoji: '😔', label: 'Sad', color: '#fbbc04' },
    { emoji: '😰', label: 'Anxious', color: '#ea4335' },
    { emoji: '😤', label: 'Frustrated', color: '#ff6b6b' },
    { emoji: '🤗', label: 'Excited', color: '#9c27b0' }
  ];

  useEffect(() => {
    generateNewPrompt();
    loadSavedEntries();
  }, []);

  useEffect(() => {
    let interval;
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(time => time - 1);
      }, 1000);
    } else if (timeRemaining === 0 && isTimerActive) {
      handleSaveEntry();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, timeRemaining]);

  const generateNewPrompt = () => {
    const randomPrompt = journalPrompts[Math.floor(Math.random() * journalPrompts.length)];
    setCurrentPrompt(randomPrompt);
    setJournalText('');
    setMoodBefore('');
    setMoodAfter('');
    setIsWriting(false);
    setTimeRemaining(300);
    setIsTimerActive(false);
  };

  const loadSavedEntries = () => {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    setSavedEntries(entries.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 5));
  };

  const handleStartWriting = () => {
    setIsWriting(true);
    setIsTimerActive(true);
  };

  const handleSaveEntry = () => {
    if (journalText.trim().length < 10) {
      alert('Please write at least a few sentences before saving.');
      return;
    }

    const entry = {
      id: Date.now(),
      prompt: currentPrompt,
      text: journalText,
      moodBefore,
      moodAfter,
      date: new Date().toDateString(),
      timestamp: new Date().toISOString(),
      wordCount: journalText.split(' ').length,
      timeSpent: 300 - timeRemaining
    };

    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    entries.push(entry);
    localStorage.setItem('journalEntries', JSON.stringify(entries));

    onJournalEntry(entry);
    loadSavedEntries();
    generateNewPrompt();
    setIsTimerActive(false);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const deleteEntry = (entryId) => {
    const entries = JSON.parse(localStorage.getItem('journalEntries') || '[]');
    const updatedEntries = entries.filter(entry => entry.id !== entryId);
    localStorage.setItem('journalEntries', JSON.stringify(updatedEntries));
    loadSavedEntries();
  };

  return (
    <div className="journal-layout">
      {onBack && (
        <button onClick={onBack} className="back-button">
          ← Back
        </button>
      )}

      {!isWriting ? (
        <div className="journal-start">
          <div className="journal-header">
            <h1 className="journal-title">Daily Journal</h1>
            <p className="journal-description">
              A simple practice to reflect on your thoughts and feelings
            </p>
          </div>

          <div className="prompt-display">
            <div className="prompt-label">Today's question</div>
            <p className="prompt-text">{currentPrompt}</p>
          </div>

          <div className="mood-section">
            <label className="mood-question">How are you feeling?</label>
            <div className="mood-grid">
              {moods.map((mood) => (
                <button
                  key={mood.label}
                  className={`mood-button ${moodBefore === mood.label ? 'selected' : ''}`}
                  onClick={() => setMoodBefore(mood.label)}
                >
                  <span className="mood-emoji">{mood.emoji}</span>
                  <span className="mood-label">{mood.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleStartWriting}
            disabled={!moodBefore}
            className={`start-button ${moodBefore ? 'ready' : 'disabled'}`}
          >
            Start writing
          </button>
        </div>
      ) : (
        <div className="journal-write">
          <div className="write-header">
            <div className="timer-display">
              <span className="timer-text">{formatTime(timeRemaining)}</span>
              <button
                onClick={() => setIsTimerActive(!isTimerActive)}
                className="timer-button"
              >
                {isTimerActive ? '⏸' : '▶'}
              </button>
            </div>
            <button onClick={() => setIsWriting(false)} className="cancel-button">
              Cancel
            </button>
          </div>

          <div className="write-prompt">
            <span className="prompt-tag">Question:</span>
            <p>{currentPrompt}</p>
          </div>

          <textarea
            value={journalText}
            onChange={(e) => setJournalText(e.target.value)}
            placeholder="Just start writing. Don't worry about grammar or spelling..."
            className="write-area"
            autoFocus
          />

          <div className="write-footer">
            <span className="word-counter">
              {journalText.split(' ').filter(word => word.length > 0).length} words
            </span>
            <button
              onClick={handleSaveEntry}
              disabled={journalText.trim().length < 10}
              className={`save-button ${journalText.trim().length >= 10 ? 'ready' : 'disabled'}`}
            >
              Save entry
            </button>
          </div>
        </div>
      )}

      {/* Recent Entries */}
      {savedEntries.length > 0 && (
        <div className="recent-entries">
          <div className="recent-header">
            <h3 className="recent-title">Recent entries</h3>
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="toggle-button"
            >
              {showHistory ? 'Hide' : 'Show'}
            </button>
          </div>

          {showHistory && (
            <div className="entries-grid">
              {savedEntries.slice(0, 5).map((entry) => (
                <div key={entry.id} className="entry-preview">
                  <div className="entry-top">
                    <span className="entry-mood">
                      {moods.find(m => m.label === entry.moodBefore)?.emoji}
                    </span>
                    <span className="entry-date">
                      {new Date(entry.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </span>
                  </div>
                  <p className="entry-excerpt">
                    {entry.text.length > 100
                      ? `${entry.text.substring(0, 100)}...`
                      : entry.text}
                  </p>
                  <button
                    onClick={() => deleteEntry(entry.id)}
                    className="delete-entry"
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalingPrompt;
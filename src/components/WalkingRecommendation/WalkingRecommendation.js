import React, { useState } from 'react';
import './WalkingRecommendation.css';

const WalkingRecommendation = ({ onClose, onAccept, onDecline }) => {
  const [showTips, setShowTips] = useState(false);

  const walkingTips = [
    {
      title: 'Comfortable Shoes',
      description: 'Wear supportive footwear to prevent discomfort'
    },
    {
      title: 'Uplifting Music',
      description: 'Create a playlist of songs that make you happy'
    },
    {
      title: 'Hands-Free',
      description: 'Keep your phone in your pocket to stay present'
    },
    {
      title: 'Nature Route',
      description: 'Choose a park or tree-lined street if possible'
    },
    {
      title: '15-20 Minutes',
      description: 'Start with a comfortable duration and pace'
    },
    {
      title: 'Mindful Steps',
      description: 'Focus on your breathing and surroundings'
    }
  ];

  const benefits = [
    { text: 'Improves mood and mental clarity' },
    { text: 'Releases natural endorphins' },
    { text: 'Reduces stress and anxiety' },
    { text: 'Boosts physical health' }
  ];

  const handleAcceptWalk = () => {
    onAccept();
    onClose();
  };

  const handleDeclineWalk = () => {
    onDecline();
    onClose();
  };

  return (
    <div className="walking-recommendation-overlay">
      <div className="walking-recommendation-modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="walk-icon">Walk</div>
            <h3>Time for a Healing Walk</h3>
            <p>Gentle movement can significantly boost your mood and wellbeing</p>
          </div>
          <button className="close-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="modal-content">
          <div className="main-message">
            <div className="message-icon">Support</div>
            <h4>Take 15 Minutes for Yourself</h4>
            <p>
              I understand that the videos didn't fully lift your spirits. A gentle walk is one of the most effective ways to improve your mood naturally. The combination of fresh air, light movement, and change of scenery can make a real difference.
            </p>
          </div>

          <div className="benefits-section">
            <h4>Why a Walk Helps</h4>
            <div className="benefits-grid">
              {benefits.map((benefit, index) => (
                <div key={index} className="benefit-item">
                  <span className="benefit-text">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="tips-section">
            <button
              className="tips-toggle-btn"
              onClick={() => setShowTips(!showTips)}
            >
              {showTips ? 'Hide' : 'Show'} Walking Tips
            </button>

            {showTips && (
              <div className="tips-content">
                <h5>Tips for a Mood-Boosting Walk</h5>
                <div className="tips-grid">
                  {walkingTips.map((tip, index) => (
                    <div key={index} className="tip-card">
                      <div className="tip-content">
                        <h6>{tip.title}</h6>
                        <p>{tip.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="encouragement-section">
            <div className="encouragement-message">
              <p>
                <strong>You deserve this moment of self-care.</strong> Even a short walk can create positive changes in your mind and body. Be gentle with yourself - every step forward is progress.
              </p>
            </div>
          </div>

          <div className="action-section">
            <button
              className="accept-walk-btn"
              onClick={handleAcceptWalk}
            >
              <span className="btn-text">
                <strong>I'll Take a Walk</strong>
                <small>Start my 15-minute wellness break</small>
              </span>
            </button>

            <button
              className="decline-walk-btn"
              onClick={handleDeclineWalk}
            >
              <span className="btn-text">
                <strong>I'd Prefer to Talk</strong>
                <small>Continue with other support options</small>
              </span>
            </button>
          </div>

          <div className="alternative-note">
            <p>
              Not ready for a walk? That's completely okay. Choose what feels right for you right now - there are many paths to feeling better.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalkingRecommendation;
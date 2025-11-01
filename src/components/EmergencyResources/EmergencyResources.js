import React, { useState, useEffect } from 'react';
import './EmergencyResources.css';
import NotificationService from '../../services/NotificationService';
import UserDataService from '../../services/UserDataService';
import AppointmentService from '../../services/AppointmentService';

const EmergencyResources = ({ onClose, crisisLevel = 3 }) => {
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [localResources, setLocalResources] = useState([]);
  const [showSafetyPlan, setShowSafetyPlan] = useState(false);
  const [showCopingStrategies, setShowCopingStrategies] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [bookingEmergency, setBookingEmergency] = useState(false);

  const currentUser = UserDataService.getCurrentUser();

  useEffect(() => {
    loadEmergencyResources();
    getUserLocation();
  }, []);

  const loadEmergencyResources = () => {
    setEmergencyContacts([
      {
        name: '988 Suicide & Crisis Lifeline',
        phone: '988',
        description: '24/7 free, confidential support for people in distress',
        website: 'https://988lifeline.org',
        available: '24/7',
        type: 'crisis',
        priority: 1
      },
      {
        name: 'Crisis Text Line',
        phone: 'Text HOME to 741741',
        description: 'Free 24/7 support via text message',
        website: 'https://www.crisistextline.org',
        available: '24/7',
        type: 'crisis',
        priority: 2
      },
      {
        name: 'National Suicide Prevention Lifeline',
        phone: '1-800-273-8255',
        description: '24/7 suicide prevention and crisis support',
        website: 'https://suicidepreventionlifeline.org',
        available: '24/7',
        type: 'crisis',
        priority: 3
      },
      {
        name: 'The Trevor Project',
        phone: '1-866-488-7386',
        description: 'Crisis intervention and suicide prevention for LGBTQ youth',
        website: 'https://www.thetrevorproject.org',
        available: '24/7',
        type: 'specialized',
        priority: 4
      },
      {
        name: 'Veterans Crisis Line',
        phone: '988, Press 1',
        description: 'Confidential support for veterans and their families',
        website: 'https://www.veteranscrisisline.net',
        available: '24/7',
        type: 'specialized',
        priority: 5
      },
      {
        name: 'Emergency Services',
        phone: '911',
        description: 'For immediate life-threatening emergencies',
        available: '24/7',
        type: 'emergency',
        priority: 0
      }
    ]);

    // Mock local resources - in real app, these would be based on user location
    setLocalResources([
      {
        name: 'Local Mental Health Emergency Room',
        address: '123 Medical Center Drive',
        phone: '555-0123',
        distance: '2.5 miles',
        waitTime: '30-45 min',
        type: 'emergency_room'
      },
      {
        name: 'City Crisis Center',
        address: '456 Help Street',
        phone: '555-0456',
        distance: '3.8 miles',
        waitTime: '15-30 min',
        type: 'crisis_center'
      },
      {
        name: '24/7 Mental Health Urgent Care',
        address: '789 Wellness Avenue',
        phone: '555-0789',
        distance: '5.2 miles',
        waitTime: '20-40 min',
        type: 'urgent_care'
      }
    ]);
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
        },
        (error) => {
          console.log('Location access denied or unavailable');
        }
      );
    }
  };

  const handleCallEmergency = (phone) => {
    window.open(`tel:${phone}`);

    // Log the emergency call
    if (currentUser) {
      NotificationService.addNotification(currentUser.id, {
        type: 'crisis',
        title: 'Emergency Contact Made',
        message: `You called emergency support at ${phone}`,
        priority: 'urgent',
        showBrowser: false
      });
    }
  };

  const handleBookEmergencyAppointment = async () => {
    if (!currentUser) return;

    setBookingEmergency(true);
    try {
      const result = await AppointmentService.bookEmergencyAppointment(
        currentUser.id,
        crisisLevel
      );

      if (result.success) {
        NotificationService.createAppointmentConfirmation(currentUser.id, result.appointment);

        alert(`Emergency appointment booked with ${result.appointment.doctor.name} at ${result.appointment.timeSlot}. Check your notifications for details.`);
      } else {
        alert('Unable to book emergency appointment. Please call one of the crisis lines immediately.');
      }
    } catch (error) {
      console.error('Emergency booking error:', error);
      alert('Error booking appointment. Please call emergency services.');
    } finally {
      setBookingEmergency(false);
    }
  };

  const handleCreateSafetyPlan = () => {
    setShowSafetyPlan(true);

    // Log safety plan creation
    if (currentUser) {
      NotificationService.addNotification(currentUser.id, {
        type: 'wellness',
        title: 'Safety Plan Created',
        message: 'You\'ve started creating a safety plan. This is an important step for your wellbeing.',
        priority: 'high',
        showBrowser: true
      });
    }
  };

  const handleTextCrisisLine = () => {
    // In a real app, this would open the messaging app
    alert('Text HOME to 741741 to connect with Crisis Text Line');
  };

  return (
    <div className="emergency-resources-overlay">
      <div className="emergency-resources-modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="emergency-icon">🚨</div>
            <div>
              <h2>Emergency Resources</h2>
              <p>Immediate help is available 24/7. You are not alone.</p>
            </div>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Crisis Level Indicator */}
        <div className="crisis-level-indicator">
          <div className="crisis-level">
            <span className="level-label">Current Assessment:</span>
            <span className={`level-value level-${crisisLevel}`}>
              {crisisLevel === 5 && 'Critical - Immediate Action Required'}
              {crisisLevel === 4 && 'High - Professional Help Needed Now'}
              {crisisLevel === 3 && 'Moderate - Support Recommended'}
              {crisisLevel <= 2 && 'Low - Self-Care Strategies'}
            </span>
          </div>
        </div>

        {/* Immediate Actions */}
        <div className="immediate-actions">
          <h3>Immediate Actions</h3>
          <div className="action-grid">
            <button
              className="action-btn primary"
              onClick={() => handleCallEmergency('911')}
            >
              <span className="action-icon">📞</span>
              <div>
                <strong>Call 911</strong>
                <small>Life-threatening emergency</small>
              </div>
            </button>

            <button
              className="action-btn primary"
              onClick={() => handleCallEmergency('988')}
            >
              <span className="action-icon">💙</span>
              <div>
                <strong>Call 988</strong>
                <small>Crisis & Suicide Lifeline</small>
              </div>
            </button>

            <button
              className="action-btn secondary"
              onClick={handleTextCrisisLine}
            >
              <span className="action-icon">💬</span>
              <div>
                <strong>Text 741741</strong>
                <small>Crisis Text Line</small>
              </div>
            </button>

            <button
              className="action-btn secondary"
              onClick={handleBookEmergencyAppointment}
              disabled={bookingEmergency}
            >
              <span className="action-icon">🏥</span>
              <div>
                <strong>Emergency Appointment</strong>
                <small>{bookingEmergency ? 'Booking...' : 'Speak with professional'}</small>
              </div>
            </button>
          </div>
        </div>

        {/* Emergency Contacts */}
        <div className="emergency-contacts">
          <h3>24/7 Crisis Support</h3>
          <div className="contacts-grid">
            {emergencyContacts.map((contact, index) => (
              <div key={index} className="contact-card priority-high">
                <div className="contact-header">
                  <h4>{contact.name}</h4>
                  <span className="availability-badge">{contact.available}</span>
                </div>
                <p className="contact-description">{contact.description}</p>
                <div className="contact-actions">
                  {contact.phone && (
                    <button
                      className="contact-btn call"
                      onClick={() => handleCallEmergency(contact.phone)}
                    >
                      📞 {contact.phone}
                    </button>
                  )}
                  {contact.website && (
                    <a
                      href={contact.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="contact-btn website"
                    >
                      🌐 Visit Website
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Local Resources */}
        {localResources.length > 0 && (
          <div className="local-resources">
            <h3>Nearby Emergency Resources</h3>
            <div className="local-grid">
              {localResources.map((resource, index) => (
                <div key={index} className="local-card">
                  <div className="local-header">
                    <h4>{resource.name}</h4>
                    <span className="distance">{resource.distance}</span>
                  </div>
                  <p className="address">📍 {resource.address}</p>
                  <div className="local-info">
                    <span className="wait-time">⏱️ Wait: {resource.waitTime}</span>
                    <span className="phone">📞 {resource.phone}</span>
                  </div>
                  <button
                    className="local-btn"
                    onClick={() => handleCallEmergency(resource.phone)}
                  >
                    Call Now
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Coping Strategies */}
        <div className="coping-section">
          <div className="coping-header">
            <h3>Immediate Coping Strategies</h3>
            <button
              className="toggle-btn"
              onClick={() => setShowCopingStrategies(!showCopingStrategies)}
            >
              {showCopingStrategies ? 'Hide' : 'Show'} Strategies
            </button>
          </div>

          {showCopingStrategies && (
            <div className="coping-strategies">
              <div className="strategy-card">
                <h4>🫁 Breathing Exercise</h4>
                <ol>
                  <li>Breathe in slowly through nose for 4 counts</li>
                  <li>Hold breath for 4 counts</li>
                  <li>Breathe out slowly through mouth for 4 counts</li>
                  <li>Hold for 4 counts</li>
                  <li>Repeat 10-20 times</li>
                </ol>
              </div>

              <div className="strategy-card">
                <h4>👁️ 5-4-3-2-1 Grounding</h4>
                <ol>
                  <li>Name 5 things you can see</li>
                  <li>Name 4 things you can touch</li>
                  <li>Name 3 things you can hear</li>
                  <li>Name 2 things you can smell</li>
                  <li>Name 1 thing you can taste</li>
                </ol>
              </div>

              <div className="strategy-card">
                <h4>📱 Contact Support</h4>
                <ul>
                  <li>Call or text a trusted friend or family member</li>
                  <li>Contact your therapist or counselor</li>
                  <li>Join an online support group</li>
                  <li>Use a crisis chat service</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Safety Plan */}
        <div className="safety-plan-section">
          <button
            className="safety-plan-btn"
            onClick={handleCreateSafetyPlan}
          >
            📋 Create Safety Plan
          </button>
          <p className="safety-plan-description">
            A safety plan helps you prepare for future crisis moments and identify coping strategies that work for you.
          </p>
        </div>

        {/* Important Disclaimer */}
        <div className="disclaimer">
          <p><strong>Important:</strong> If you are in immediate danger or have thoughts of harming yourself, please call 911 or go to the nearest emergency room. These resources are not a substitute for professional medical care.</p>
        </div>
      </div>
    </div>
  );
};

export default EmergencyResources;
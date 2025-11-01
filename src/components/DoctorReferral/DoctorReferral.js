import React, { useState } from 'react';
import './DoctorReferral.css';

const DoctorReferral = ({ onClose, onBookAppointment }) => {
  const [selectedResource, setSelectedResource] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  const mentalHealthResources = [
    {
      id: 'hotline',
      title: '24/7 Crisis Hotline',
      description: 'Immediate support for emotional distress',
      phone: '988',
      availability: '24/7',
      type: 'emergency',
      icon: '📞',
      color: '#ea4335'
    },
    {
      id: 'therapy',
      title: 'Online Therapy Platform',
      description: 'Connect with licensed therapists online',
      website: 'https://www.betterhelp.com',
      availability: 'Varies',
      type: 'professional',
      icon: '💻',
      color: '#4285f4'
    },
    {
      id: 'community',
      title: 'Mental Health Support Groups',
      description: 'Peer support communities',
      website: 'https://www.nami.org/Support-Groups',
      availability: 'Weekly meetings',
      type: 'community',
      icon: '👥',
      color: '#34a853'
    },
    {
      id: 'resources',
      title: 'Mental Health Resources',
      description: 'Educational materials and self-help tools',
      website: 'https://www.nimh.nih.gov/health',
      availability: 'Always available',
      type: 'educational',
      icon: '📚',
      color: '#fbbc04'
    }
  ];

  const localDoctors = [
    {
      name: 'Dr. Sarah Johnson',
      specialty: 'Clinical Psychologist',
      experience: '10+ years',
      distance: '2.3 miles',
      rating: 4.8,
      availability: 'Available this week',
      consultationFee: '$150',
      telehealth: true,
      contact: {
        phone: '555-0123',
        website: 'www.drsjohnson.com'
      }
    },
    {
      name: 'Dr. Michael Chen',
      specialty: 'Psychiatrist',
      experience: '15+ years',
      distance: '3.1 miles',
      rating: 4.9,
      availability: 'Available tomorrow',
      consultationFee: '$200',
      telehealth: true,
      contact: {
        phone: '555-0456',
        website: 'www.drchenpsychiatry.com'
      }
    },
    {
      name: 'Dr. Emily Rodriguez',
      specialty: 'Licensed Counselor',
      experience: '8+ years',
      distance: '1.8 miles',
      rating: 4.7,
      availability: 'Available today',
      consultationFee: '$120',
      telehealth: true,
      contact: {
        phone: '555-0789',
        website: 'www.dremilyrodriguez.com'
      }
    }
  ];

  const handleResourceSelect = (resource) => {
    setSelectedResource(resource);
    setShowDetails(true);
  };

  const handleBack = () => {
    setShowDetails(false);
    setSelectedResource(null);
  };

  const handleContactResource = () => {
    if (selectedResource) {
      if (selectedResource.phone) {
        window.open(`tel:${selectedResource.phone}`);
      } else if (selectedResource.website) {
        window.open(selectedResource.website, '_blank');
      }
    }
  };

  const handleBookAppointment = (doctor) => {
    console.log('Booking appointment with doctor:', doctor);
    if (onBookAppointment) {
      onBookAppointment(doctor);
      onClose();
    } else {
      console.error('onBookAppointment function not provided');
    }
  };

  return (
    <div className="doctor-referral-overlay">
      <div className="doctor-referral-modal">
        <div className="modal-header">
          <div className="header-content">
            <div className="header-icon">💙</div>
            <h3>Mental Health Support</h3>
            <p>Professional resources are available to help you</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        {!showDetails ? (
          <div className="referral-content">
            <div className="resources-section">
              <h4>Immediate Support Options</h4>
              <div className="resources-grid">
                {mentalHealthResources.map((resource) => (
                  <button
                    key={resource.id}
                    className="resource-card"
                    onClick={() => handleResourceSelect(resource)}
                    style={{ '--resource-color': resource.color }}
                  >
                    <div className="resource-icon" style={{ color: resource.color }}>
                      {resource.icon}
                    </div>
                    <div className="resource-info">
                      <h5>{resource.title}</h5>
                      <p>{resource.description}</p>
                      <div className="resource-meta">
                        <span className="availability">{resource.availability}</span>
                        <span className={`type-badge ${resource.type}`}>
                          {resource.type}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="local-doctors-section">
              <h4>Local Mental Health Professionals</h4>
              <div className="doctors-list">
                {localDoctors.map((doctor, index) => (
                  <div key={index} className="doctor-card">
                    <div className="doctor-avatar">
                      <div className="avatar-placeholder">Dr.</div>
                    </div>
                    <div className="doctor-info">
                      <h5>{doctor.name}</h5>
                      <p className="specialty">{doctor.specialty}</p>
                      <div className="doctor-details">
                        <span className="experience">Experience: {doctor.experience}</span>
                        <span className="distance">Distance: {doctor.distance}</span>
                        <span className="rating">Rating: {doctor.rating}/5</span>
                        <span className="consultation-fee">Fee: {doctor.consultationFee}</span>
                      </div>
                      <div className="availability">{doctor.availability}</div>
                      {doctor.telehealth && (
                        <div className="telehealth-badge">Telehealth Available</div>
                      )}
                    </div>
                    <div className="doctor-actions">
                      <button
                        type="button"
                        className="book-appointment-btn"
                        onClick={() => {
                          console.log('Book appointment button clicked for:', doctor.name);
                          handleBookAppointment(doctor);
                        }}
                      >
                        Book Appointment
                      </button>
                      <button
                        className="contact-doctor-btn"
                        onClick={() => window.open(`tel:${doctor.contact.phone}`)}
                      >
                        Call Doctor
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="important-note">
              <div className="note-icon">⚠️</div>
              <div className="note-content">
                <h5>Important Note</h5>
                <p>If you're experiencing a mental health emergency, please call 988 or go to your nearest emergency room.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="resource-details">
            <button className="back-button" onClick={handleBack}>
              ← Back to Resources
            </button>

            <div className="selected-resource">
              <div className="resource-header">
                <div className="resource-icon-large" style={{ color: selectedResource.color }}>
                  {selectedResource.icon}
                </div>
                <div className="resource-header-info">
                  <h3>{selectedResource.title}</h3>
                  <p>{selectedResource.description}</p>
                </div>
              </div>

              <div className="resource-details-content">
                <div className="detail-item">
                  <span className="detail-label">Availability:</span>
                  <span className="detail-value">{selectedResource.availability}</span>
                </div>

                {selectedResource.phone && (
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value phone-number">{selectedResource.phone}</span>
                  </div>
                )}

                {selectedResource.website && (
                  <div className="detail-item">
                    <span className="detail-label">Website:</span>
                    <span className="detail-value website-link">{selectedResource.website}</span>
                  </div>
                )}

                <div className="resource-description">
                  {selectedResource.type === 'emergency' && (
                    <div className="emergency-info">
                      <h4>🚨 Emergency Support</h4>
                      <p>This is a 24/7 crisis hotline for immediate emotional support. Trained counselors are available to help you through difficult moments.</p>
                      <ul>
                        <li>Free and confidential</li>
                        <li>Available 24/7</li>
                        <li>Trained mental health professionals</li>
                        <li>No judgment, just support</li>
                      </ul>
                    </div>
                  )}

                  {selectedResource.type === 'professional' && (
                    <div className="professional-info">
                      <h4>🩺 Professional Therapy</h4>
                      <p>Connect with licensed therapists through online sessions. Get professional help from the comfort of your home.</p>
                      <ul>
                        <li>Licensed and vetted professionals</li>
                        <li>Flexible scheduling</li>
                        <li>Various therapy approaches</li>
                        <li>Insurance accepted</li>
                      </ul>
                    </div>
                  )}

                  {selectedResource.type === 'community' && (
                    <div className="community-info">
                      <h4>👥 Peer Support</h4>
                      <p>Join support groups to connect with others who understand what you're going through. Share experiences and find strength in community.</p>
                      <ul>
                        <li>Free to join</li>
                        <li>Facilitated by trained volunteers</li>
                        <li>Safe and confidential environment</li>
                        <li>Various topics and focus areas</li>
                      </ul>
                    </div>
                  )}

                  {selectedResource.type === 'educational' && (
                    <div className="educational-info">
                      <h4>📚 Educational Resources</h4>
                      <p>Access reliable information about mental health conditions, treatment options, and self-help strategies.</p>
                      <ul>
                        <li>Evidence-based information</li>
                        <li>Self-help tools and worksheets</li>
                        <li>Understanding your condition</li>
                        <li>Coping strategies and tips</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              <div className="resource-actions">
                <button
                  className="contact-resource-btn"
                  onClick={handleContactResource}
                  style={{ background: selectedResource.color }}
                >
                  {selectedResource.phone ? `Call ${selectedResource.phone}` : 'Visit Website'}
                </button>
                <button className="save-resource-btn">
                  Save for Later
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DoctorReferral;
class AppointmentService {
  constructor() {
    this.appointments = [];
    this.doctors = [];
    this.userAppointments = new Map();
    this.initializeMockData();
  }

  initializeMockData() {
    // Mock database of mental health professionals
    this.doctors = [
      {
        id: 'doc_001',
        name: 'Dr. Sarah Johnson',
        specialty: 'Clinical Psychology',
        credentials: 'PhD, PsyD',
        experience: '15 years',
        rating: 4.8,
        languages: ['English', 'Spanish'],
        availability: ['Mon', 'Wed', 'Fri'],
        timeSlots: ['9:00 AM', '10:00 AM', '2:00 PM', '3:00 PM'],
        consultationFee: 150,
        telehealth: true,
        inPerson: true,
        specialties: ['Depression', 'Anxiety', 'Trauma', 'Relationships'],
        location: 'New York, NY',
        image: 'https://randomuser.me/api/portraits/women/32.jpg'
      },
      {
        id: 'doc_002',
        name: 'Dr. Michael Chen',
        specialty: 'Psychiatry',
        credentials: 'MD',
        experience: '12 years',
        rating: 4.9,
        languages: ['English', 'Mandarin'],
        availability: ['Tue', 'Thu', 'Sat'],
        timeSlots: ['11:00 AM', '1:00 PM', '4:00 PM', '5:00 PM'],
        consultationFee: 200,
        telehealth: true,
        inPerson: false,
        specialties: ['Medication Management', 'Bipolar Disorder', 'ADHD', 'Anxiety'],
        location: 'San Francisco, CA',
        image: 'https://randomuser.me/api/portraits/men/42.jpg'
      },
      {
        id: 'doc_003',
        name: 'Dr. Emily Rodriguez',
        specialty: 'Licensed Counselor',
        credentials: 'LPC, NCC',
        experience: '8 years',
        rating: 4.7,
        languages: ['English', 'Portuguese'],
        availability: ['Mon', 'Tue', 'Thu', 'Fri'],
        timeSlots: ['8:00 AM', '9:00 AM', '12:00 PM', '4:00 PM'],
        consultationFee: 120,
        telehealth: true,
        inPerson: true,
        specialties: ['Teen Counseling', 'Family Therapy', 'Depression', 'Self-Esteem'],
        location: 'Austin, TX',
        image: 'https://randomuser.me/api/portraits/women/28.jpg'
      },
      {
        id: 'doc_004',
        name: 'Dr. James Wilson',
        specialty: 'Clinical Social Work',
        credentials: 'LCSW',
        experience: '20 years',
        rating: 4.6,
        languages: ['English'],
        availability: ['Wed', 'Thu', 'Fri'],
        timeSlots: ['10:00 AM', '11:00 AM', '2:00 PM', '6:00 PM'],
        consultationFee: 100,
        telehealth: true,
        inPerson: true,
        specialties: ['Addiction', 'Grief', 'Stress Management', 'Work-Life Balance'],
        location: 'Chicago, IL',
        image: 'https://randomuser.me/api/portraits/men/58.jpg'
      },
      {
        id: 'doc_005',
        name: 'Dr. Priya Sharma',
        specialty: 'Psychology & Mindfulness',
        credentials: 'PhD',
        experience: '10 years',
        rating: 4.9,
        languages: ['English', 'Hindi', 'Urdu'],
        availability: ['Mon', 'Wed', 'Fri', 'Sat'],
        timeSlots: ['7:00 AM', '8:00 AM', '5:00 PM', '6:00 PM'],
        consultationFee: 140,
        telehealth: true,
        inPerson: false,
        specialties: ['Mindfulness', 'Anxiety', 'Burnout', 'Cultural Therapy'],
        location: 'Virtual Only',
        image: 'https://randomuser.me/api/portraits/women/65.jpg'
      }
    ];

    // Load appointments from localStorage
    this.loadAppointments();
  }

  // Get available doctors based on user needs
  getAvailableDoctors(filters = {}) {
    let filteredDoctors = [...this.doctors];

    if (filters.specialty) {
      filteredDoctors = filteredDoctors.filter(doc =>
        doc.specialties.some(spec =>
          spec.toLowerCase().includes(filters.specialty.toLowerCase())
        )
      );
    }

    if (filters.language) {
      filteredDoctors = filteredDoctors.filter(doc =>
        doc.languages.includes(filters.language)
      );
    }

    if (filters.telehealthOnly) {
      filteredDoctors = filteredDoctors.filter(doc => doc.telehealth);
    }

    if (filters.maxFee) {
      filteredDoctors = filteredDoctors.filter(doc => doc.consultationFee <= filters.maxFee);
    }

    // Sort by rating
    filteredDoctors.sort((a, b) => b.rating - a.rating);

    return filteredDoctors;
  }

  // Get doctor by ID
  getDoctorById(doctorId) {
    return this.doctors.find(doc => doc.id === doctorId);
  }

  // Get available time slots for a doctor
  getAvailableTimeSlots(doctorId, date) {
    const doctor = this.getDoctorById(doctorId);
    if (!doctor) return [];

    const dayOfWeek = new Date(date).toLocaleDateString('en-US', { weekday: 'short' });
    const dayMap = {
      'Mon': 'Monday',
      'Tue': 'Tuesday',
      'Wed': 'Wednesday',
      'Thu': 'Thursday',
      'Fri': 'Friday',
      'Sat': 'Saturday',
      'Sun': 'Sunday'
    };

    const fullDayName = dayMap[dayOfWeek];

    if (!doctor.availability.includes(dayOfWeek)) {
      return [];
    }

    // Check which slots are already booked
    const bookedSlots = this.getBookedSlots(doctorId, date);

    return doctor.timeSlots.filter(slot => !bookedSlots.includes(slot));
  }

  // Get already booked slots for a doctor on a specific date
  getBookedSlots(doctorId, date) {
    const userAppointments = this.getUserAppointments();
    const doctorAppointments = Object.values(userAppointments)
      .filter(apt => apt.doctorId === doctorId && apt.date === date && apt.status !== 'cancelled');

    return doctorAppointments.map(apt => apt.timeSlot);
  }

  // Book an appointment
  async bookAppointment(userId, appointmentData) {
    try {
      const appointment = {
        id: this.generateAppointmentId(),
        userId: userId,
        doctorId: appointmentData.doctorId,
        doctor: this.getDoctorById(appointmentData.doctorId),
        date: appointmentData.date,
        timeSlot: appointmentData.timeSlot,
        type: appointmentData.type || 'telehealth', // 'telehealth' or 'inPerson'
        reason: appointmentData.reason || 'General consultation',
        status: 'confirmed', // 'confirmed', 'cancelled', 'completed', 'no-show'
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        reminders: [],
        notes: appointmentData.notes || '',
        urgency: appointmentData.urgency || 'routine', // 'routine', 'urgent', 'emergency'
        paymentStatus: 'pending', // 'pending', 'paid', 'refunded'
        meetingLink: null,
        preAppointmentAssessment: appointmentData.preAppointmentAssessment || null
      };

      // Generate meeting link for telehealth appointments
      if (appointment.type === 'telehealth') {
        appointment.meetingLink = this.generateMeetingLink(appointment.id);
      }

      // Set up reminders
      appointment.reminders = this.setupReminders(appointment);

      // Save appointment
      this.saveAppointment(userId, appointment);

      // Send confirmation
      this.sendAppointmentConfirmation(appointment);

      return {
        success: true,
        appointment: appointment,
        message: 'Appointment booked successfully!'
      };

    } catch (error) {
      console.error('Error booking appointment:', error);
      return {
        success: false,
        error: 'Failed to book appointment. Please try again.',
        details: error.message
      };
    }
  }

  // Reschedule appointment
  async rescheduleAppointment(userId, appointmentId, newDate, newTimeSlot) {
    try {
      const appointment = this.getUserAppointment(userId, appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      // Check if new slot is available
      const isAvailable = this.getAvailableTimeSlots(appointment.doctorId, newDate)
        .includes(newTimeSlot);

      if (!isAvailable) {
        throw new Error('Selected time slot is not available');
      }

      // Update appointment
      appointment.date = newDate;
      appointment.timeSlot = newTimeSlot;
      appointment.status = 'rescheduled';
      appointment.updatedAt = new Date().toISOString();

      // Regenerate reminders
      appointment.reminders = this.setupReminders(appointment);

      // Save updated appointment
      this.saveAppointment(userId, appointment);

      // Send notifications
      this.sendRescheduleNotification(appointment);

      return {
        success: true,
        appointment: appointment,
        message: 'Appointment rescheduled successfully!'
      };

    } catch (error) {
      console.error('Error rescheduling appointment:', error);
      return {
        success: false,
        error: 'Failed to reschedule appointment.',
        details: error.message
      };
    }
  }

  // Cancel appointment
  async cancelAppointment(userId, appointmentId, reason = '') {
    try {
      const appointment = this.getUserAppointment(userId, appointmentId);
      if (!appointment) {
        throw new Error('Appointment not found');
      }

      appointment.status = 'cancelled';
      appointment.cancelledAt = new Date().toISOString();
      appointment.cancellationReason = reason;
      appointment.updatedAt = new Date().toISOString();

      // Save updated appointment
      this.saveAppointment(userId, appointment);

      // Send cancellation notification
      this.sendCancellationNotification(appointment);

      return {
        success: true,
        appointment: appointment,
        message: 'Appointment cancelled successfully!'
      };

    } catch (error) {
      console.error('Error cancelling appointment:', error);
      return {
        success: false,
        error: 'Failed to cancel appointment.',
        details: error.message
      };
    }
  }

  // Get user appointments
  getUserAppointments(userId = null) {
    if (userId) {
      return this.userAppointments.get(userId) || {};
    }

    // Return all appointments
    const allAppointments = {};
    this.userAppointments.forEach((userApts, uid) => {
      Object.assign(allAppointments, userApts);
    });
    return allAppointments;
  }

  // Get specific appointment
  getUserAppointment(userId, appointmentId) {
    const userAppointments = this.getUserAppointments(userId);
    return userAppointments[appointmentId];
  }

  // Get upcoming appointments
  getUpcomingAppointments(userId) {
    const userAppointments = this.getUserAppointments(userId);
    const now = new Date();

    return Object.values(userAppointments)
      .filter(apt => apt.status === 'confirmed' && new Date(`${apt.date} ${apt.timeSlot}`) > now)
      .sort((a, b) => new Date(`${a.date} ${a.timeSlot}`) - new Date(`${b.date} ${b.timeSlot}`));
  }

  // Get past appointments
  getPastAppointments(userId) {
    const userAppointments = this.getUserAppointments(userId);
    const now = new Date();

    return Object.values(userAppointments)
      .filter(apt => new Date(`${apt.date} ${apt.timeSlot}`) <= now)
      .sort((a, b) => new Date(`${b.date} ${b.timeSlot}`) - new Date(`${a.date} ${a.timeSlot}`));
  }

  // Save appointment to storage
  saveAppointment(userId, appointment) {
    if (!this.userAppointments.has(userId)) {
      this.userAppointments.set(userId, {});
    }

    const userApts = this.userAppointments.get(userId);
    userApts[appointment.id] = appointment;
    this.userAppointments.set(userId, userApts);

    // Save to localStorage
    this.saveToLocalStorage();
  }

  // Load appointments from localStorage
  loadAppointments() {
    try {
      const stored = localStorage.getItem('sakhi_appointments');
      if (stored) {
        const data = JSON.parse(stored);
        this.userAppointments = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Error loading appointments:', error);
    }
  }

  // Save to localStorage
  saveToLocalStorage() {
    try {
      const data = Object.fromEntries(this.userAppointments);
      localStorage.setItem('sakhi_appointments', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving appointments:', error);
    }
  }

  // Generate appointment ID
  generateAppointmentId() {
    return `apt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // Generate meeting link
  generateMeetingLink(appointmentId) {
    return `https://meet.sakhi.ai/session/${appointmentId}`;
  }

  // Setup reminders
  setupReminders(appointment) {
    const appointmentDateTime = new Date(`${appointment.date} ${appointment.timeSlot}`);
    const reminders = [];

    // 24 hours before
    const dayBefore = new Date(appointmentDateTime.getTime() - 24 * 60 * 60 * 1000);
    reminders.push({
      id: `rem_1_${appointment.id}`,
      type: 'email',
      scheduledFor: dayBefore.toISOString(),
      sent: false,
      message: 'Your appointment is tomorrow'
    });

    // 1 hour before
    const hourBefore = new Date(appointmentDateTime.getTime() - 60 * 60 * 1000);
    reminders.push({
      id: `rem_2_${appointment.id}`,
      type: 'sms',
      scheduledFor: hourBefore.toISOString(),
      sent: false,
      message: 'Your appointment is in 1 hour'
    });

    // 15 minutes before
    const fifteenBefore = new Date(appointmentDateTime.getTime() - 15 * 60 * 1000);
    reminders.push({
      id: `rem_3_${appointment.id}`,
      type: 'push',
      scheduledFor: fifteenBefore.toISOString(),
      sent: false,
      message: 'Your appointment starts in 15 minutes'
    });

    return reminders;
  }

  // Send appointment confirmation
  sendAppointmentConfirmation(appointment) {
    // Mock implementation - in real app, this would send actual notifications
    console.log('📧 Appointment confirmation sent:', {
      to: appointment.userId,
      doctor: appointment.doctor.name,
      date: appointment.date,
      time: appointment.timeSlot,
      type: appointment.type
    });
  }

  // Send reschedule notification
  sendRescheduleNotification(appointment) {
    console.log('📧 Reschedule notification sent:', appointment);
  }

  // Send cancellation notification
  sendCancellationNotification(appointment) {
    console.log('📧 Cancellation notification sent:', appointment);
  }

  // Get appointment statistics
  getAppointmentStats(userId) {
    const appointments = this.getUserAppointments(userId);
    const stats = {
      total: Object.keys(appointments).length,
      completed: 0,
      cancelled: 0,
      upcoming: 0,
      noShow: 0,
      averageRating: 0,
      totalSpent: 0
    };

    Object.values(appointments).forEach(apt => {
      switch (apt.status) {
        case 'completed':
          stats.completed++;
          break;
        case 'cancelled':
          stats.cancelled++;
          break;
        case 'confirmed':
          stats.upcoming++;
          break;
        case 'no-show':
          stats.noShow++;
          break;
      }

      if (apt.paymentStatus === 'paid') {
        stats.totalSpent += apt.doctor.consultationFee;
      }
    });

    return stats;
  }

  // Search doctors
  searchDoctors(query) {
    const lowerQuery = query.toLowerCase();
    return this.doctors.filter(doc =>
      doc.name.toLowerCase().includes(lowerQuery) ||
      doc.specialty.toLowerCase().includes(lowerQuery) ||
      doc.specialties.some(spec => spec.toLowerCase().includes(lowerQuery))
    );
  }

  // Emergency appointment booking
  async bookEmergencyAppointment(userId, crisisLevel) {
    const emergencyDoctors = this.doctors.filter(doc =>
      doc.specialties.includes('Crisis Intervention') ||
      doc.specialties.includes('Emergency Psychiatry') ||
      doc.availability.includes('Emergency')
    );

    if (emergencyDoctors.length === 0) {
      // Fallback to any available doctor
      emergencyDoctors.push(...this.doctors.filter(doc => doc.telehealth));
    }

    if (emergencyDoctors.length === 0) {
      throw new Error('No emergency appointments available');
    }

    const doctor = emergencyDoctors[0];
    const now = new Date();
    const emergencyTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // 2 hours from now

    return this.bookAppointment(userId, {
      doctorId: doctor.id,
      date: emergencyTime.toISOString().split('T')[0],
      timeSlot: emergencyTime.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      }),
      type: 'telehealth',
      reason: 'Emergency consultation - Crisis intervention',
      urgency: 'emergency',
      notes: `Crisis Level: ${crisisLevel}/5 - Immediate attention required`
    });
  }
}

export default new AppointmentService();
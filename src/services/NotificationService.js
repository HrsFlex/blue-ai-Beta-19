class NotificationService {
  constructor() {
    this.notifications = [];
    this.userNotifications = new Map();
    this.isSupported = this.checkNotificationSupport();
    this.permission = 'default';
    this.initializeNotifications();
  }

  checkNotificationSupport() {
    return 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window;
  }

  async initializeNotifications() {
    if (this.isSupported) {
      // Request permission
      await this.requestPermission();

      // Check for pending notifications
      this.checkPendingNotifications();

      // Set up periodic check for reminders
      setInterval(() => this.checkReminders(), 60000); // Check every minute
    }
  }

  async requestPermission() {
    if (!this.isSupported) return 'denied';

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return 'denied';
    }
  }

  // Check notification permission status
  getPermissionStatus() {
    return this.permission;
  }

  // Create and show notification
  async showNotification(title, options = {}) {
    if (!this.isSupported || this.permission !== 'granted') {
      console.warn('Notifications not supported or permission denied');
      return false;
    }

    try {
      const notification = new Notification(title, {
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: options.tag || 'default',
        requireInteraction: options.requireInteraction || false,
        silent: options.silent || false,
        ...options
      });

      // Auto-close notification after duration
      if (options.autoClose !== false) {
        setTimeout(() => {
          notification.close();
        }, options.duration || 5000);
      }

      // Handle notification click
      notification.onclick = () => {
        if (options.onClick) {
          options.onClick();
        }
        notification.close();
      };

      return true;
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  // Add notification to user's queue
  addNotification(userId, notification) {
    const notificationData = {
      id: this.generateNotificationId(),
      userId: userId,
      type: notification.type || 'info', // 'info', 'success', 'warning', 'error', 'appointment', 'reminder'
      title: notification.title,
      message: notification.message,
      timestamp: new Date().toISOString(),
      read: false,
      priority: notification.priority || 'normal', // 'low', 'normal', 'high', 'urgent'
      actionUrl: notification.actionUrl || null,
      actionText: notification.actionText || null,
      metadata: notification.metadata || {},
      expiresAt: notification.expiresAt || null,
      scheduledFor: notification.scheduledFor || null
    };

    if (!this.userNotifications.has(userId)) {
      this.userNotifications.set(userId, []);
    }

    const userNotifs = this.userNotifications.get(userId);
    userNotifs.push(notificationData);
    this.userNotifications.set(userId, userNotifs);

    // Save to localStorage
    this.saveNotifications();

    // Show browser notification if applicable
    if (notification.showBrowser !== false) {
      this.showBrowserNotification(notificationData);
    }

    return notificationData;
  }

  // Show browser notification
  async showBrowserNotification(notification) {
    const iconMap = {
      'info': '📢',
      'success': '✅',
      'warning': '⚠️',
      'error': '❌',
      'appointment': '📅',
      'reminder': '⏰',
      'crisis': '🚨',
      'wellness': '💙'
    };

    const title = `${iconMap[notification.type] || '📢'} ${notification.title}`;

    await this.showNotification(title, {
      body: notification.message,
      tag: `sakhi_${notification.type}`,
      requireInteraction: notification.priority === 'urgent',
      onClick: () => {
        if (notification.actionUrl) {
          window.location.href = notification.actionUrl;
        }
      }
    });
  }

  // Get user notifications
  getUserNotifications(userId, options = {}) {
    if (!this.userNotifications.has(userId)) {
      return [];
    }

    let notifications = [...this.userNotifications.get(userId)];

    // Filter by type
    if (options.type) {
      notifications = notifications.filter(n => n.type === options.type);
    }

    // Filter unread
    if (options.unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }

    // Sort by timestamp (newest first)
    notifications.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

    // Limit results
    if (options.limit) {
      notifications = notifications.slice(0, options.limit);
    }

    return notifications;
  }

  // Mark notification as read
  markAsRead(userId, notificationId) {
    const userNotifs = this.userNotifications.get(userId);
    if (!userNotifs) return false;

    const notification = userNotifs.find(n => n.id === notificationId);
    if (notification) {
      notification.read = true;
      notification.readAt = new Date().toISOString();
      this.saveNotifications();
      return true;
    }

    return false;
  }

  // Mark all notifications as read
  markAllAsRead(userId) {
    const userNotifs = this.userNotifications.get(userId);
    if (!userNotifs) return false;

    userNotifs.forEach(notification => {
      notification.read = true;
      notification.readAt = new Date().toISOString();
    });

    this.saveNotifications();
    return true;
  }

  // Delete notification
  deleteNotification(userId, notificationId) {
    const userNotifs = this.userNotifications.get(userId);
    if (!userNotifs) return false;

    const index = userNotifs.findIndex(n => n.id === notificationId);
    if (index !== -1) {
      userNotifs.splice(index, 1);
      this.saveNotifications();
      return true;
    }

    return false;
  }

  // Schedule notification for later
  scheduleNotification(userId, notification, delay) {
    const scheduledTime = new Date(Date.now() + delay);
    notification.scheduledFor = scheduledTime.toISOString();

    const notificationId = this.addNotification(userId, notification);

    // Set timeout to show notification at scheduled time
    setTimeout(() => {
      this.showBrowserNotification({
        ...notification,
        id: notificationId
      });
    }, delay);

    return notificationId;
  }

  // Appointment reminders
  createAppointmentReminder(userId, appointment) {
    const appointmentDateTime = new Date(`${appointment.date} ${appointment.timeSlot}`);
    const now = new Date();
    const timeUntilAppointment = appointmentDateTime - now;

    // 24 hours before
    if (timeUntilAppointment > 24 * 60 * 60 * 1000) {
      this.scheduleNotification(userId, {
        type: 'appointment',
        title: 'Appointment Reminder',
        message: `Your appointment with ${appointment.doctor.name} is tomorrow at ${appointment.timeSlot}`,
        priority: 'high',
        actionUrl: '/appointments',
        actionText: 'View Appointment'
      }, timeUntilAppointment - 24 * 60 * 60 * 1000);
    }

    // 1 hour before
    if (timeUntilAppointment > 60 * 60 * 1000) {
      this.scheduleNotification(userId, {
        type: 'reminder',
        title: 'Appointment Soon',
        message: `Your appointment starts in 1 hour`,
        priority: 'urgent',
        showBrowser: true
      }, timeUntilAppointment - 60 * 60 * 1000);
    }

    // 15 minutes before
    if (timeUntilAppointment > 15 * 60 * 1000) {
      this.scheduleNotification(userId, {
        type: 'reminder',
        title: 'Appointment Starting Soon',
        message: `Your appointment with ${appointment.doctor.name} starts in 15 minutes`,
        priority: 'urgent',
        showBrowser: true,
        requireInteraction: true
      }, timeUntilAppointment - 15 * 60 * 1000);
    }
  }

  // Wellness check notifications
  createWellnessCheck(userId, hours = 24) {
    this.scheduleNotification(userId, {
      type: 'wellness',
      title: 'Wellness Check-in',
      message: 'How are you feeling today? Take a moment to check in with yourself.',
      priority: 'normal',
      actionUrl: '/mental-wellness',
      actionText: 'Check In Now'
    }, hours * 60 * 60 * 1000);
  }

  // Activity completion notification
  createActivityCompletion(userId, activity, points = 0) {
    this.addNotification(userId, {
      type: 'success',
      title: 'Great job! 🎉',
      message: `You completed "${activity}"${points > 0 ? ` and earned ${points} wellness points!` : '!'}`,
      priority: 'normal',
      showBrowser: true
    });
  }

  // Crisis alert
  createCrisisAlert(userId, message) {
    this.addNotification(userId, {
      type: 'crisis',
      title: 'Crisis Support Alert',
      message: message,
      priority: 'urgent',
      showBrowser: true,
      requireInteraction: true,
      actionUrl: '/emergency',
      actionText: 'Get Help Now'
    });
  }

  // Appointment booking confirmation
  createAppointmentConfirmation(userId, appointment) {
    this.addNotification(userId, {
      type: 'success',
      title: 'Appointment Booked Successfully! 📅',
      message: `Your appointment with ${appointment.doctor.name} is confirmed for ${appointment.date} at ${appointment.timeSlot}`,
      priority: 'high',
      actionUrl: '/appointments',
      actionText: 'View Details'
    });

    // Set up reminders
    this.createAppointmentReminder(userId, appointment);
  }

  // Daily wellness tip
  createDailyWellnessTip(userId) {
    const tips = [
      'Take 5 deep breaths when feeling overwhelmed',
      'Write down 3 things you\'re grateful for today',
      'Take a 10-minute walk to clear your mind',
      'Listen to your favorite uplifting song',
      'Call or text a friend or family member',
      'Practice 5 minutes of mindfulness meditation',
      'Stretch your body for 3 minutes',
      'Drink a glass of water and hydrate'
    ];

    const randomTip = tips[Math.floor(Math.random() * tips.length)];

    this.addNotification(userId, {
      type: 'wellness',
      title: 'Daily Wellness Tip 💡',
      message: randomTip,
      priority: 'low',
      showBrowser: false
    });
  }

  // Check for scheduled reminders
  checkReminders() {
    const now = new Date();

    this.userNotifications.forEach((notifications, userId) => {
      notifications.forEach(notification => {
        if (notification.scheduledFor && !notification.sent) {
          const scheduledTime = new Date(notification.scheduledFor);
          if (scheduledTime <= now) {
            this.showBrowserNotification(notification);
            notification.sent = true;
            notification.sentAt = now.toISOString();
          }
        }

        // Clean up expired notifications
        if (notification.expiresAt && new Date(notification.expiresAt) <= now) {
          this.deleteNotification(userId, notification.id);
        }
      });
    });

    this.saveNotifications();
  }

  // Check pending notifications on load
  checkPendingNotifications() {
    this.checkReminders();
  }

  // Get notification count
  getUnreadCount(userId) {
    const notifications = this.getUserNotifications(userId, { unreadOnly: true });
    return notifications.length;
  }

  // Generate notification ID
  generateNotificationId() {
    return `notif_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  }

  // Save notifications to localStorage
  saveNotifications() {
    try {
      const data = Object.fromEntries(this.userNotifications);
      localStorage.setItem('sakhi_notifications', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving notifications:', error);
    }
  }

  // Load notifications from localStorage
  loadNotifications() {
    try {
      const stored = localStorage.getItem('sakhi_notifications');
      if (stored) {
        const data = JSON.parse(stored);
        this.userNotifications = new Map(Object.entries(data));
      }
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  }

  // Clear all notifications for user
  clearAllNotifications(userId) {
    this.userNotifications.set(userId, []);
    this.saveNotifications();
  }

  // Export notifications data
  exportNotifications(userId) {
    return this.getUserNotifications(userId);
  }

  // Health check
  healthCheck() {
    return {
      supported: this.isSupported,
      permission: this.permission,
      totalUsers: this.userNotifications.size,
      totalNotifications: Array.from(this.userNotifications.values())
        .reduce((total, notifs) => total + notifs.length, 0)
    };
  }
}

export default new NotificationService();
# Real Health Data Integration Implementation

## Overview

The Blue.ai health dashboard now supports real-time health data integration with multiple fitness and health platforms. This implementation provides users with the ability to connect their actual health apps and see real-time metrics instead of simulated data.

## Architecture

### Core Components

1. **RealHealthDataService.js** - Core service for health data integration
2. **HealthDataConnector.js** - React component for managing health app connections
3. **HealthDashboard.js** - Updated dashboard with real data support

### Supported Health Platforms

- **Google Fit** - Activity, heart rate, sleep, and weight data
- **Strava** - Workout and activity tracking
- **Withings** - Sleep, weight, and health metrics
- **Custom APIs** - Support for any RESTful health data API

## Features

### 🔌 Connection Management
- OAuth2 authentication flow for major platforms
- Secure credential storage
- Real-time connection status indicators
- Multi-provider simultaneous connections

### 📊 Data Synchronization
- Automatic data refresh every 60 seconds
- Manual refresh functionality
- Data aggregation from multiple sources
- Derived metrics calculation (stress levels, readiness scores)

### 🎛️ User Interface
- Toggle between mock and real data
- Connection status indicators
- Interactive connection modal
- Real-time data source information

## Implementation Details

### OAuth2 Integration

Each health platform uses OAuth2 for secure authentication:

```javascript
// Example: Google Fit OAuth flow
const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${clientId}&` +
  `redirect_uri=${encodeURIComponent(redirectUri)}&` +
  `response_type=code&` +
  `scope=${encodeURIComponent(scopes.join(' '))}&` +
  `access_type=offline&` +
  `prompt=consent`;
```

### Data Processing Pipeline

1. **Data Collection** - Fetch raw data from connected APIs
2. **Normalization** - Convert data to standard format
3. **Aggregation** - Combine data from multiple sources
4. **Analysis** - Calculate derived metrics and insights
5. **Visualization** - Display in dashboard components

### Security Features

- API key encryption and secure storage
- OAuth2 token management with refresh capabilities
- Data validation and sanitization
- HTTPS-only communication
- Row-level security for user data

## Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# Google Fit API
GOOGLE_FIT_CLIENT_ID=your-google-fit-client-id
GOOGLE_FIT_CLIENT_SECRET=your-google-fit-client-secret

# Strava API
STRAVA_CLIENT_ID=your-strava-client-id
STRAVA_CLIENT_SECRET=your-strava-client-secret

# Withings API
WITHINGS_CLIENT_ID=your-withings-client-id
WITHINGS_CLIENT_SECRET=your-withings-client-secret

# Custom API (optional)
CUSTOM_API_ENDPOINTS=your-custom-api-endpoints
```

### API Setup Instructions

#### Google Fit
1. Create a project at [Google Cloud Console](https://console.cloud.google.com/)
2. Enable Google Fit API
3. Create OAuth 2.0 credentials
4. Add authorized redirect URI: `http://localhost:3000/auth/google-fit/callback`

#### Strava
1. Create an application at [Strava Developers](https://developers.strava.com/)
2. Set authorization callback domain: `localhost`
3. Configure OAuth scopes needed

#### Withings
1. Register at [Withings Developer Portal](https://developer.withings.com/)
2. Create OAuth2 application
3. Set callback URL: `http://localhost:3000/auth/withings/callback`

## Usage Guide

### Connecting Health Apps

1. Navigate to the Health Dashboard
2. Click the data source toggle button
3. Select "Real Data" mode
4. Click "Connect" when prompted
5. Choose your health platform(s)
6. Complete OAuth authentication
7. Grant necessary permissions

### Data Available

- **Physical Activity**: Steps, calories, active minutes, distance
- **Heart Metrics**: Current heart rate, resting HR, HRV, stress levels
- **Sleep Analysis**: Duration, quality, sleep stages, consistency
- **Screen Time**: Total usage, pickups, app categories
- **Workouts**: Type, duration, intensity, frequency

### Real-time Updates

- Data automatically refreshes every 60 seconds
- Manual refresh available via refresh button
- Connection status shows live synchronization state
- Error handling with retry mechanisms

## File Structure

```
src/
├── services/
│   ├── RealHealthDataService.js     # Core health data service
│   └── HealthDataService.js         # Mock data service
├── components/
│   ├── HealthDashboard/
│   │   ├── HealthDashboard.js       # Main dashboard component
│   │   └── HealthDashboard.css      # Dashboard styles
│   └── HealthDataConnector/
│       ├── HealthDataConnector.js   # Connection management UI
│       └── HealthDataConnector.css  # Connector styles
└── config/
    └── aiConfig.js                  # AI configuration (fixed)
```

## Technical Specifications

### Data Schema

Standardized health data format:

```javascript
{
  mood: {
    score: 75,
    prediction: "good",
    confidence: 0.82,
    factors: [...],
    recommendations: [...]
  },
  sleep: {
    duration: 480,
    quality: 85,
    stages: { deep: 90, light: 300, rem: 90 },
    consistency: "regular"
  },
  activity: {
    steps: 8500,
    calories: 2200,
    activeMinutes: 45,
    distance: 6.2,
    goalProgress: 85
  },
  heartRate: {
    current: 72,
    resting: 58,
    variability: 45,
    stressLevel: "low",
    zones: { resting: 60, fatBurn: 120, cardio: 150 }
  },
  screenTime: {
    total: 240,
    pickups: 45,
    social: 60,
    productivity: 90,
    entertainment: 90,
    digitalWellness: "good"
  }
}
```

### Performance Features

- Lazy loading of health data components
- Optimized API calls with caching
- Background data synchronization
- Progressive data loading
- Error boundaries for graceful degradation

## Troubleshooting

### Common Issues

1. **Connection Failures**
   - Check API credentials in environment variables
   - Verify redirect URIs match platform settings
   - Ensure required scopes are requested

2. **Data Not Loading**
   - Check internet connection
   - Verify API rate limits haven't been exceeded
   - Clear browser cache and reconnect

3. **OAuth Callback Issues**
   - Ensure callback URLs are properly configured
   - Check that ports match (3000 for frontend)
   - Verify HTTPS requirements if applicable

### Debug Mode

Enable debug logging:

```javascript
// In browser console
localStorage.setItem('debug', 'true');
```

## Future Enhancements

### Planned Features

- **Apple Health Integration** - Direct iOS HealthKit connectivity
- **Garmin Connect** - Additional fitness platform support
- **Fitbit Integration** - Popular fitness tracker support
- **Webhooks** - Real-time data push notifications
- **Data Export** - CSV/PDF health reports
- **Historical Analysis** - Long-term health trends
- **Alert System** - Health threshold notifications
- **Multi-user Support** - Family health tracking

### MCP Server Development

The next phase includes building a Model Context Protocol (MCP) server for:
- Real-time health data streaming
- Cross-platform data synchronization
- Advanced health analytics
- AI-powered health insights

## Security & Privacy

- All health data is encrypted in transit and at rest
- Users maintain full control over data sharing
- GDPR and HIPAA compliance considerations
- Regular security audits and updates
- Data retention policies and user consent management

## Support

For technical support or questions:
1. Check the troubleshooting section above
2. Review API documentation for each platform
3. Enable debug mode for detailed error logging
4. Check browser console for additional error details

---

**Note**: This implementation focuses on user privacy and data security while providing comprehensive health data integration capabilities.
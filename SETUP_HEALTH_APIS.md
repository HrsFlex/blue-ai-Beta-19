# Health APIs Setup Guide

This guide will help you configure the health data integration for Blue.ai mental health companion.

## Quick Start

1. **Copy the example environment file:**
   ```bash
   cp .env.example .env
   ```

2. **Choose your health platform(s) below and follow the setup instructions**

3. **Update your `.env` file with the actual credentials**

4. **Restart the application:**
   ```bash
   ./start.sh stop
   ./start.sh start
   ```

## Health Platform Setup

### 🏃‍♂️ Google Fit Setup

**Requirements:** Google account, Google Cloud Console access

**Steps:**
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable the **Google Fit API**
   - Go to "APIs & Services" → "Library"
   - Search for "Google Fit API"
   - Click "Enable"
4. Create OAuth 2.0 credentials
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth 2.0 Client ID"
   - Select "Web application"
   - Add authorized redirect URI: `http://localhost:3000/auth/google-fit/callback`
5. Copy the **Client ID** and **Client Secret**
6. Update `.env`:
   ```env
   REACT_APP_GOOGLE_FIT_CLIENT_ID=your-client-id.apps.googleusercontent.com
   REACT_APP_GOOGLE_FIT_CLIENT_SECRET=your-client-secret
   ```

**Data Accessed:** Steps, heart rate, sleep, weight, and physical activity

---

### 🚴‍♀️ Strava Setup

**Requirements:** Strava account

**Steps:**
1. Visit [Strava Developers](https://developers.strava.com/)
2. Click "Get Started" → "Create an API Application"
3. Fill in application details:
   - **Application Name**: Blue.ai Health Dashboard
   - **Website**: `http://localhost:3000`
   - **Authorization Callback Domain**: `localhost`
   - **Description**: Mental health companion with activity tracking
4. Agree to terms and submit
5. Copy the **Client ID** and **Client Secret**
6. Update `.env`:
   ```env
   REACT_APP_STRAVA_CLIENT_ID=your-strava-client-id
   REACT_APP_STRAVA_CLIENT_SECRET=your-strava-client-secret
   ```

**Data Accessed:** Workouts, activities, distance, duration, and type

---

### ⚖️ Withings Setup

**Requirements:** Withings account (Nokia Health)

**Steps:**
1. Visit [Withings Developer Portal](https://developer.withings.com/)
2. Go to "My Apps" → "Create an App"
3. Fill in application details:
   - **Application Type**: OAuth2
   - **Name**: Blue.ai Health Dashboard
   - **Description**: Mental health companion with health metrics
   - **Callback URL**: `http://localhost:3000/auth/withings/callback`
4. Select required permissions:
   - user.info (basic user information)
   - user.metrics (weight, heart rate, etc.)
   - user.activity (physical activity data)
5. Submit and wait for approval (usually instant for development)
6. Copy the **Client ID** and **Client Secret**
7. Update `.env`:
   ```env
   REACT_APP_WITHINGS_CLIENT_ID=your-withings-client-id
   REACT_APP_WITHINGS_CLIENT_SECRET=your-withings-client-secret
   ```

**Data Accessed:** Sleep, weight, heart rate, blood pressure, and activity

---

### 🔗 Custom API Setup

**Requirements:** Your own health data API

**Steps:**
1. Ensure your API returns health data in the expected format
2. Update `.env`:
   ```env
   REACT_APP_CUSTOM_API_ENDPOINT=https://api.yourhealthapp.com
   REACT_APP_CUSTOM_API_KEY=your-api-key
   ```

**Expected Data Format:**
```json
{
  "mood": { "score": 75, "prediction": "good" },
  "sleep": { "duration": 480, "quality": 85 },
  "activity": { "steps": 8500, "calories": 2200 },
  "heartRate": { "current": 72, "resting": 58 },
  "screenTime": { "total": 240, "pickups": 45 }
}
```

## Configuration Options

### Feature Flags
Control which health platforms are available:

```env
# Enable/disable specific platforms
REACT_APP_ENABLE_GOOGLE_FIT=true
REACT_APP_ENABLE_STRAVA=true
REACT_APP_ENABLE_WITHINGS=true
REACT_APP_ENABLE_CUSTOM_API=true
```

### Development Settings

```env
# Use mock data instead of real APIs (for testing)
REACT_APP_USE_MOCK_HEALTH_DATA=true

# Enable debug logging in browser console
REACT_APP_DEBUG_HEALTH_DATA=false

# Data refresh interval in milliseconds (default: 60000 = 1 minute)
REACT_APP_HEALTH_DATA_REFRESH_INTERVAL=60000
```

## Testing Your Configuration

1. **Start the application:**
   ```bash
   ./start.sh start
   ```

2. **Open health dashboard:** http://localhost:3000

3. **Toggle to "Real Data" mode**
   - Click the data source toggle button
   - The dashboard will show available connection options

4. **Test connection:**
   - Click "Connect" on any available health platform
   - Complete the OAuth authentication in the popup
   - Verify that data appears in the dashboard

5. **Check for errors:**
   - Enable debug mode: `REACT_APP_DEBUG_HEALTH_DATA=true`
   - Open browser console (F12) to see detailed logs

## Troubleshooting

### Common Issues

**"Credentials not configured" error:**
- Verify you've replaced placeholder values in `.env`
- Ensure environment variables are correctly formatted
- Restart the application after changing `.env`

**OAuth redirect errors:**
- Check that redirect URIs in platform settings match exactly
- Ensure the port (3000) is correct and not blocked
- Verify HTTPS requirements (some platforms require HTTPS in production)

**"No data available" after connection:**
- Check platform permissions during OAuth flow
- Verify the platform has recent data to share
- Check browser console for API errors
- Try manual refresh in the dashboard

**Development vs Production:**
- Development uses `http://localhost:3000`
- Production requires HTTPS and your actual domain
- Update redirect URIs accordingly when deploying

### Debug Mode

Enable detailed logging:

```env
REACT_APP_DEBUG_HEALTH_DATA=true
```

This will show:
- Provider initialization status
- OAuth flow details
- API request/response logs
- Data transformation steps

## Security Best Practices

1. **Never commit `.env` files to version control**
2. **Use different credentials for development and production**
3. **Regularly rotate API secrets**
4. **Limit API scopes to only what's necessary**
5. **Monitor API usage for unusual activity**

## Support

If you encounter issues:

1. Check the troubleshooting section above
2. Review the platform-specific API documentation
3. Enable debug mode and check console logs
4. Verify all redirect URIs match exactly
5. Ensure your network allows OAuth popups/redirects

## Data Privacy

- All health data is encrypted in transit using HTTPS
- Local storage is used for temporary tokens only
- No health data is stored on external servers beyond the health platforms
- Users maintain full control over data sharing permissions
- All data processing happens locally in your browser

---

**Note:** This implementation prioritizes user privacy and data security while providing comprehensive health data integration capabilities.
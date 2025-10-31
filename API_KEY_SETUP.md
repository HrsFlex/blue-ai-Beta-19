# API Key Setup Guide

This guide will help you configure API keys for the Blue.ai mental health companion.

## Current Status

The application is currently running with **demo/mock AI responses**. To enable real AI features, you need to configure API keys.

## Available AI Integrations

### 1. Google Gemini AI (Recommended)

The application is configured to use Google's Gemini AI model for mood analysis and recommendations.

**Steps to get API key:**

1. **Get Google AI API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated API key (it starts with "AIza...")

2. **Configure the API key:**

   Update your `.env` file:
   ```env
   # Replace the demo key parts with your actual key
   # For example, if your key is "AIzaSyB1234C5678D9012E3456F7890G1234HI"
   REACT_APP_SAKHI_CORE_KEY_1=AIzaSyB
   REACT_APP_SAKHI_CORE_KEY_2=1234C5678
   REACT_APP_SAKHI_CORE_KEY_3=D9012E34
   REACT_APP_SAKHI_CORE_KEY_4=56F7890G
   REACT_APP_SAKHI_CORE_KEY_5=1234HI
   ```

   **Simple Method:** You can also just replace the entire key:
   ```env
   REACT_APP_SAKHI_AI_KEY=your-full-gemini-api-key-here
   ```

3. **Restart the application:**
   ```bash
   ./start.sh stop
   ./start.sh start
   ```

### 2. OpenAI GPT (Alternative)

If you prefer to use OpenAI instead:

1. **Get OpenAI API Key:**
   - Visit [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the generated key

2. **Update AI configuration:**

   Edit `src/config/aiConfig.js` to use OpenAI endpoints instead of Google.

## Health Data APIs

The health dashboard supports connecting to real health data sources. See `SETUP_HEALTH_APIS.md` for detailed instructions on:

- **Google Fit** - Activity, heart rate, sleep data
- **Strava** - Workout and activity tracking
- **Withings** - Sleep, weight, health metrics
- **Custom APIs** - Your own health data sources

## Testing Your Configuration

1. **Check if AI is working:**
   - Open the chat interface
   - Send a message about mood or mental health
   - If you get personalized responses, AI is working
   - If you get generic responses, it's still using demo mode

2. **Check if health data is working:**
   - Navigate to the Health Dashboard
   - Toggle from "Mock Data" to "Real Data"
   - Click "Connect" to set up health app connections
   - Follow the OAuth flow for your chosen health platform

## Troubleshooting

### AI Issues

**"Invalid API key" error:**
- Verify your API key is correct
- Ensure you haven't exceeded quota limits
- Check that the key parts are properly combined

**No AI responses:**
- Check browser console for errors
- Verify the API key is properly configured
- Ensure you have internet connectivity

### Health Data Issues

**"Credentials not configured" error:**
- Follow the `SETUP_HEALTH_APIS.md` guide
- Ensure all required environment variables are set
- Restart the application after updating .env

**OAuth callback errors:**
- Verify redirect URIs match platform settings exactly
- Check that ports aren't blocked by firewall
- Ensure popups/redirects are allowed in your browser

## Security Best Practices

1. **Never commit .env files to version control**
2. **Use different keys for development and production**
3. **Regularly rotate your API keys**
4. **Monitor usage to avoid unexpected charges**
5. **Keep your API keys private and secure**

## Costs and Limits

### Google Gemini AI
- **Free tier:** Generous free quota for development
- **Paid tier:** Pay-as-you-go after free limits
- **Typical cost:** ~$0.001 per 1,000 characters

### Health Data APIs
- **Google Fit:** Free for personal use
- **Strava:** Free tier available
- **Withings:** Free for developers
- **Custom APIs:** Depends on your provider

## Need Help?

1. **Check the console:** Open browser developer tools (F12) for error messages
2. **Review the logs:** Use `./start.sh logs` to see server logs
3. **Consult documentation:** See `HEALTH_DASHBOARD_README.md` for detailed info
4. **Verify configuration:** Double-check all environment variables are set correctly

## Quick Setup Checklist

- [ ] Copy `.env.example` to `.env`
- [ ] Get Google AI API key from makersuite.google.com
- [ ] Configure API key in `.env` file
- [ ] Restart application with `./start.sh stop && ./start.sh start`
- [ ] Test AI responses in chat interface
- [ ] (Optional) Set up health data APIs following `SETUP_HEALTH_APIS.md`
- [ ] Test health dashboard connections

---

**Note:** The application will work with mock/demo data for testing purposes, but real API keys provide much better personalized experiences.
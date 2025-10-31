# Blue.ai Mental Health Companion - Startup Guide

## 🚀 Quick Start

The easiest way to start both the frontend and backend servers is to use the provided startup script:

```bash
./start.sh
```

## 📋 Available Commands

### Start All Servers
```bash
./start.sh
```
This will start both the backend (port 5000) and frontend (port 3000) servers in the background.

### Check Server Status
```bash
./start.sh status
```
Shows the current status of both servers.

### Stop All Servers
```bash
./start.sh stop
```
Stops all running servers and frees up the ports.

### Show Help
```bash
./start.sh help
```
Displays all available commands.

## 🔗 Access Points

Once the servers are running:

- **Frontend Application**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **API Documentation**: http://localhost:5000/api

## 📝 Important Notes

1. **Compilation Time**: The frontend may take 1-2 minutes to fully compile on first run.
2. **Port Availability**: The script automatically handles port conflicts by killing existing processes.
3. **Background Processes**: Servers run in the background, so you can close the terminal after startup.
4. **Dependencies**: The script checks if dependencies are installed and installs them if needed.

## 🛠️ Manual Startup (Alternative)

If you prefer to start servers manually:

### Backend Server
```bash
node backend/server.js
```

### Frontend Server
```bash
npm start
```

## 🔧 Troubleshooting

### Port Already in Use
If you encounter port conflicts, run:
```bash
./start.sh stop
./start.sh
```

### Buffer Error Fixed
The "Buffer is not defined" error has been resolved by using browser-compatible `atob()` instead of Node.js `Buffer`.

### Health Dashboard Access
Once the application is running, you can access the new Health Dashboard at:
- Navigate to: http://localhost:3000
- Click on "Health Dashboard" in the sidebar (❤️ icon)

## 🏥 Health Dashboard Features

The comprehensive health dashboard includes:
- **Sleep Tracking**: Duration, quality, and sleep stage analysis
- **Physical Activity**: Steps, calories, and exercise monitoring
- **Heart Rate**: Real-time HRV and stress level detection
- **Screen Time**: Digital wellness and app usage tracking
- **Mood Prediction**: AI-powered mood analysis with recommendations

## 📱 Project Features

- **AI Chat**: Custom-trained mental health companion (hidden Gemini API)
- **Location Services**: Dynamic location detection with Indian cities
- **Doctor Search**: Find nearby healthcare providers
- **Rewards System**: Gamified wellness tracking
- **Emergency Support**: One-click emergency assistance

---

**Hackathon Ready!** 🎉

All features are fully functional with mock data where needed. The application is ready for demonstration and testing.
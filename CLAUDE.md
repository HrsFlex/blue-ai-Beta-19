# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**SakhiClient** is a React-based mental health companion application featuring an AI-powered avatar with voice interaction capabilities. The application provides a supportive conversational interface with 3D avatar animations and speech recognition.

## Core Technologies

### Frontend Stack
- **React 18.3.1** with Create React App (react-scripts 5.0.1)
- **Three.js 0.170.0** with React Three Fiber for 3D graphics
- **React Three Drei 9.88.0** for Three.js helpers and utilities
- **Tailwind CSS 3.4.13** for styling
- **React Router Dom 6.28.0** for navigation
- **Firebase 10.14.0** for database and authentication
- **Axios 1.7.7** for HTTP requests

### Audio & Speech
- **Microsoft Cognitive Services Speech SDK 1.36.0** for text-to-speech
- **React Speech Recognition 3.10.0** for voice input
- **Mic Recorder to MP3 2.2.2** for audio recording
- **React Audio Player 0.17.0** for audio playback

### 3D & Graphics
- **React Three Fiber 8.15.0** - React renderer for Three.js
- **React Webcam 7.2.0** for camera integration
- **Mapbox GL 2.15.0** and React Map GL 7.1.8 for mapping
- **Various Three.js utilities** for 3D model handling

## Development Commands

```bash
# Start development server
npm start

# Build for production
npm run build

# Run tests
npm run test

# Eject (one-way operation)
npm run eject
```

## Project Architecture

### Directory Structure
```
src/
├── components/
│   ├── ChatBot/           # Main 3D avatar component with speech interaction
│   └── Navbar/           # Navigation component
├── pages/
│   ├── Awards/           # Rewards and achievements
│   ├── Chat/             # Chat interface
│   ├── Diet/             # Diet recommendations
│   ├── Home/             # Main landing page
│   ├── Plans/            # Subscription plans
│   ├── Quiz/             # Mental health assessments
│   ├── Reports/          # Progress reports
│   ├── SearchDocs/       # Doctor/hospital search
│   └── SignUp/           # User registration
├── firbase.js            # Firebase configuration
├── converter.js          # Three.js animation utilities
└── blendDataBlink.json   # 3D model animation data
```

### Key Features

#### 3D Avatar System
- **ChatBot Component**: Main avatar with lip sync and facial expressions
- **Audio Integration**: Real-time speech recognition and text-to-speech
- **3D Model Loading**: GLTF/GLB model support with morph targets
- **Animation System**: Custom blend shapes for facial expressions

#### Voice Interaction
- **Speech Recognition**: Browser-based voice input using Web Speech API
- **Audio Recording**: MP3 recording with mic-recorder-to-mp3
- **Text-to-Speech**: Microsoft Cognitive Services for natural voice output

#### Health Features
- **Mental Health Chat**: AI-powered supportive conversations
- **Progress Tracking**: Quiz results and mood tracking
- **Resource Discovery**: Doctor and hospital search with mapping
- **Personalized Content**: Diet plans and mental health resources

## Important Technical Notes

### Three.js Integration
- Uses React Three Fiber for React-friendly Three.js integration
- 3D models should be optimized for web (GLTF format preferred)
- Texture encoding uses modern Three.js color space approach:
  - `SRGBColorSpace` for color textures
  - `NoColorSpace` for normal maps
  - `LinearSRGBColorSpace` for linear textures

### Audio Recording Implementation
- **Note**: Replaced deprecated `audio-react-recorder` with `mic-recorder-to-mp3`
- Audio recording works with browser's MediaRecorder API
- Recorded audio is converted to MP3 format for storage/playback

### Firebase Integration
- Firestore for real-time database operations
- Firebase authentication for user management
- Real-time data synchronization across components

### Speech Recognition
- Uses Web Speech API through `react-speech-recognition`
- Browser compatibility considerations required
- Fallback text input available for unsupported browsers

## Environment Variables

Create a `.env` file in the root directory:

```bash
# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id

# Microsoft Cognitive Services
REACT_APP_SPEECH_KEY=your_azure_speech_key
REACT_APP_SPEECH_REGION=your_azure_region

# Backend API
REACT_APP_API_BASE_URL=http://localhost:3000
```

## Known Issues & Solutions

### Three.js Deprecation Warnings
- **Issue**: Old Three.js encoding constants (`sRGBEncoding`, `LinearEncoding`) deprecated
- **Solution**: Use new color space approach (`SRGBColorSpace`, `NoColorSpace`)
- **Status**: ✅ Fixed in current implementation

### Audio Recording Compatibility
- **Issue**: `audio-react-recorder` incompatible with React 18
- **Solution**: Replaced with `mic-recorder-to-mp3` for React 18 compatibility
- **Status**: ✅ Implemented with modern audio recording approach

### Browser Compatibility
- **Speech Recognition**: Requires HTTPS for production environments
- **WebGL**: Required for 3D rendering - provide fallbacks for unsupported browsers
- **Media Devices**: Camera and microphone permissions required

## Development Workflow

### Getting Started
1. Install dependencies: `npm install`
2. Set up environment variables (see above)
3. Start development server: `npm start`
4. Application runs on `http://localhost:3000`

### Code Style
- ESLint configuration included with React app preset
- Tailwind CSS for consistent styling
- Component-based architecture with React hooks

### Testing
- Jest and React Testing Library configured
- Run tests with `npm test`
- Coverage reports available

## Performance Considerations

### 3D Model Optimization
- Use Draco compression for 3D models when possible
- Optimize texture sizes for web delivery
- Implement LOD (Level of Detail) for complex models

### Audio Performance
- Compress audio files for faster loading
- Implement audio streaming for longer recordings
- Consider audio format compatibility across browsers

### Network Optimization
- Implement code splitting for large components
- Use lazy loading for 3D assets
- Optimize bundle size with tree shaking

## Deployment

### Production Build
```bash
npm run build
```
Build artifacts are created in the `build/` directory.

### Static Hosting
- Can be deployed to any static hosting service (Netlify, Vercel, AWS S3)
- Ensure proper routing configuration for React Router
- Configure HTTPS for production speech recognition

### Environment Configuration
- Set production environment variables
- Configure Firebase production settings
- Update API endpoints for production backend

## Troubleshooting

### Common Issues

1. **Three.js Errors**: Check model formats and texture paths
2. **Audio Issues**: Verify browser permissions and HTTPS requirements
3. **Firebase Connection**: Check configuration and network connectivity
4. **Speech Recognition**: Ensure microphone permissions and HTTPS

### Debug Tools
- React Developer Tools for component inspection
- Three.js DevTools for 3D scene debugging
- Browser console for network and error monitoring

## Future Development

### Planned Features
- Enhanced avatar animations with blend shapes
- Multi-language support for speech recognition
- Advanced mental health assessment tools
- Real-time video consultation features

### Technical Improvements
- Web Workers for audio processing
- WebGL optimizations for better performance
- Progressive Web App (PWA) capabilities
- Offline functionality for critical features
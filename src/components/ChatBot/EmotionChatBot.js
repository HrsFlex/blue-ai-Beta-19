import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { AiOutlineSend, AiOutlineCamera, AiOutlineAudio, AiOutlineStop } from 'react-icons/ai';
import { BsMicMute } from 'react-icons/bs';
import { FaFaceSmile, FaFaceSadTear, FaFaceAngry, FaFaceGrinStars, FaHeart } from 'react-icons/fa6';
import Webcam from 'react-webcam';
import MicRecorderToMp3 from 'mic-recorder-to-mp3';
import './EmotionChatBot.css';

const EmotionChatBot = ({ userId, onEmotionUpdate }) => {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [isWebcamActive, setIsWebcamActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [multimodalInput, setMultimodalInput] = useState({
    text: '',
    image: null,
    audio: null
  });

  const webcamRef = useRef(null);
  const messagesEndRef = useRef(null);
  const [Mp3Recorder, setMp3Recorder] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);

  // Emotion mapping for UI
  const emotionConfig = {
    'Sadness': { icon: <FaFaceSadTear />, color: '#4A90E2', bg: 'rgba(74, 144, 226, 0.1)' },
    'Joyful': { icon: <FaFaceSmile />, color: '#F5A623', bg: 'rgba(245, 166, 35, 0.1)' },
    'Love': { icon: <FaHeart />, color: '#D0021B', bg: 'rgba(208, 2, 27, 0.1)' },
    'Anger': { icon: <FaFaceAngry />, color: '#E85D75', bg: 'rgba(232, 93, 117, 0.1)' },
    'Fear': { icon: <FaFaceGrinStars />, color: '#9013FE', bg: 'rgba(144, 19, 254, 0.1)' },
    'Surprise': { icon: <FaFaceGrinStars />, color: '#50E3C2', bg: 'rgba(80, 227, 194, 0.1)' },
    'uncertain': { icon: <FaFaceSmile />, color: '#CCCCCC', bg: 'rgba(204, 204, 204, 0.1)' }
  };

  useEffect(() => {
    // Initialize audio recorder
    const recorder = new MicRecorderToMp3({ bitRate: 128 });
    setMp3Recorder(recorder);

    // Welcome message
    setMessages([{
      id: 1,
      type: 'bot',
      text: "Hi! I'm Sakhi, your mental health companion. I can understand your emotions through text, facial expressions, and voice. How are you feeling today?",
      timestamp: new Date(),
      emotion: null,
      confidence: null
    }]);
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() && !multimodalInput.image && !multimodalInput.audio) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputText,
      timestamp: new Date(),
      hasImage: !!multimodalInput.image,
      hasAudio: !!multimodalInput.audio
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      let response;

      // Check if we have multimodal input
      if (multimodalInput.image || multimodalInput.audio) {
        // Use multimodal endpoint
        const multimodalData = {
          text: inputText || null,
          image_data: multimodalInput.image || null,
          audio_data: multimodalInput.audio || null,
          user_id: userId
        };

        const apiResponse = await axios.post('/api/emotion/multimodal', multimodalData);
        response = apiResponse.data;
      } else {
        // Use regular chat endpoint
        const apiResponse = await axios.post('/chatbot', {
          message: inputText,
          userId
        });
        response = apiResponse.data;
      }

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.answer,
        timestamp: new Date(),
        emotion: response.emotion,
        confidence: response.confidence,
        intent: response.intent,
        multimodal: response.multimodal,
        context: response.context
      };

      setMessages(prev => [...prev, botMessage]);

      // Update current emotion state
      if (response.emotion && response.emotion !== 'uncertain') {
        setCurrentEmotion({
          emotion: response.emotion,
          confidence: response.confidence,
          multimodal: response.multimodal
        });

        // Notify parent component
        if (onEmotionUpdate) {
          onEmotionUpdate(response);
        }
      }

      // Clear inputs
      setInputText('');
      setMultimodalInput({ text: '', image: null, audio: null });

    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm having trouble connecting right now, but I want you to know that I'm here for you. Could you try again?",
        timestamp: new Date(),
        emotion: 'uncertain',
        confidence: 0.0
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const captureImage = () => {
    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setMultimodalInput(prev => ({ ...prev, image: imageSrc }));
      setIsWebcamActive(false);
    }
  };

  const startRecording = async () => {
    try {
      await Mp3Recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
    }
  };

  const stopRecording = async () => {
    try {
      const [blob] = await Mp3Recorder.stop();
      setIsRecording(false);

      // Convert blob to base64
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64Audio = reader.result;
        setMultimodalInput(prev => ({ ...prev, audio: base64Audio }));
        setAudioBlob(blob);
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  };

  const playAudio = () => {
    if (audioBlob) {
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      audio.play();
    }
  };

  const clearMultimodalInput = () => {
    setMultimodalInput({ text: '', image: null, audio: null });
    setAudioBlob(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const hasMultimodalInput = multimodalInput.image || multimodalInput.audio;

  return (
    <div className="emotion-chatbot">
      {/* Current Emotion Display */}
      {currentEmotion && (
        <div className="current-emotion-bar" style={{
          background: emotionConfig[currentEmotion.emotion]?.bg || '#f5f5f5',
          borderLeftColor: emotionConfig[currentEmotion.emotion]?.color || '#ccc'
        }}>
          <div className="emotion-info">
            <span className="emotion-icon" style={{ color: emotionConfig[currentEmotion.emotion]?.color }}>
              {emotionConfig[currentEmotion.emotion]?.icon}
            </span>
            <span className="emotion-text">Current Emotion: {currentEmotion.emotion}</span>
            <span className="confidence-badge">
              {Math.round(currentEmotion.confidence * 100)}% confidence
            </span>
            {currentEmotion.multimodal && (
              <span className="multimodal-indicator">Multi-Modal Analysis</span>
            )}
          </div>
        </div>
      )}

      {/* Messages Container */}
      <div className="messages-container">
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.type}`}>
            <div className="message-content">
              {message.type === 'user' ? (
                <>
                  <div className="message-text">{message.text}</div>
                  {message.hasImage && (
                    <div className="message-indicator">
                      <AiOutlineCamera /> Photo included
                    </div>
                  )}
                  {message.hasAudio && (
                    <div className="message-indicator">
                      <AiOutlineAudio /> Voice message included
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="message-text">{message.text}</div>
                  {message.emotion && (
                    <div className="emotion-analysis">
                      <span className="detected-emotion" style={{
                        background: emotionConfig[message.emotion]?.bg,
                        color: emotionConfig[message.emotion]?.color
                      }}>
                        {emotionConfig[message.emotion]?.icon} {message.emotion}
                      </span>
                      {message.confidence && (
                        <span className="confidence-level">
                          {Math.round(message.confidence * 100)}% confidence
                        </span>
                      )}
                      {message.multimodal && (
                        <span className="analysis-type">Multi-Modal Analysis</span>
                      )}
                      {message.context && (
                        <div className="context-info">
                          <small>Based on mental health knowledge base</small>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="message-time">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="message bot loading">
            <div className="typing-indicator">
              <span></span>
              <span></span>
              <span></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Multimodal Input Preview */}
      {hasMultimodalInput && (
        <div className="multimodal-preview">
          <div className="preview-header">
            <span>Multi-Modal Input</span>
            <button onClick={clearMultimodalInput} className="clear-button">Clear</button>
          </div>
          <div className="preview-content">
            {multimodalInput.image && (
              <div className="image-preview">
                <img src={multimodalInput.image} alt="Captured" />
                <span>Photo</span>
              </div>
            )}
            {multimodalInput.audio && (
              <div className="audio-preview">
                <button onClick={playAudio} className="play-button">
                  <AiOutlineAudio /> Play Voice
                </button>
                <span>Voice Message</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Webcam Modal */}
      {isWebcamActive && (
        <div className="webcam-modal">
          <div className="webcam-container">
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              height="auto"
            />
            <div className="webcam-controls">
              <button onClick={captureImage} className="capture-button">
                <AiOutlineCamera /> Capture
              </button>
              <button onClick={() => setIsWebcamActive(false)} className="cancel-button">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Controls */}
      <div className="input-controls">
        {/* Input Methods */}
        <div className="input-methods">
          <button
            onClick={() => setIsWebcamActive(true)}
            className={`input-method-button ${multimodalInput.image ? 'active' : ''}`}
            title="Add Photo"
          >
            <AiOutlineCamera />
          </button>

          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            className={`input-method-button ${isRecording ? 'recording' : ''} ${multimodalInput.audio ? 'active' : ''}`}
            title="Record Voice"
          >
            {isRecording ? <AiOutlineStop /> : <AiOutlineAudio />}
          </button>
        </div>

        {/* Text Input */}
        <div className="text-input-container">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message or use voice/camera..."
            className="text-input"
            disabled={isLoading}
          />
        </div>

        {/* Send Button */}
        <button
          onClick={handleSendMessage}
          disabled={isLoading || (!inputText.trim() && !hasMultimodalInput)}
          className="send-button"
        >
          <AiOutlineSend />
        </button>
      </div>

      {/* Recording Indicator */}
      {isRecording && (
        <div className="recording-indicator">
          <div className="recording-dot"></div>
          Recording voice...
        </div>
      )}
    </div>
  );
};

export default EmotionChatBot;
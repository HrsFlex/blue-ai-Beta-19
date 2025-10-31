import React, { useState, useEffect, useRef } from 'react';
import './VideoRecommendation.css';

const VideoRecommendation = ({ videos, onComplete, onClose }) => {
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [watchedVideos, setWatchedVideos] = useState(new Set());
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [watchTime, setWatchTime] = useState({});
  const [showProgress, setShowProgress] = useState(false);
  const videoRefs = useRef([]);

  useEffect(() => {
    // Track video watch time
    const interval = setInterval(() => {
      if (isVideoPlaying) {
        const currentVideoId = videos[currentVideoIndex]?.id;
        if (currentVideoId) {
          setWatchTime(prev => ({
            ...prev,
            [currentVideoId]: (prev[currentVideoId] || 0) + 1
          }));

          // Consider video "watched" if user watched for at least 10 seconds
          if (watchTime[currentVideoId] >= 10) {
            setWatchedVideos(prev => new Set([...prev, currentVideoId]));
          }
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isVideoPlaying, currentVideoIndex, videos, watchTime]);

  const handleVideoPlay = () => {
    setIsVideoPlaying(true);
    setShowProgress(true);
  };

  const handleVideoPause = () => {
    setIsVideoPlaying(false);
  };

  const handleVideoEnded = () => {
    setIsVideoPlaying(false);
    markVideoAsWatched();
  };

  const markVideoAsWatched = () => {
    const currentVideoId = videos[currentVideoIndex]?.id;
    if (currentVideoId) {
      setWatchedVideos(prev => new Set([...prev, currentVideoId]));
    }
  };

  const handleNextVideo = () => {
    if (currentVideoIndex < videos.length - 1) {
      setCurrentVideoIndex(prev => prev + 1);
      setIsVideoPlaying(false);
    }
  };

  const handlePrevVideo = () => {
    if (currentVideoIndex > 0) {
      setCurrentVideoIndex(prev => prev - 1);
      setIsVideoPlaying(false);
    }
  };

  const handleComplete = () => {
    const videosCount = watchedVideos.size;
    onComplete(videosCount);
  };

  const currentVideo = videos[currentVideoIndex];
  const progress = watchTime[currentVideo?.id] || 0;
  const isWatched = watchedVideos.has(currentVideo?.id);

  return (
    <div className="video-recommendation-overlay">
      <div className="video-recommendation-modal">
        <div className="modal-header">
          <div className="header-content">
            <h3>🎬 Uplifting Content for You</h3>
            <p>Take a break and enjoy some positive content!</p>
          </div>
          <button className="close-button" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="video-progress-bar">
          <div className="progress-info">
            <span>Video {currentVideoIndex + 1} of {videos.length}</span>
            <span>{watchedVideos.size} watched</span>
          </div>
          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${((currentVideoIndex + 1) / videos.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="video-container">
          <div className="video-player">
            <div className="video-wrapper">
              <iframe
                src={`${currentVideo.url}?autoplay=0&rel=0&modestbranding=1`}
                title={currentVideo.title}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="video-iframe"
                onLoad={() => {
                  const iframe = videoRefs.current[currentVideoIndex];
                  if (iframe) {
                    try {
                      // Try to access video player events (limited due to cross-origin)
                      iframe.contentWindow.postMessage('{"event":"command","func":"addEventListener","args":["onStateChange","handleStateChange"]}', '*');
                    } catch (e) {
                      console.log('Cross-origin iframe, limited tracking available');
                    }
                  }
                }}
              />
            </div>

            {showProgress && (
              <div className="video-watch-indicator">
                <div className={`watch-status ${isWatched ? 'watched' : 'watching'}`}>
                  {isWatched ? '✅ Watched' : `⏱️ ${progress}s watched`}
                </div>
              </div>
            )}
          </div>

          <div className="video-info">
            <h4>{currentVideo.title}</h4>
            <div className="video-actions">
              <button
                className="nav-button prev"
                onClick={handlePrevVideo}
                disabled={currentVideoIndex === 0}
              >
                ← Previous
              </button>
              <button
                className="action-button mark-watched"
                onClick={markVideoAsWatched}
                disabled={isWatched}
              >
                {isWatched ? '✅ Watched' : 'Mark as Watched'}
              </button>
              <button
                className="nav-button next"
                onClick={handleNextVideo}
                disabled={currentVideoIndex === videos.length - 1}
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        <div className="video-thumbnails">
          <p className="thumbnails-label">More Videos:</p>
          <div className="thumbnails-grid">
            {videos.map((video, index) => (
              <button
                key={video.id}
                className={`thumbnail-item ${index === currentVideoIndex ? 'active' : ''} ${watchedVideos.has(video.id) ? 'watched' : ''}`}
                onClick={() => {
                  setCurrentVideoIndex(index);
                  setIsVideoPlaying(false);
                }}
              >
                <div className="thumbnail-wrapper">
                  <img
                    src={video.thumbnail}
                    alt={video.title}
                    className="thumbnail-image"
                  />
                  {watchedVideos.has(video.id) && (
                    <div className="watched-overlay">
                      <span>✅</span>
                    </div>
                  )}
                  {index === currentVideoIndex && (
                    <div className="playing-indicator">
                      <span>▶</span>
                    </div>
                  )}
                </div>
                <span className="thumbnail-title">{video.title}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="modal-footer">
          <div className="completion-stats">
            <span>You've watched {watchedVideos.size} out of {videos.length} videos</span>
            <div className="completion-percentage">
              {Math.round((watchedVideos.size / videos.length) * 100)}% Complete
            </div>
          </div>
          <button
            className="complete-button"
            onClick={handleComplete}
            disabled={watchedVideos.size === 0}
          >
            Done Watching 💫
          </button>
        </div>
      </div>
    </div>
  );
};

export default VideoRecommendation;
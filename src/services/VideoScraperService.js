import axios from 'axios';

class VideoScraperService {
  constructor() {
    this.cache = new Map();
    this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    this.youtubeApiKey = process.env.REACT_APP_YOUTUBE_API_KEY;

    // Enhanced fallback video libraries with Instagram-like content
    this.fallbackVideos = {
      youtube: [
        { id: 'J---aiyzdGQ', title: 'Cute Cats Compilation', description: 'Adorable cat moments that will make you smile', thumbnail: 'https://img.youtube.com/vi/J---aiyzdGQ/hqdefault.jpg', mood: 'joy' },
        { id: 'TP4_l3QG_qQ', title: 'Baby Laughing Hysterically', description: 'Infectious baby laughter that will brighten your day', thumbnail: 'https://img.youtube.com/vi/TP4_l3QG_qQ/hqdefault.jpg', mood: 'joy' },
        { id: '9hRiLhZ2GvU', title: 'Dogs Welcome Soldiers Home', description: 'Heartwarming reunions between dogs and their owners', thumbnail: 'https://img.youtube.com/vi/9hRiLhZ2GvU/hqdefault.jpg', mood: 'joy' },
        { id: '8KkKuTCFvZU', title: 'Try Not to Laugh Challenge', description: 'Impossible not to laugh compilation', thumbnail: 'https://img.youtube.com/vi/8KkKuTCFvZU/hqdefault.jpg', mood: 'humor' },
        { id: 'L_Guz73e6fw', title: 'Puppies Playing in Park', description: 'Adorable puppies having fun outdoors', thumbnail: 'https://img.youtube.com/vi/L_Guz73e6fw/hqdefault.jpg', mood: 'joy' },
        { id: 'gC_L9qAHVJ8', title: 'Baby Laughing', description: 'Pure baby joy', thumbnail: 'https://img.youtube.com/vi/gC_L9qAHVJ8/hqdefault.jpg', mood: 'joy' },
        { id: 'kJQP7kiw5Fk', title: 'Louis C.K. on Being Happy', description: 'Comedy about happiness', thumbnail: 'https://img.youtube.com/vi/kJQP7kiw5Fk/hqdefault.jpg', mood: 'humor' },
        { id: 'hpa3qbGi_3M', title: 'Cute Animals Compilation', description: 'Adorable animal moments', thumbnail: 'https://img.youtube.com/vi/hpa3qbGi_3M/hqdefault.jpg', mood: 'joy' }
      ],
      instagram: [
        { id: 'ig_reel_1', title: 'Sunset Time Lapse', description: 'Beautiful sunset calming views', thumbnail: 'https://picsum.photos/400/400?random=1', url: 'https://www.instagram.com/reel/Cvd8QjYpFQX/', mood: 'calm', platform: 'instagram' },
        { id: 'ig_reel_2', title: 'Cute Puppy Playing', description: 'Adorable puppy moments', thumbnail: 'https://picsum.photos/400/400?random=2', url: 'https://www.instagram.com/reel/Cvd8RjYpFQX/', mood: 'joy', platform: 'instagram' },
        { id: 'ig_reel_3', title: 'Ocean Waves', description: 'Peaceful ocean sounds', thumbnail: 'https://picsum.photos/400/400?random=3', url: 'https://www.instagram.com/reel/Cvd8TjYpFQX/', mood: 'calm', platform: 'instagram' },
        { id: 'ig_reel_4', title: 'Inspirational Quotes', description: 'Daily motivation', thumbnail: 'https://picsum.photos/400/400?random=4', url: 'https://www.instagram.com/reel/Cvd8UjYpFQX/', mood: 'motivation', platform: 'instagram' },
        { id: 'ig_reel_5', title: 'Dancing Parrot', description: 'Funny dancing bird', thumbnail: 'https://picsum.photos/400/400?random=5', url: 'https://www.instagram.com/reel/Cvd8VjYpFQX/', mood: 'humor', platform: 'instagram' },
        { id: 'ig_reel_6', title: 'Flower Garden', description: 'Beautiful nature scenes', thumbnail: 'https://picsum.photos/400/400?random=6', url: 'https://www.instagram.com/reel/Cvd8WjYpFQX/', mood: 'calm', platform: 'instagram' },
        { id: 'ig_reel_7', title: 'Cat Being Silly', description: 'Funny cat moments', thumbnail: 'https://picsum.photos/400/400?random=7', url: 'https://www.instagram.com/reel/Cvd8XjYpFQX/', mood: 'humor', platform: 'instagram' },
        { id: 'ig_reel_8', title: 'Morning Yoga', description: 'Gentle stretching routine', thumbnail: 'https://picsum.photos/400/400?random=8', url: 'https://www.instagram.com/reel/Cvd8YjYpFQX/', mood: 'calm', platform: 'instagram' }
      ]
    };
  }

  // YouTube Video Scraper using YouTube Data API v3
  async scrapeYouTubeVideos(query = 'funny cute animals uplifting', maxResults = 10) {
    try {
      const cacheKey = `youtube_${query}_${maxResults}`;

      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // Search for videos
      const searchUrl = `https://www.googleapis.com/youtube/v3/search`;
      const searchParams = {
        part: 'snippet',
        q: query,
        type: 'video',
        maxResults: maxResults,
        videoDefinition: 'high',
        videoDuration: 'short', // Under 4 minutes
        order: 'relevance',
        key: this.youtubeApiKey
      };

      const searchResponse = await axios.get(searchUrl, { params: searchParams });
      const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');

      // Get video details
      const detailsUrl = `https://www.googleapis.com/youtube/v3/videos`;
      const detailsParams = {
        part: 'contentDetails,statistics',
        id: videoIds,
        key: this.youtubeApiKey
      };

      const detailsResponse = await axios.get(detailsUrl, { params: detailsParams });

      // Combine search results with details
      const videos = searchResponse.data.items.map((item, index) => {
        const details = detailsResponse.data.items.find(detail => detail.id === item.id.videoId);
        return {
          id: item.id.videoId,
          title: item.snippet.title,
          description: item.snippet.description,
          thumbnail: item.snippet.thumbnails.high.url,
          url: `https://www.youtube.com/embed/${item.id.videoId}`,
          platform: 'youtube',
          publishedAt: item.snippet.publishedAt,
          duration: details?.contentDetails?.duration || 'PT0S',
          viewCount: parseInt(details?.statistics?.viewCount || '0'),
          likeCount: parseInt(details?.statistics?.likeCount || '0'),
          category: this.categorizeVideo(item.snippet.title, item.snippet.description),
          tags: item.snippet.tags || []
        };
      }).filter(video => this.isSafeVideo(video));

      // Cache the results
      this.cache.set(cacheKey, {
        data: videos,
        timestamp: Date.now()
      });

      return videos;
    } catch (error) {
      console.error('YouTube scraping error:', error);
      return this.getFallbackYouTubeVideos();
    }
  }

  // Enhanced Instagram Reels Scraper with multiple fallback strategies
  async scrapeInstagramReels(hashtag = 'funny', maxResults = 10) {
    try {
      const cacheKey = `instagram_${hashtag}_${maxResults}`;

      // Check cache first
      if (this.cache.has(cacheKey)) {
        const cached = this.cache.get(cacheKey);
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data;
        }
      }

      // Try multiple Instagram scraping approaches
      let reels = [];

      // Method 1: Try to use Instagram embed API (if available)
      try {
        reels = await this.scrapeInstagramEmbeds(hashtag, maxResults);
      } catch (embedError) {
        console.log('Instagram embed scraping failed, trying alternative method');
      }

      // Method 2: Try third-party API (if configured)
      if (reels.length === 0) {
        try {
          reels = await this.scrapeInstagramThirdParty(hashtag, maxResults);
        } catch (apiError) {
          console.log('Third-party Instagram API failed, using fallback');
        }
      }

      // Method 3: Use enhanced fallback with mood-based content
      if (reels.length === 0) {
        reels = this.getEnhancedInstagramFallback(hashtag, maxResults);
      }

      // Cache the results
      this.cache.set(cacheKey, {
        data: reels,
        timestamp: Date.now()
      });

      return reels;
    } catch (error) {
      console.error('Instagram scraping error:', error);
      return this.getEnhancedInstagramFallback(hashtag, maxResults);
    }
  }

  // Try to scrape Instagram using embed endpoints
  async scrapeInstagramEmbeds(hashtag, maxResults) {
    // This would require backend implementation for actual Instagram scraping
    // For now, return empty array to trigger fallback
    return [];
  }

  // Try third-party Instagram API services
  async scrapeInstagramThirdParty(hashtag, maxResults) {
    // Implementation would go here for services like RapidAPI
    // For now, return empty array to trigger fallback
    return [];
  }

  // Enhanced Instagram fallback with mood-based content
  getEnhancedInstagramFallback(hashtag, maxResults) {
    const moodMappings = {
      'funny': ['humor', 'joy'],
      'uplifting': ['motivation', 'joy'],
      'calm': ['calm', 'peaceful'],
      'cute': ['joy', 'calm'],
      'inspiring': ['motivation', 'joy']
    };

    const desiredMoods = moodMappings[hashtag] || ['joy', 'humor', 'calm'];
    const filteredVideos = this.fallbackVideos.instagram.filter(video =>
      desiredMoods.includes(video.mood)
    );

    return filteredVideos.slice(0, maxResults);
  }

  // Enhanced video categorization
  categorizeVideo(title, description) {
    const text = (title + ' ' + description).toLowerCase();

    if (text.includes('cat') || text.includes('kitten') || text.includes('puppy') || text.includes('dog')) {
      return 'animals';
    }
    if (text.includes('baby') || text.includes('toddler') || text.includes('kid')) {
      return 'babies';
    }
    if (text.includes('fail') || text.includes('funny') || text.includes('comedy') || text.includes('lol')) {
      return 'comedy';
    }
    if (text.includes('inspire') || text.includes('motivate') || text.includes('feel good')) {
      return 'inspirational';
    }
    if (text.includes('dance') || text.includes('music') || text.includes('sing')) {
      return 'entertainment';
    }

    return 'general';
  }

  // Content safety check
  isSafeVideo(video) {
    const text = (video.title + ' ' + video.description).toLowerCase();
    const unsafeKeywords = ['violence', 'death', 'inappropriate', 'adult', 'shocking'];

    return !unsafeKeywords.some(keyword => text.includes(keyword)) &&
           video.viewCount > 1000 && // Has some views
           video.title.length > 10; // Has meaningful title
  }

  // Enhanced fallback YouTube videos (curated safe content with mood metadata)
  getFallbackYouTubeVideos() {
    return this.fallbackVideos.youtube.map(video => ({
      ...video,
      url: `https://www.youtube.com/embed/${video.id}`,
      platform: 'youtube',
      category: this.categorizeVideo(video.title, video.description),
      viewCount: Math.floor(Math.random() * 50000000) + 1000000,
      likeCount: Math.floor(Math.random() * 2000000) + 50000
    }));
  }

  // Fallback Instagram Reels
  getFallbackInstagramReels(hashtag, maxResults) {
    return [
      {
        id: 'ig_reel_1',
        title: 'Cute Dog Moments',
        description: 'Daily dose of adorable dog content',
        thumbnail: 'https://via.placeholder.com/400x400/4CAF50/white?text=Cute+Dog',
        url: 'https://www.instagram.com/reel/demo1/', // Demo URL
        platform: 'instagram',
        category: 'animals',
        likeCount: 50000,
        hashtag: hashtag
      },
      {
        id: 'ig_reel_2',
        title: 'Baby First Laugh',
        description: 'Pure joy captured on camera',
        thumbnail: 'https://via.placeholder.com/400x400/2196F3/white?text=Baby+Laugh',
        url: 'https://www.instagram.com/reel/demo2/',
        platform: 'instagram',
        category: 'babies',
        likeCount: 75000,
        hashtag: hashtag
      }
    ].slice(0, maxResults);
  }

  // Enhanced mixed content from both platforms with intelligent fallback
  async getMixedContent(query = 'uplifting funny', maxResults = 10) {
    try {
      // Try to get content from both platforms
      let youtubeVideos = [];
      let instagramReels = [];

      // Attempt YouTube scraping with fallback
      try {
        youtubeVideos = await this.scrapeYouTubeVideos(query, Math.ceil(maxResults / 2));
      } catch (youtubeError) {
        console.warn('YouTube scraping failed, using fallback:', youtubeError.message);
        youtubeVideos = this.getFallbackYouTubeVideos().slice(0, Math.ceil(maxResults / 2));
      }

      // Attempt Instagram scraping with fallback
      try {
        instagramReels = await this.scrapeInstagramReels(query.split(' ')[0], Math.floor(maxResults / 2));
      } catch (instagramError) {
        console.warn('Instagram scraping failed, using fallback:', instagramError.message);
        instagramReels = this.getEnhancedInstagramFallback(query.split(' ')[0], Math.floor(maxResults / 2));
      }

      // Combine and intelligent mix
      let allVideos = [...youtubeVideos, ...instagramReels];

      // If we still don't have enough videos, supplement with additional fallback content
      if (allVideos.length < maxResults) {
        const additionalFallbacks = this.getSmartFallbackContent(query, maxResults - allVideos.length);
        allVideos = [...allVideos, ...additionalFallbacks];
      }

      // Ensure platform diversity (at least 2 different platforms if possible)
      allVideos = this.ensurePlatformDiversity(allVideos, maxResults);

      // Shuffle and return final results
      return this.shuffleArray(allVideos).slice(0, maxResults);
    } catch (error) {
      console.error('Mixed content error:', error);
      return this.getEmergencyFallbackContent(maxResults);
    }
  }

  // Smart fallback content based on query analysis
  getSmartFallbackContent(query, count) {
    const queryLower = query.toLowerCase();
    let mood = 'joy'; // default

    if (queryLower.includes('calm') || queryLower.includes('relax')) {
      mood = 'calm';
    } else if (queryLower.includes('funny') || queryLower.includes('laugh')) {
      mood = 'humor';
    } else if (queryLower.includes('motivat') || queryLower.includes('inspire')) {
      mood = 'motivation';
    }

    // Get mixed content from both fallback libraries
    const youtubeMood = this.fallbackVideos.youtube.filter(v => v.mood === mood);
    const instagramMood = this.fallbackVideos.instagram.filter(v => v.mood === mood);

    const mixedFallbacks = [...youtubeMood, ...instagramMood];
    return this.shuffleArray(mixedFallbacks).slice(0, count);
  }

  // Ensure platform diversity in results
  ensurePlatformDiversity(videos, maxResults) {
    const youtubeVideos = videos.filter(v => v.platform === 'youtube');
    const instagramVideos = videos.filter(v => v.platform === 'instagram');

    const balanced = [];
    const youtubeCount = Math.min(youtubeVideos.length, Math.ceil(maxResults * 0.6));
    const instagramCount = Math.min(instagramVideos.length, Math.floor(maxResults * 0.4));

    // Add YouTube videos
    balanced.push(...youtubeVideos.slice(0, youtubeCount));

    // Add Instagram videos
    balanced.push(...instagramVideos.slice(0, instagramCount));

    // If we need more videos, add from either platform
    if (balanced.length < maxResults) {
      const remaining = maxResults - balanced.length;
      const allRemaining = [...youtubeVideos.slice(youtubeCount), ...instagramVideos.slice(instagramCount)];
      balanced.push(...allRemaining.slice(0, remaining));
    }

    return balanced;
  }

  // Emergency fallback content when everything else fails
  getEmergencyFallbackContent(maxResults) {
    const emergencyVideos = [
      ...this.fallbackVideos.youtube.slice(0, 3),
      ...this.fallbackVideos.instagram.slice(0, 2)
    ];

    return emergencyVideos.slice(0, maxResults);
  }

  // Get videos by mood/category
  async getVideosByMood(mood, language = 'en') {
    const moodQueries = {
      sad: {
        en: 'uplifting comforting feel good',
        es: 'animado consuelo sentirse bien',
        fr: 'réconfortant réconfortant se sentir bien',
        de: 'aufmunternd tröstend sich gut fühlen',
        hi: 'प्रेरक आरामदायक अच्छा महसूस'
      },
      stressed: {
        en: 'calming relaxing peaceful',
        es: 'calmante relajante pacífico',
        fr: 'calmant relaxant paisible',
        de: 'beruhigend entspannend friedlich',
        hi: 'शांत करने वाला आरामदायक शांत'
      },
      happy: {
        en: 'celebration joy funny',
        es: 'celebración alegría divertido',
        fr: 'célébration joie drôle',
        de: 'feier freude lustig',
        hi: 'जश्न खुशी मजेदार'
      },
      neutral: {
        en: 'interesting funny inspiring',
        es: 'interesante divertido inspirador',
        fr: 'intéressant drôle inspirant',
        de: 'interessant lustig inspirierend',
        hi: 'दिलचस्प मजेदार प्रेरणादायक'
      }
    };

    const query = moodQueries[mood]?.[language] || moodQueries[mood]?.en || 'uplifting funny';
    return await this.getMixedContent(query, 8);
  }

  // Utility function to shuffle array
  shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  }

  // Clear cache
  clearCache() {
    this.cache.clear();
  }
}

export default new VideoScraperService();
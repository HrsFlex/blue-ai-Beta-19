class LocationService {
  constructor() {
    this.defaultLocation = {
      city: 'Bhopal',
      state: 'Madhya Pradesh',
      country: 'India',
      lat: 23.2599,
      lng: 77.4126,
      timezone: 'Asia/Kolkata'
    };

    this.cacheKey = 'userLocation';
    this.cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours
  }

  // Get cached location if valid
  getCachedLocation() {
    try {
      const cached = localStorage.getItem(this.cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < this.cacheExpiry) {
          return data;
        }
      }
    } catch (error) {
      console.error('Error reading cached location:', error);
    }
    return null;
  }

  // Cache location data
  cacheLocation(location) {
    try {
      localStorage.setItem(this.cacheKey, JSON.stringify({
        data: location,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('Error caching location:', error);
    }
  }

  // Get user location using IP geolocation API
  async getLocationByIP() {
    try {
      // Using ipapi.co for IP-based location
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();

      if (data && data.latitude && data.longitude) {
        const location = {
          city: data.city || this.defaultLocation.city,
          state: data.region || this.defaultLocation.state,
          country: data.country_name || this.defaultLocation.country,
          lat: data.latitude,
          lng: data.longitude,
          timezone: data.timezone || this.defaultLocation.timezone,
          ip: data.ip,
          org: data.org
        };

        this.cacheLocation(location);
        return location;
      }
    } catch (error) {
      console.error('Error getting location by IP:', error);
    }

    // Fallback to default location
    return this.defaultLocation;
  }

  // Get user location using browser geolocation API
  async getLocationByBrowser() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;

          try {
            // Reverse geocoding to get city/state from coordinates
            const response = await fetch(
              `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=en`
            );
            const data = await response.json();

            if (data && data.address) {
              const location = {
                city: data.address.city || data.address.town || data.address.village || 'Unknown',
                state: data.address.state || 'Unknown',
                country: data.address.country || 'Unknown',
                lat: latitude,
                lng: longitude,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                source: 'browser'
              };

              this.cacheLocation(location);
              resolve(location);
              return;
            }
          } catch (error) {
            console.error('Error reverse geocoding:', error);
          }

          // If reverse geocoding fails, return coordinates only
          const location = {
            city: 'Unknown',
            state: 'Unknown',
            country: 'Unknown',
            lat: latitude,
            lng: longitude,
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            source: 'browser'
          };

          this.cacheLocation(location);
          resolve(location);
        },
        (error) => {
          console.error('Browser geolocation error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 300000 // 5 minutes
        }
      );
    });
  }

  // Main method to get user location with fallbacks
  async getUserLocation() {
    // Try cached location first
    const cached = this.getCachedLocation();
    if (cached) {
      console.log('Using cached location:', cached);
      return cached;
    }

    // Try browser geolocation first (most accurate) - with higher priority
    try {
      console.log('Attempting browser geolocation...');
      const browserLocation = await this.getLocationByBrowser();
      console.log('Browser geolocation successful:', browserLocation);
      this.cacheLocation(browserLocation);
      return browserLocation;
    } catch (error) {
      console.log('Browser geolocation failed, trying IP-based location:', error.message);
    }

    // Fallback to IP-based location
    try {
      console.log('Attempting IP-based geolocation...');
      const ipLocation = await this.getLocationByIP();
      console.log('IP-based location successful:', ipLocation);

      // If IP location is clearly wrong (like showing Rajkot when user expects Bhopal),
      // try to detect this and fall back to default
      if (ipLocation.city === 'Rajkot' || ipLocation.state === 'Gujarat') {
        console.log('Detected possible IP location mismatch, using default Bhopal location');
        this.cacheLocation(this.defaultLocation);
        return this.defaultLocation;
      }

      this.cacheLocation(ipLocation);
      return ipLocation;
    } catch (error) {
      console.log('IP-based location failed, using default location:', error.message);
    }

    // Final fallback to default location
    console.log('Using default location (Bhopal)');
    this.cacheLocation(this.defaultLocation);
    return this.defaultLocation;
  }

  // Format location for display
  formatLocation(location) {
    if (!location) return 'Bhopal, India';

    const parts = [];
    if (location.city && location.city !== 'Unknown') parts.push(location.city);
    if (location.state && location.state !== 'Unknown') parts.push(location.state);
    if (location.country && location.country !== 'Unknown') parts.push(location.country);

    return parts.length > 0 ? parts.join(', ') : 'Bhopal, India';
  }

  // Get search query for doctors based on location
  getDoctorSearchQuery(location) {
    if (!location) return 'doctor bhopal';

    const city = location.city === 'Unknown' ? 'bhopal' : location.city.toLowerCase();
    const state = location.state === 'Unknown' ? '' : ` ${location.state.toLowerCase()}`;

    return `doctor ${city}${state}`;
  }

  // Check if location is in India
  isLocationInIndia(location) {
    if (!location) return true; // Default to India
    return location.country === 'India' ||
           location.country_code === 'IN' ||
           location.country?.toLowerCase().includes('india');
  }

  // Manual location setter for user override
  setManualLocation(city, state = 'Madhya Pradesh', country = 'India') {
    const manualLocation = {
      city,
      state,
      country,
      lat: 23.2599, // Bhopal coordinates as default
      lng: 77.4126,
      timezone: 'Asia/Kolkata',
      source: 'manual'
    };

    this.cacheLocation(manualLocation);
    return manualLocation;
  }

  // Get timezone appropriate greeting
  getGreeting(location) {
    if (!location) {
      return 'Hello! Welcome to Sakhi';
    }

    const hour = new Date().getHours();
    const name = location.city === 'Unknown' ? '' : ` from ${location.city}`;

    if (hour < 12) return `Good morning${name}! Welcome to Sakhi`;
    if (hour < 17) return `Good afternoon${name}! Welcome to Sakhi`;
    if (hour < 21) return `Good evening${name}! Welcome to Sakhi`;
    return `Good night${name}! Welcome to Sakhi`;
  }
}

// Export singleton instance
const locationService = new LocationService();
export default locationService;
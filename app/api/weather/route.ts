import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

// Weather cache store (simple in-memory cache)
interface WeatherData {
  location: string;
  temperature: number;
  feelsLike: number;
  humidity: number;
  windSpeed: number;
  windGust: number;
  windDirection: number;
  uvIndex: number;
  description: string;
  cached?: boolean;
  stale?: boolean;
  cacheAge?: number;
  warning?: string;
  fallback?: boolean;
}

const weatherCache = new Map<string, { data: WeatherData; timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Default weather fallback for when service is down
const DEFAULT_WEATHER: WeatherData = {
  location: 'Default Location',
  temperature: 75,
  feelsLike: 75,
  humidity: 50,
  windSpeed: 5,
  windGust: 0,
  windDirection: 0,
  uvIndex: 3,
  description: 'partly cloudy'
};

function getRateLimitKey(request: NextRequest): string {
  // Use IP address for rate limiting
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
    request.headers.get('x-real-ip') || 
    'unknown';
  return ip;
}

function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const record = rateLimitStore.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitStore.set(key, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT) {
    return false;
  }
  
  record.count++;
  return true;
}

function validateZipCode(zip: string): boolean {
  // Validate US zip code format
  const zipRegex = /^\d{5}(-\d{4})?$/;
  return zipRegex.test(zip);
}

export async function GET(request: NextRequest) {
  // Get and validate zip code first (needed for cache key in error handling)
  const { searchParams } = new URL(request.url);
  const zip = searchParams.get('zip');
  
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { 
          error: 'Rate limit exceeded. Please wait before making another request.',
          retryAfter: Math.ceil(RATE_LIMIT_WINDOW / 1000 / 60), // minutes
          fallbackWeather: DEFAULT_WEATHER
        },
        { 
          status: 429,
          headers: {
            'Retry-After': Math.ceil(RATE_LIMIT_WINDOW / 1000).toString()
          }
        }
      );
    }
    
    if (!zip) {
      return NextResponse.json(
        { error: 'Zip code is required' },
        { status: 400 }
      );
    }

    if (!validateZipCode(zip)) {
      return NextResponse.json(
        { error: 'Invalid zip code format' },
        { status: 400 }
      );
    }

    // Check cache first
    const cacheKey = `weather_${zip}`;
    const cached = weatherCache.get(cacheKey);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_DURATION) {
      return NextResponse.json({
        ...cached.data,
        cached: true,
        cacheAge: Math.round((now - cached.timestamp) / 1000 / 60) // minutes
      });
    }

    const API_KEY = process.env.OPENWEATHER_API_KEY;
    if (!API_KEY) {
      return NextResponse.json(
        { error: 'Weather service temporarily unavailable' },
        { status: 503 }
      );
    }

    // Get coordinates from zip code
    const geoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${API_KEY}`,
      { 
        next: { revalidate: 3600 }, // Cache for 1 hour
        headers: {
          'User-Agent': 'CyclingNutritionApp/1.0'
        }
      }
    );
    
    if (!geoResponse.ok) {
      if (geoResponse.status === 404) {
        return NextResponse.json(
          { error: 'Location not found' },
          { status: 404 }
        );
      }
      throw new Error(`Geocoding failed: ${geoResponse.status}`);
    }
    
    const geoData = await geoResponse.json();
    const { lat, lon, name, country } = geoData;
    
    // Get detailed location info using reverse geocoding
    const reverseGeoResponse = await fetch(
      `https://api.openweathermap.org/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`,
      { 
        next: { revalidate: 3600 },
        headers: {
          'User-Agent': 'CyclingNutritionApp/1.0'
        }
      }
    );
    
    let stateName = '';
    if (reverseGeoResponse.ok) {
      const reverseGeoData = await reverseGeoResponse.json();
      if (reverseGeoData && reverseGeoData.length > 0) {
        const location = reverseGeoData[0];
        if (location.state) {
          stateName = location.state;
        }
      }
    }

    // Get weather data
    const weatherResponse = await fetch(
      `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial&exclude=minutely,daily,alerts`,
      { 
        next: { revalidate: 600 }, // Cache for 10 minutes
        headers: {
          'User-Agent': 'CyclingNutritionApp/1.0'
        }
      }
    );
    
    if (!weatherResponse.ok) {
      throw new Error(`Weather API failed: ${weatherResponse.status}`);
    }
    
    const weatherApiData = await weatherResponse.json();
    const current = weatherApiData.current;
    
    // Build location display string
    let locationDisplay = name || 'Unknown Location';
    if (stateName && country === 'US') {
      locationDisplay = `${name}, ${stateName}`;
    } else if (country && country !== 'US') {
      locationDisplay = `${name}, ${country}`;
    } else if (country === 'US') {
      locationDisplay = `${name}, US`;
    }

    // Prepare weather data
    const weatherData = {
      location: locationDisplay,
      temperature: Math.round(current.temp),
      feelsLike: Math.round(current.feels_like),
      humidity: current.humidity,
      windSpeed: Math.round(current.wind_speed),
      windGust: current.wind_gust ? Math.round(current.wind_gust) : 0,
      windDirection: current.wind_deg || 0,
      uvIndex: Math.round(current.uvi),
      description: current.weather[0].description,
      cached: false
    };

    // Cache the successful response
    weatherCache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });

    return NextResponse.json(weatherData);

  } catch {
    // Log error without exposing sensitive details
    console.error('Weather API request failed');
    
    // Try to return stale cached data if available
    const cacheKey = `weather_${zip}`;
    const staleCache = weatherCache.get(cacheKey);
    
    if (staleCache) {
      return NextResponse.json({
        ...staleCache.data,
        cached: true,
        stale: true,
        cacheAge: Math.round((Date.now() - staleCache.timestamp) / 1000 / 60),
        warning: 'Using cached weather data - service temporarily unavailable'
      });
    }
    
    // Fallback to default weather if no cache available
    return NextResponse.json({
      ...DEFAULT_WEATHER,
      fallback: true,
      warning: 'Weather service unavailable - using default conditions'
    });
  }
}
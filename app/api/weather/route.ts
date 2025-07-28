import { NextRequest, NextResponse } from 'next/server';

// Rate limiting store (in production, use Redis or database)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 100; // requests per hour
const RATE_LIMIT_WINDOW = 60 * 60 * 1000; // 1 hour in milliseconds

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
  try {
    // Rate limiting
    const rateLimitKey = getRateLimitKey(request);
    if (!checkRateLimit(rateLimitKey)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded' },
        { status: 429 }
      );
    }

    // Get and validate zip code
    const { searchParams } = new URL(request.url);
    const zip = searchParams.get('zip');
    
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
    
    const weatherData = await weatherResponse.json();
    const current = weatherData.current;
    
    // Build location display string
    let locationDisplay = name || 'Unknown Location';
    if (stateName && country === 'US') {
      locationDisplay = `${name}, ${stateName}`;
    } else if (country && country !== 'US') {
      locationDisplay = `${name}, ${country}`;
    } else if (country === 'US') {
      locationDisplay = `${name}, US`;
    }

    // Return sanitized response
    return NextResponse.json({
      location: locationDisplay,
      temperature: Math.round(current.temp),
      feelsLike: Math.round(current.feels_like),
      humidity: current.humidity,
      windSpeed: Math.round(current.wind_speed),
      windGust: current.wind_gust ? Math.round(current.wind_gust) : 0,
      windDirection: current.wind_deg || 0,
      uvIndex: Math.round(current.uvi),
      description: current.weather[0].description
    });

  } catch {
    // Log error without exposing sensitive details
    console.error('Weather API request failed');
    
    // Don't expose internal error details to client
    return NextResponse.json(
      { error: 'Unable to fetch weather data' },
      { status: 500 }
    );
  }
}
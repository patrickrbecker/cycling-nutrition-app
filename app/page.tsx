'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Zap, Droplets, Timer, AlertTriangle, RotateCcw, Upload, MapPin } from 'lucide-react';
import Script from 'next/script';

interface FuelAlert {
  time: number; // minutes
  type: 'carbs' | 'electrolytes';
  amount: string;
  priority: 'normal' | 'critical';
}

interface NutritionProfile {
  weight: number;
  sweatRate: 'light' | 'moderate' | 'heavy';
  intensity: 'easy' | 'moderate' | 'hard' | 'mixed';
  giSensitivity: 'sensitive' | 'normal' | 'tolerant';
  previousIssues: string[];
  preferredFuels: string[];
  experienceLevel: 'beginner' | 'intermediate' | 'advanced';
  name: string;
}

interface RouteData {
  name: string;
  distance: number; // in kilometers
  elevationGain: number; // in meters
  estimatedTime: number; // in minutes
  climbs: Array<{
    startDistance: number;
    endDistance: number;
    elevationGain: number;
    grade: number;
  }>;
}

export default function CyclingNutritionApp() {
  const [rideTime, setRideTime] = useState<number>(60); // minutes
  const [rideMiles, setRideMiles] = useState<number>(20); // miles
  const [rideKilometers, setRideKilometers] = useState<number>(32); // kilometers
  const [rideType, setRideType] = useState<'time' | 'miles' | 'kilometers'>('time');
  const [isRiding, setIsRiding] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [fuelSchedule, setFuelSchedule] = useState<FuelAlert[]>([]);
  const [completedAlerts, setCompletedAlerts] = useState<Set<number>>(new Set());
  const [currentTemp, setCurrentTemp] = useState<number>(75); // Fahrenheit
  const [currentHumidity, setCurrentHumidity] = useState<number>(50); // Percentage
  const [windSpeed, setWindSpeed] = useState<number>(0); // mph
  const [windGust, setWindGust] = useState<number>(0); // mph
  const [windDirection, setWindDirection] = useState<number>(0); // degrees
  const [uvIndex, setUvIndex] = useState<number>(0);
  const [feelsLike, setFeelsLike] = useState<number>(75); // Fahrenheit
  const [weatherDescription, setWeatherDescription] = useState<string>('');
  const [zipCode, setZipCode] = useState<string>('');
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string>('');
  const [unitSystem, setUnitSystem] = useState<'US' | 'UK'>('US');
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfile | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isParsingGPX, setIsParsingGPX] = useState<boolean>(false);
  const [gpxError, setGpxError] = useState<string>('');
  const [locationName, setLocationName] = useState<string>('');

  // Convert miles to estimated time (assuming 14mph average)
  const milesToTime = (miles: number) => {
    return Math.round((miles / 14) * 60); // 14mph = 4.29 minutes per mile
  };

  // Convert kilometers to estimated time (assuming 22.5 km/h average)
  const kilometersToTime = (kilometers: number) => {
    return Math.round((kilometers / 22.5) * 60); // 22.5 km/h = 2.67 minutes per km
  };

  // Convert wind direction degrees to compass direction
  const getWindDirection = (degrees: number) => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  };

  // Unit conversion utilities
  const convertTemp = (tempF: number) => unitSystem === 'UK' ? Math.round((tempF - 32) * 5/9) : tempF;
  const convertSpeed = (speedMph: number) => unitSystem === 'UK' ? Math.round(speedMph * 1.609) : speedMph;
  const getTempUnit = () => unitSystem === 'UK' ? '°C' : '°F';
  const getSpeedUnit = () => unitSystem === 'UK' ? 'km/h' : 'mph';
  const getDistanceUnit = () => unitSystem === 'UK' ? 'km' : 'miles';

  // Distance calculation utility (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Parse GPX file and extract route data
  const parseGPXFile = async (file: File) => {
    setIsParsingGPX(true);
    setGpxError('');
    
    try {
      const text = await file.text();
      const parser = new DOMParser();
      const gpxDoc = parser.parseFromString(text, 'application/xml');
      
      // Check for parsing errors
      if (gpxDoc.getElementsByTagName('parsererror').length > 0) {
        throw new Error('Invalid GPX file format');
      }
      
      // Extract track points
      const trackPoints = Array.from(gpxDoc.getElementsByTagName('trkpt'));
      
      if (trackPoints.length === 0) {
        throw new Error('No track points found in GPX file');
      }
      
      let totalDistance = 0;
      let totalElevationGain = 0;
      let minElevation = Infinity;
      let maxElevation = -Infinity;
      const climbs: RouteData['climbs'] = [];
      
      let currentClimb: { startDistance: number; startElevation: number; elevationGain: number } | null = null;
      let lastPoint: { lat: number; lon: number; ele: number; dist: number } | null = null;
      
      // Process each track point
      for (let i = 0; i < trackPoints.length; i++) {
        const point = trackPoints[i];
        const lat = parseFloat(point.getAttribute('lat') || '0');
        const lon = parseFloat(point.getAttribute('lon') || '0');
        const eleElement = point.getElementsByTagName('ele')[0];
        const elevation = eleElement ? parseFloat(eleElement.textContent || '0') : 0;
        
        if (lastPoint) {
          // Calculate distance from last point
          const segmentDistance = calculateDistance(lastPoint.lat, lastPoint.lon, lat, lon);
          totalDistance += segmentDistance;
          
          // Calculate elevation change
          const elevationChange = elevation - lastPoint.ele;
          
          // Track elevation gain
          if (elevationChange > 0) {
            totalElevationGain += elevationChange;
          }
          
          // Detect climbs (sustained elevation gain)
          if (elevationChange > 0.5 && segmentDistance > 0) { // Climbing
            if (!currentClimb) {
              currentClimb = {
                startDistance: lastPoint.dist,
                startElevation: lastPoint.ele,
                elevationGain: 0
              };
            }
            currentClimb.elevationGain += elevationChange;
          } else if (currentClimb && (elevationChange < -0.5 || i === trackPoints.length - 1)) {
            // End of climb
            if (currentClimb.elevationGain > 30) { // Only count significant climbs
              const climbDistance = totalDistance - currentClimb.startDistance;
              const avgGrade = climbDistance > 0 ? (currentClimb.elevationGain / (climbDistance * 1000)) * 100 : 0;
              
              climbs.push({
                startDistance: currentClimb.startDistance,
                endDistance: totalDistance,
                elevationGain: currentClimb.elevationGain,
                grade: avgGrade
              });
            }
            currentClimb = null;
          }
        }
        
        minElevation = Math.min(minElevation, elevation);
        maxElevation = Math.max(maxElevation, elevation);
        
        lastPoint = { lat, lon, ele: elevation, dist: totalDistance };
      }
      
      // Estimate ride time based on distance and elevation
      const flatTime = (totalDistance / 25) * 60; // 25 km/h base speed
      const elevationTimeBonus = (totalElevationGain / 100) * 6; // 6 minutes per 100m elevation
      const estimatedTime = Math.round(flatTime + elevationTimeBonus);
      
      // Extract route name from GPX
      const nameElement = gpxDoc.getElementsByTagName('name')[0];
      const routeName = nameElement ? nameElement.textContent || 'Uploaded Route' : 'Uploaded Route';
      
      const route: RouteData = {
        name: routeName,
        distance: totalDistance,
        elevationGain: totalElevationGain,
        estimatedTime,
        climbs
      };
      
      setRouteData(route);
      setRideType('time');
      setRideTime(estimatedTime);
      
    } catch (error) {
      setGpxError(error instanceof Error ? error.message : 'Failed to parse GPX file');
    } finally {
      setIsParsingGPX(false);
    }
  };

  // Handle GPX file upload
  const handleGPXUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.name.toLowerCase().endsWith('.gpx')) {
        parseGPXFile(file);
      } else {
        setGpxError('Please select a valid GPX file');
      }
    }
  };


  // Get effective ride duration for scheduling
  const getEffectiveRideTime = useCallback(() => {
    if (rideType === 'time') return rideTime;
    if (rideType === 'miles') return milesToTime(rideMiles);
    return kilometersToTime(rideKilometers);
  }, [rideType, rideTime, rideMiles, rideKilometers]);

  // Load nutrition profile on mount
  useEffect(() => {
    const saved = localStorage.getItem('nutritionProfile');
    if (saved) {
      setNutritionProfile(JSON.parse(saved));
    }
  }, []);

  // Reset nutrition profile
  const resetProfile = () => {
    localStorage.removeItem('nutritionProfile');
    setNutritionProfile(null);
  };

  // Generate personalized fueling schedule
  const generateSchedule = useCallback((durationMinutes: number) => {
    const schedule: FuelAlert[] = [];
    
    // Personalized carb timing based on profile
    let carbInterval = 25; // default
    let startTime = 20; // default
    let carbAmount = '10-15g carbs';
    let elevationMultiplier = 1.0;

    // Calculate elevation-based adjustments
    if (routeData) {
      // Increase carb needs based on elevation gain
      const elevationFactor = Math.min(routeData.elevationGain / 1000, 0.5); // Up to 50% increase for 1000m+
      elevationMultiplier = 1 + elevationFactor;
      
      // Adjust timing for routes with significant climbing
      if (routeData.elevationGain > 300) {
        carbInterval = Math.max(15, carbInterval - 5); // More frequent for hilly routes
        carbAmount = elevationMultiplier > 1.2 ? '15-20g carbs' : '12-18g carbs';
      }
    }

    if (nutritionProfile) {
      // Adjust based on GI sensitivity
      if (nutritionProfile.giSensitivity === 'sensitive') {
        carbInterval = 30; // less frequent for sensitive stomachs
        startTime = 15; // start earlier with smaller amounts
        carbAmount = elevationMultiplier > 1.2 ? '10-15g carbs' : '8-12g carbs';
      } else if (nutritionProfile.giSensitivity === 'tolerant') {
        carbInterval = 20; // more frequent for iron stomachs
        carbAmount = elevationMultiplier > 1.2 ? '18-25g carbs' : '15-20g carbs';
      }

      // Adjust based on intensity
      if (nutritionProfile.intensity === 'hard') {
        carbInterval = Math.max(15, carbInterval - 5); // more frequent for high intensity
      } else if (nutritionProfile.intensity === 'easy') {
        carbInterval += 10; // less frequent for easy rides
      }
    }

    // Generate carb schedule
    for (let time = startTime; time < durationMinutes; time += carbInterval) {
      const fuelType = nutritionProfile?.preferredFuels?.length && nutritionProfile.preferredFuels.length > 0 
        ? `(${nutritionProfile.preferredFuels[0].toLowerCase()})` 
        : '(½ gel or 8oz sports drink)';
      
      schedule.push({
        time,
        type: 'carbs',
        amount: `${carbAmount} ${fuelType}`,
        priority: 'normal'
      });
    }

    // Add pre-climb fueling alerts for major climbs
    if (routeData && routeData.climbs.length > 0) {
      const avgSpeed = routeData.distance / (durationMinutes / 60); // km/h
      
      routeData.climbs.forEach(climb => {
        if (climb.elevationGain > 100) { // Only for significant climbs
          const climbStartTime = Math.round((climb.startDistance / avgSpeed) * 60);
          const preFuelTime = Math.max(5, climbStartTime - 15); // 15 minutes before climb
          
          // Only add if not too close to existing alerts
          const nearbyAlert = schedule.find(alert => Math.abs(alert.time - preFuelTime) < 10);
          if (!nearbyAlert && preFuelTime < durationMinutes) {
            schedule.push({
              time: preFuelTime,
              type: 'carbs',
              amount: `Extra carbs before climb (+${Math.round(climb.elevationGain)}m elevation)`,
              priority: 'critical'
            });
          }
        }
      });
    }

    // Enhanced electrolyte schedule based on sweat rate, temperature, and elevation
    const needsElectrolytes = currentTemp > 80 || 
      (nutritionProfile?.sweatRate === 'heavy') ||
      (nutritionProfile?.sweatRate === 'moderate' && currentTemp > 75) ||
      (routeData && routeData.elevationGain > 500); // Extra electrolytes for high elevation gain

    if (needsElectrolytes) {
      let electrolyteInterval = 60;
      let sodiumAmount = '200-400mg sodium';

      // Adjust for elevation (climbing increases sweat rate)
      if (routeData && routeData.elevationGain > 500) {
        electrolyteInterval = Math.max(45, electrolyteInterval - 15);
        sodiumAmount = elevationMultiplier > 1.3 ? '350-550mg sodium' : '250-450mg sodium';
      }

      if (nutritionProfile?.sweatRate === 'heavy') {
        electrolyteInterval = 45;
        sodiumAmount = elevationMultiplier > 1.2 ? '400-600mg sodium' : '300-500mg sodium';
      } else if (nutritionProfile?.sweatRate === 'light') {
        electrolyteInterval = 90;
        sodiumAmount = '150-300mg sodium';
      }

      for (let time = 45; time < durationMinutes; time += electrolyteInterval) {
        schedule.push({
          time,
          type: 'electrolytes',
          amount: `${sodiumAmount} (electrolyte tab/chew)`,
          priority: 'normal'
        });
      }
    }

    return schedule.sort((a, b) => a.time - b.time);
  }, [currentTemp, nutritionProfile, routeData]);

  // Timer functionality
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRiding) {
      interval = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 60000); // Update every minute
    }
    return () => clearInterval(interval);
  }, [isRiding]);

  // Fetch weather data using One Call API 3.0
  const fetchWeather = async (zip: string) => {
    if (!zip || zip.length < 5) return;
    
    setIsLoadingWeather(true);
    setWeatherError('');
    
    try {
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo_key';
      
      // First, get coordinates from zip code using geocoding API
      const geoResponse = await fetch(
        `https://api.openweathermap.org/geo/1.0/zip?zip=${zip},US&appid=${API_KEY}`
      );
      
      if (!geoResponse.ok) {
        throw new Error('Location not found');
      }
      
      const geoData = await geoResponse.json();
      const { lat, lon, name, state } = geoData;
      setLocationName(`${name}, ${state}`);
      
      // Then use One Call API 3.0 for comprehensive weather data
      const weatherResponse = await fetch(
        `https://api.openweathermap.org/data/3.0/onecall?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=imperial&exclude=minutely,daily,alerts`
      );
      
      if (!weatherResponse.ok) {
        throw new Error('Weather data not found');
      }
      
      const weatherData = await weatherResponse.json();
      const current = weatherData.current;
      
      setCurrentTemp(Math.round(current.temp));
      setFeelsLike(Math.round(current.feels_like));
      setCurrentHumidity(current.humidity);
      setWindSpeed(Math.round(current.wind_speed));
      setWindGust(current.wind_gust ? Math.round(current.wind_gust) : 0);
      setWindDirection(current.wind_deg || 0);
      setUvIndex(Math.round(current.uvi));
      setWeatherDescription(current.weather[0].description);
      setWeatherError('');
    } catch {
      setWeatherError('Unable to fetch weather data');
      // Reset to fallback values
      setCurrentTemp(75);
      setFeelsLike(75);
      setCurrentHumidity(50);
      setWindSpeed(0);
      setWindGust(0);
      setWindDirection(0);
      setUvIndex(0);
      setWeatherDescription('');
      setLocationName('');
    } finally {
      setIsLoadingWeather(false);
    }
  };

  // Update schedule when ride time/miles or temperature changes
  useEffect(() => {
    setFuelSchedule(generateSchedule(getEffectiveRideTime()));
  }, [generateSchedule, getEffectiveRideTime]);

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getNextAlert = () => {
    return fuelSchedule.find(alert => 
      alert.time > elapsedTime && !completedAlerts.has(alert.time)
    );
  };

  const getCurrentAlert = () => {
    return fuelSchedule.find(alert => 
      alert.time <= elapsedTime && 
      alert.time > elapsedTime - 5 && 
      !completedAlerts.has(alert.time)
    );
  };

  const markCompleted = (time: number) => {
    setCompletedAlerts(prev => new Set([...prev, time]));
  };

  const startRide = () => {
    setIsRiding(true);
    setElapsedTime(0);
    setCompletedAlerts(new Set());
  };

  const stopRide = () => {
    setIsRiding(false);
  };

  const currentAlert = getCurrentAlert();
  const nextAlert = getNextAlert();
  const progressPercent = (elapsedTime / getEffectiveRideTime()) * 100;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "name": "Cycling Fuel Planner",
    "description": "Personalized cycling nutrition planner with real-time weather integration for optimal performance",
    "url": "https://cycling-nutrition-app.vercel.app",
    "applicationCategory": "SportsApplication",
    "operatingSystem": "Web Browser",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    },
    "featureList": [
      "Personalized nutrition timing",
      "Real-time weather integration", 
      "Electrolyte recommendations",
      "Hydration scheduling",
      "Performance optimization"
    ],
    "author": {
      "@type": "Organization",
      "name": "Cycling Fuel Planner"
    }
  };

  return (
    <>
      <Script
        id="structured-data"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <main className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Zap className="w-10 h-10 text-yellow-400" />
            Cycling Fuel Planner
          </h1>
          <p className="text-blue-200">Smart nutrition timing for peak performance</p>
          {nutritionProfile ? (
            <div className="mt-4 p-4 bg-green-500/20 rounded-lg border border-green-500/30 relative">
              <p className="text-green-300 font-medium">
                Welcome back, {nutritionProfile.name}! Your personalized nutrition plan is ready.
              </p>
              <p className="text-sm text-green-200 mt-1">
                Profile: {nutritionProfile.sweatRate} sweater, {nutritionProfile.intensity} intensity, {nutritionProfile.giSensitivity} stomach
              </p>
              <button
                onClick={resetProfile}
                className="absolute bottom-2 right-2 p-1 text-green-300 hover:text-green-100 hover:bg-green-500/30 rounded-full transition-colors"
                title="Reset profile and retake survey"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="mt-4">
              <a 
                href="/survey"
                className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Create Personalized Profile
              </a>
            </div>
          )}
        </header>

        {!isRiding ? (
          /* Setup Screen */
          <section className="space-y-6" aria-label="Ride Planning">
            <article className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-4">Plan Your Ride</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Ride Planning Method
                  </label>
                  <div className="flex gap-2 mb-4">
                    <button
                      onClick={() => setRideType('time')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        rideType === 'time' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/20 text-blue-200 hover:bg-white/30'
                      }`}
                    >
                      By Time
                    </button>
                    <button
                      onClick={() => setRideType('miles')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        rideType === 'miles' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/20 text-blue-200 hover:bg-white/30'
                      }`}
                    >
                      By Miles
                    </button>
                    <button
                      onClick={() => setRideType('kilometers')}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        rideType === 'kilometers' 
                          ? 'bg-blue-600 text-white' 
                          : 'bg-white/20 text-blue-200 hover:bg-white/30'
                      }`}
                    >
                      By Kilometers
                    </button>
                  </div>
                  
                  {rideType === 'time' ? (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expected Ride Time
                      </label>
                      <select 
                        value={rideTime} 
                        onChange={(e) => setRideTime(Number(e.target.value))}
                        className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white"
                      >
                        <option value={60}>1 hour</option>
                        <option value={90}>1.5 hours</option>
                        <option value={120}>2 hours</option>
                        <option value={150}>2.5 hours</option>
                        <option value={180}>3 hours</option>
                        <option value={240}>4 hours</option>
                        <option value={300}>5 hours</option>
                      </select>
                    </div>
                  ) : rideType === 'miles' ? (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expected Distance (miles)
                      </label>
                      <input 
                        type="number" 
                        value={rideMiles}
                        onChange={(e) => {
                          const value = Math.min(Number(e.target.value), 9999);
                          setRideMiles(value);
                        }}
                        className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white"
                        min="5" 
                        max="9999"
                        step="5"
                        placeholder="Enter miles"
                      />
                      <p className="text-sm text-blue-200 mt-1">
                        Estimated time: {formatTime(milesToTime(rideMiles))} (at 14mph avg)
                      </p>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expected Distance (kilometers)
                      </label>
                      <input 
                        type="number" 
                        value={rideKilometers}
                        onChange={(e) => {
                          const value = Math.min(Number(e.target.value), 9999);
                          setRideKilometers(value);
                        }}
                        className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white"
                        min="8" 
                        max="9999"
                        step="8"
                        placeholder="Enter kilometers"
                      />
                      <p className="text-sm text-blue-200 mt-1">
                        Estimated time: {formatTime(kilometersToTime(rideKilometers))} (at 22.5km/h avg)
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Zip Code for Weather{locationName && ` - ${locationName}`}
                  </label>
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="flex-1 p-3 rounded-lg bg-white/20 border border-white/30 text-white"
                      placeholder="12345"
                      maxLength={5}
                    />
                    <button
                      onClick={() => fetchWeather(zipCode)}
                      disabled={isLoadingWeather || zipCode.length < 5}
                      className="px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg font-medium transition-colors"
                    >
                      {isLoadingWeather ? '...' : 'Get Weather'}
                    </button>
                  </div>
                  {weatherError && (
                    <p className="text-red-300 text-sm mt-1">{weatherError}</p>
                  )}
                  {currentTemp && (
                    <p className="text-green-300 text-sm mt-1">
                      Current temperature: {convertTemp(currentTemp)}{getTempUnit()}, {currentHumidity}% humidity
                      {currentTemp > 80 && ' - Hot day, electrolyte alerts enabled'}
                    </p>
                  )}
                </div>
              </div>

              {/* GPX Route Upload */}
              <div className="bg-purple-500/20 rounded-lg p-4 mt-4 border border-purple-500/30">
                <h3 className="text-lg font-semibold flex items-center gap-2 mb-3">
                  <MapPin className="w-5 h-5 text-purple-400" />
                  Route Analysis (Optional)
                </h3>
                <p className="text-sm text-purple-200 mb-3">
                  Upload a GPX file for elevation-based nutrition calculations and pre-climb fueling alerts
                </p>
                
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg cursor-pointer transition-colors">
                    <Upload className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {isParsingGPX ? 'Processing...' : 'Upload GPX File'}
                    </span>
                    <input
                      type="file"
                      accept=".gpx"
                      onChange={handleGPXUpload}
                      disabled={isParsingGPX}
                      className="hidden"
                    />
                  </label>
                  
                  {routeData && (
                    <button
                      onClick={() => setRouteData(null)}
                      className="px-3 py-2 text-purple-300 hover:text-purple-100 text-sm"
                    >
                      Clear Route
                    </button>
                  )}
                </div>
                
                {gpxError && (
                  <p className="text-red-300 text-sm mt-2">{gpxError}</p>
                )}
                
                {routeData && (
                  <div className="mt-3 p-3 bg-purple-600/30 rounded-lg">
                    <div className="text-sm text-purple-100">
                      <div className="font-medium text-purple-200 mb-2">📍 {routeData.name}</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>Distance: <span className="text-white">{routeData.distance.toFixed(1)} km</span></div>
                        <div>Elevation: <span className="text-white">+{Math.round(routeData.elevationGain)}m</span></div>
                        <div>Est. Time: <span className="text-white">{formatTime(routeData.estimatedTime)}</span></div>
                        <div>Climbs: <span className="text-white">{routeData.climbs.length} major</span></div>
                      </div>
                      {routeData.climbs.length > 0 && (
                        <div className="mt-2 text-xs text-purple-200">
                          Major climbs detected - pre-climb fueling alerts added
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Ride Forecast */}
              <div className="bg-white/5 rounded-lg p-4 mt-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <Timer className="w-5 h-5 text-blue-400" />
                    Ride Forecast
                  </h3>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="unitSystem"
                        value="US"
                        checked={unitSystem === 'US'}
                        onChange={() => setUnitSystem('US')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-white">US</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="unitSystem"
                        value="UK"
                        checked={unitSystem === 'UK'}
                        onChange={() => setUnitSystem('UK')}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="text-sm font-medium text-white">UK</span>
                    </label>
                  </div>
                </div>
                
                {/* Enhanced Weather Details */}
                {currentTemp && (
                  <div className="mb-4">
                    <div className="text-blue-200 text-sm mb-3 flex items-center gap-2">
                      Detailed Weather Conditions
                      {weatherDescription && (
                        <span className="text-xs bg-blue-600 px-2 py-1 rounded capitalize">
                          {weatherDescription}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-blue-200 mb-1">Temperature</div>
                        <div className="text-xl font-bold text-white">{convertTemp(currentTemp)}{getTempUnit()}</div>
                        {feelsLike !== currentTemp && (
                          <div className="text-xs text-blue-200">Feels like {convertTemp(feelsLike)}{getTempUnit()}</div>
                        )}
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-blue-200 mb-1">Humidity</div>
                        <div className="text-xl font-bold text-white">{currentHumidity}%</div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-blue-200 mb-1">Wind Speed</div>
                        <div className="text-xl font-bold text-white">{convertSpeed(windSpeed)} {getSpeedUnit()}</div>
                        {(windGust > 0 || windDirection > 0) && (
                          <div className="text-xs text-blue-200">
                            {windGust > 0 && `Gusts ${convertSpeed(windGust)} ${getSpeedUnit()}`}
                            {windGust > 0 && windDirection > 0 && ' • '}
                            {windDirection > 0 && `${getWindDirection(windDirection)}`}
                          </div>
                        )}
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-blue-200 mb-1">UV Index</div>
                        <div className={`text-xl font-bold ${
                          uvIndex >= 8 ? 'text-red-300' : 
                          uvIndex >= 6 ? 'text-orange-300' : 
                          uvIndex >= 3 ? 'text-yellow-300' : 'text-green-300'
                        }`}>
                          {uvIndex}
                        </div>
                        <div className="text-xs text-blue-200">
                          {uvIndex >= 8 ? 'Very High' : 
                           uvIndex >= 6 ? 'High' : 
                           uvIndex >= 3 ? 'Moderate' : 'Low'}
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-blue-200 mb-1">Cycling Conditions</div>
                        <div className={`text-sm font-medium ${
                          currentTemp > 85 || windSpeed > 20 ? 'text-red-300' : 
                          currentTemp > 80 || windSpeed > 15 ? 'text-yellow-300' : 
                          currentTemp < 50 ? 'text-blue-300' : 'text-green-300'
                        }`}>
                          {currentTemp > 85 || windSpeed > 20 ? 'Challenging' : 
                           currentTemp > 80 || windSpeed > 15 ? 'Moderate' : 
                           currentTemp < 50 ? 'Cool' : 'Excellent'}
                        </div>
                      </div>
                      <div className="bg-white/10 rounded-lg p-3">
                        <div className="text-blue-200 mb-1">Recommendations</div>
                        <div className="text-xs text-white">
                          {currentTemp > 85 ? 'Extra water, electrolytes' : 
                           currentTemp > 80 ? 'Stay hydrated' : 
                           currentTemp < 50 ? 'Layer clothing' : 
                           uvIndex >= 6 ? 'Sunscreen recommended' : 'Perfect conditions'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-blue-200 mb-2">Duration & Distance</div>
                    <div className="space-y-1">
                      {rideType === 'time' ? (
                        <>
                          <div>Duration: <span className="font-medium text-white">{formatTime(rideTime)}</span></div>
                          <div>Est. Distance: <span className="font-medium text-white">{unitSystem === 'UK' ? Math.round((rideTime / 60) * 22.5) : Math.round((rideTime / 60) * 14)} {getDistanceUnit()}</span></div>
                        </>
                      ) : rideType === 'miles' ? (
                        <>
                          <div>Distance: <span className="font-medium text-white">{unitSystem === 'UK' ? Math.round(rideMiles * 1.609) : rideMiles} {getDistanceUnit()}</span></div>
                          <div>Est. Duration: <span className="font-medium text-white">{formatTime(milesToTime(rideMiles))}</span></div>
                        </>
                      ) : (
                        <>
                          <div>Distance: <span className="font-medium text-white">{unitSystem === 'UK' ? rideKilometers : Math.round(rideKilometers * 0.621)} {getDistanceUnit()}</span></div>
                          <div>Est. Duration: <span className="font-medium text-white">{formatTime(kilometersToTime(rideKilometers))}</span></div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-blue-200 mb-2">Fuel Requirements</div>
                    <div className="space-y-1">
                      <div>Fuel alerts: <span className="font-medium text-white">{fuelSchedule.filter(alert => alert.type === 'carbs').length}</span></div>
                      <div>Total carbs: <span className="font-medium text-white">{fuelSchedule.filter(alert => alert.type === 'carbs').length * 12}g approx.</span></div>
                      {routeData && routeData.elevationGain > 300 && (
                        <div>Elevation boost: <span className="font-medium text-orange-300">+{Math.round((routeData.elevationGain / 1000) * 50)}% carbs</span></div>
                      )}
                      {(currentTemp > 80 || (routeData && routeData.elevationGain > 500)) && (
                        <div>Electrolytes: <span className="font-medium text-yellow-300">{fuelSchedule.filter(alert => alert.type === 'electrolytes').length} doses needed</span></div>
                      )}
                      {routeData && routeData.climbs.length > 0 && (
                        <div>Pre-climb alerts: <span className="font-medium text-purple-300">{fuelSchedule.filter(alert => alert.priority === 'critical').length} added</span></div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-blue-200 mb-2">Conditions</div>
                    <div className="space-y-1">
                      {currentTemp ? (
                        <>
                          <div>Temperature: <span className="font-medium text-white">{convertTemp(currentTemp)}{getTempUnit()}</span></div>
                          <div>Difficulty: <span className={`font-medium ${currentTemp > 85 ? 'text-red-300' : currentTemp > 80 ? 'text-yellow-300' : currentTemp < 50 ? 'text-blue-300' : 'text-green-300'}`}>
                            {currentTemp > 85 ? 'Very Hot' : currentTemp > 80 ? 'Hot' : currentTemp < 50 ? 'Cold' : 'Moderate'}
                          </span></div>
                        </>
                      ) : (
                        <div className="text-gray-400">Enter zip code for weather forecast</div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-blue-200 mb-2">Hydration</div>
                    <div className="space-y-1">
                      <div>Est. fluid loss: <span className="font-medium text-white">{Math.round((getEffectiveRideTime() / 60) * 16)}oz</span></div>
                      <div>Recommended intake: <span className="font-medium text-white">{Math.round((getEffectiveRideTime() / 60) * 20)}oz</span></div>
                      {nutritionProfile?.sweatRate === 'heavy' && (
                        <div className="text-yellow-300 text-xs">Heavy sweater - increase by 25%</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </article>

            {/* Fuel Schedule Preview */}
            <section className="bg-white/10 rounded-xl p-6 backdrop-blur-sm" aria-label="Fuel Schedule">
              <h3 className="text-xl font-semibold mb-4">Your Personalized Fuel Schedule</h3>
              <div className="space-y-3">
                {fuelSchedule.map((alert, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                    <div className="w-16 text-center">
                      <Clock className="w-4 h-4 mx-auto mb-1" />
                      <span className="text-sm font-mono">{formatTime(alert.time)}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {alert.type === 'carbs' ? (
                          <Zap className="w-4 h-4 text-yellow-400" />
                        ) : (
                          <Droplets className="w-4 h-4 text-blue-400" />
                        )}
                        <span>{alert.amount}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Pre-Ride Checklist */}
            <section className="bg-green-500/20 rounded-xl p-6 border border-green-500/30" aria-label="Pre-Ride Checklist">
              <h3 className="text-xl font-semibold mb-4 text-green-300">Pre-Ride Preparation Checklist</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-5 h-5" />
                  <span>Overnight oats + fruit bar 2-3 hours before</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-5 h-5" />
                  <span>Sports drink bottle (not plain water)</span>
                </div>
                <div className="flex items-center gap-3">
                  <input type="checkbox" className="w-5 h-5" />
                  <span>Gels/chews for scheduled fuel</span>
                </div>
                {currentTemp > 80 && (
                  <div className="flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5" />
                    <span>Extra electrolyte tabs for hot weather</span>
                  </div>
                )}
              </div>
            </section>

            <button 
              onClick={startRide}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl transition-colors text-xl"
              aria-label="Start your cycling session with nutrition tracking"
            >
              Start Ride Timer
            </button>
          </section>
        ) : (
          /* Ride Screen */
          <div className="space-y-6">
            {/* Progress Bar */}
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-semibold">Ride Progress</h2>
                <div className="text-right">
                  <div className="text-3xl font-mono font-bold">{formatTime(elapsedTime)}</div>
                  <div className="text-sm text-blue-200">
                    of {formatTime(getEffectiveRideTime())} 
                    {rideType === 'miles' && ` (${rideMiles} miles)`}
                    {rideType === 'kilometers' && ` (${rideKilometers} km)`}
                  </div>
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-4">
                <div 
                  className="bg-gradient-to-r from-yellow-400 to-green-400 h-4 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(progressPercent, 100)}%` }}
                ></div>
              </div>
            </div>

            {/* Current Alert */}
            {currentAlert && (
              <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-6 animate-pulse">
                <div className="flex items-center gap-3 mb-4">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                  <h3 className="text-xl font-semibold text-red-300">Fuel Now!</h3>
                </div>
                <p className="text-lg mb-4">{currentAlert.amount}</p>
                <button 
                  onClick={() => markCompleted(currentAlert.time)}
                  className="bg-green-600 hover:bg-green-700 px-6 py-2 rounded-lg font-medium"
                >
                  Mark Complete
                </button>
              </div>
            )}

            {/* Next Alert */}
            {nextAlert && (
              <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
                <h3 className="text-lg font-semibold mb-2">Coming Up</h3>
                <div className="flex items-center gap-3">
                  <Timer className="w-5 h-5 text-blue-400" />
                  <span>
                    In {nextAlert.time - elapsedTime} minutes: {nextAlert.amount}
                  </span>
                </div>
              </div>
            )}

            {/* Completed Alerts */}
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-lg font-semibold mb-3">Completed</h3>
              <div className="space-y-2">
                {fuelSchedule
                  .filter(alert => completedAlerts.has(alert.time))
                  .map((alert, index) => (
                    <div key={index} className="flex items-center gap-3 text-green-300">
                      <span className="font-mono w-12">{formatTime(alert.time)}</span>
                      <span>✓ {alert.amount}</span>
                    </div>
                  ))}
              </div>
            </div>

            <button 
              onClick={stopRide}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 px-8 rounded-xl transition-colors text-xl"
            >
              End Ride
            </button>
          </div>
        )}
        </div>
      </main>
    </>
  );
}
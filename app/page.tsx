'use client';

import { useState, useEffect, useCallback } from 'react';
import { Clock, Plus, Zap, Droplets, Timer, AlertTriangle } from 'lucide-react';

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

export default function CyclingNutritionApp() {
  const [rideTime, setRideTime] = useState<number>(60); // minutes
  const [rideMiles, setRideMiles] = useState<number>(20); // miles
  const [rideType, setRideType] = useState<'time' | 'miles'>('time');
  const [isRiding, setIsRiding] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [fuelSchedule, setFuelSchedule] = useState<FuelAlert[]>([]);
  const [completedAlerts, setCompletedAlerts] = useState<Set<number>>(new Set());
  const [currentTemp, setCurrentTemp] = useState<number>(75); // Fahrenheit
  const [currentHumidity, setCurrentHumidity] = useState<number>(50); // Percentage
  const [zipCode, setZipCode] = useState<string>('');
  const [isLoadingWeather, setIsLoadingWeather] = useState<boolean>(false);
  const [weatherError, setWeatherError] = useState<string>('');
  const [weatherCoords, setWeatherCoords] = useState<{lat: number, lon: number} | null>(null);
  const [mapLayer, setMapLayer] = useState<string>('precipitation_new');
  const [nutritionProfile, setNutritionProfile] = useState<NutritionProfile | null>(null);

  // Convert miles to estimated time (assuming 14mph average)
  const milesToTime = (miles: number) => {
    return Math.round((miles / 14) * 60); // 14mph = 4.29 minutes per mile
  };

  // Convert lat/lon to tile coordinates for Maps API
  const getTileCoordinates = (lat: number, lon: number, zoom: number) => {
    const x = Math.floor((lon + 180) / 360 * Math.pow(2, zoom));
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom));
    return { x, y };
  };

  // Get effective ride duration for scheduling
  const getEffectiveRideTime = useCallback(() => {
    return rideType === 'time' ? rideTime : milesToTime(rideMiles);
  }, [rideType, rideTime, rideMiles]);

  // Load nutrition profile on mount
  useEffect(() => {
    const saved = localStorage.getItem('nutritionProfile');
    if (saved) {
      setNutritionProfile(JSON.parse(saved));
    }
  }, []);

  // Generate personalized fueling schedule
  const generateSchedule = useCallback((durationMinutes: number) => {
    const schedule: FuelAlert[] = [];
    
    // Personalized carb timing based on profile
    let carbInterval = 25; // default
    let startTime = 20; // default
    let carbAmount = '10-15g carbs';

    if (nutritionProfile) {
      // Adjust based on GI sensitivity
      if (nutritionProfile.giSensitivity === 'sensitive') {
        carbInterval = 30; // less frequent for sensitive stomachs
        startTime = 15; // start earlier with smaller amounts
        carbAmount = '8-12g carbs';
      } else if (nutritionProfile.giSensitivity === 'tolerant') {
        carbInterval = 20; // more frequent for iron stomachs
        carbAmount = '15-20g carbs';
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

    // Enhanced electrolyte schedule based on sweat rate and temperature
    const needsElectrolytes = currentTemp > 80 || 
      (nutritionProfile?.sweatRate === 'heavy') ||
      (nutritionProfile?.sweatRate === 'moderate' && currentTemp > 75);

    if (needsElectrolytes) {
      let electrolyteInterval = 60;
      let sodiumAmount = '200-400mg sodium';

      if (nutritionProfile?.sweatRate === 'heavy') {
        electrolyteInterval = 45;
        sodiumAmount = '300-500mg sodium';
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
  }, [currentTemp, nutritionProfile]);

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

  // Fetch weather data from OpenWeatherMap
  const fetchWeather = async (zip: string) => {
    if (!zip || zip.length < 5) return;
    
    setIsLoadingWeather(true);
    setWeatherError('');
    
    try {
      // Note: You'll need to get a free API key from openweathermap.org
      const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY || 'demo_key';
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?zip=${zip},US&appid=${API_KEY}&units=imperial`
      );
      
      if (!response.ok) {
        throw new Error('Weather data not found');
      }
      
      const data = await response.json();
      setCurrentTemp(Math.round(data.main.temp));
      setCurrentHumidity(data.main.humidity);
      setWeatherCoords({ lat: data.coord.lat, lon: data.coord.lon });
      setWeatherError('');
    } catch {
      setWeatherError('Unable to fetch weather data');
      setCurrentTemp(75); // fallback temperature
      setCurrentHumidity(50); // fallback humidity
      setWeatherCoords(null); // reset coordinates
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center justify-center gap-3">
            <Zap className="w-10 h-10 text-yellow-400" />
            Cycling Fuel Planner
          </h1>
          <p className="text-blue-200">Smart nutrition timing for peak performance</p>
          {nutritionProfile ? (
            <div className="mt-4 p-4 bg-green-500/20 rounded-lg border border-green-500/30">
              <p className="text-green-300 font-medium">
                Welcome back, {nutritionProfile.name}! Your personalized nutrition plan is ready.
              </p>
              <p className="text-sm text-green-200 mt-1">
                Profile: {nutritionProfile.sweatRate} sweater, {nutritionProfile.intensity} intensity, {nutritionProfile.giSensitivity} stomach
              </p>
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
        </div>

        {!isRiding ? (
          /* Setup Screen */
          <div className="space-y-6">
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
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
                  ) : (
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Expected Distance (miles)
                      </label>
                      <input 
                        type="number" 
                        value={rideMiles}
                        onChange={(e) => setRideMiles(Number(e.target.value))}
                        className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white"
                        min="5" 
                        max="200"
                        step="5"
                        placeholder="Enter miles"
                      />
                      <p className="text-sm text-blue-200 mt-1">
                        Estimated time: {formatTime(milesToTime(rideMiles))} (at 14mph avg)
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Zip Code for Weather
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
                      Current temperature: {currentTemp}°F, {currentHumidity}% humidity
                      {currentTemp > 80 && ' - Hot day, electrolyte alerts enabled'}
                    </p>
                  )}
                </div>
              </div>

              {/* Ride Forecast */}
              <div className="bg-white/5 rounded-lg p-4 mt-4">
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <Timer className="w-5 h-5 text-blue-400" />
                  Ride Forecast
                </h3>
                
                {/* Weather Map */}
                {weatherCoords && (
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <div className="text-blue-200 text-sm">Weather Map</div>
                      <div className="flex gap-1">
                        {[
                          { key: 'precipitation_new', label: 'Rain' },
                          { key: 'clouds_new', label: 'Clouds' },
                          { key: 'wind_new', label: 'Wind' }
                        ].map(layer => (
                          <button
                            key={layer.key}
                            onClick={() => setMapLayer(layer.key)}
                            className={`px-2 py-1 text-xs rounded transition-colors ${
                              mapLayer === layer.key 
                                ? 'bg-blue-600 text-white' 
                                : 'bg-white/20 text-blue-200 hover:bg-white/30'
                            }`}
                          >
                            {layer.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="relative overflow-hidden rounded-lg border border-white/20 bg-gray-800">
                      <div className="w-full h-48 relative">
                        {(() => {
                          const zoom = 8;
                          const { x, y } = getTileCoordinates(weatherCoords.lat, weatherCoords.lon, zoom);
                          
                          // Try Maps API 1.0 format first
                          const tileUrl = `https://tile.openweathermap.org/map/${mapLayer}/${zoom}/${x}/${y}.png?appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`;
                          
                          return (
                            <img
                              src={tileUrl}
                              alt="Weather Map"
                              className="w-full h-full object-cover"
                              onLoad={(e) => {
                                const target = e.target as HTMLImageElement;
                                const loadingDiv = target.nextElementSibling as HTMLElement;
                                if (loadingDiv) loadingDiv.style.display = 'none';
                              }}
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                
                                // Try Maps API 2.0 format as fallback
                                const layer2_0 = mapLayer === 'precipitation_new' ? 'PAC0' : 
                                                mapLayer === 'clouds_new' ? 'CL' : 'WND';
                                const fallbackUrl = `http://maps.openweathermap.org/maps/2.0/weather/${layer2_0}/${zoom}/${x}/${y}?appid=${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY}`;
                                
                                if (target.src !== fallbackUrl) {
                                  target.src = fallbackUrl;
                                  return;
                                }
                                
                                // Both failed, show error
                                target.style.display = 'none';
                                const loadingDiv = target.nextElementSibling as HTMLElement;
                                if (loadingDiv) {
                                  loadingDiv.innerHTML = `
                                    <div>Weather map unavailable</div>
                                    <div class="text-xs mt-1 opacity-70">API: ${process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY ? 'Key present' : 'No key'}</div>
                                    <div class="text-xs opacity-70">Layer: ${mapLayer}</div>
                                  `;
                                  loadingDiv.className = 'absolute inset-0 flex flex-col items-center justify-center bg-gray-800/75 text-red-300 text-sm';
                                }
                              }}
                            />
                          );
                        })()}
                        <div className="absolute inset-0 flex items-center justify-center bg-gray-800/75 text-white text-sm">
                          Loading weather map...
                        </div>
                      </div>
                      <div className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded capitalize">
                        {mapLayer.includes('precipitation') ? 'Precipitation' : 
                         mapLayer.includes('clouds') ? 'Clouds' : 'Wind'}
                      </div>
                      <div className="absolute bottom-2 left-2 text-xs text-white/70">
                        {weatherCoords.lat.toFixed(2)}, {weatherCoords.lon.toFixed(2)}
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
                          <div>Est. Distance: <span className="font-medium text-white">{Math.round((rideTime / 60) * 14)} miles</span></div>
                        </>
                      ) : (
                        <>
                          <div>Distance: <span className="font-medium text-white">{rideMiles} miles</span></div>
                          <div>Est. Duration: <span className="font-medium text-white">{formatTime(milesToTime(rideMiles))}</span></div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-blue-200 mb-2">Fuel Requirements</div>
                    <div className="space-y-1">
                      <div>Fuel alerts: <span className="font-medium text-white">{fuelSchedule.filter(alert => alert.type === 'carbs').length}</span></div>
                      <div>Total carbs: <span className="font-medium text-white">{fuelSchedule.filter(alert => alert.type === 'carbs').length * 12}g approx.</span></div>
                      {currentTemp > 80 && (
                        <div>Electrolytes: <span className="font-medium text-yellow-300">{fuelSchedule.filter(alert => alert.type === 'electrolytes').length} doses needed</span></div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <div className="text-blue-200 mb-2">Conditions</div>
                    <div className="space-y-1">
                      {currentTemp ? (
                        <>
                          <div>Temperature: <span className="font-medium text-white">{currentTemp}°F</span></div>
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
            </div>

            {/* Fuel Schedule Preview */}
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4">Your Fuel Schedule</h3>
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
            </div>

            {/* Pre-Ride Checklist */}
            <div className="bg-green-500/20 rounded-xl p-6 border border-green-500/30">
              <h3 className="text-xl font-semibold mb-4 text-green-300">Pre-Ride Checklist</h3>
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
            </div>

            <button 
              onClick={startRide}
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 px-8 rounded-xl transition-colors text-xl"
            >
              Start Ride Timer
            </button>
          </div>
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
    </div>
  );
}
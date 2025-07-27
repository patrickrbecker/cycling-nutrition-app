'use client';

import { useState, useEffect } from 'react';
import { Clock, Plus, Zap, Droplets, Timer, AlertTriangle } from 'lucide-react';

interface FuelAlert {
  time: number; // minutes
  type: 'carbs' | 'electrolytes';
  amount: string;
  priority: 'normal' | 'critical';
}

export default function CyclingNutritionApp() {
  const [rideTime, setRideTime] = useState<number>(60); // minutes
  const [isRiding, setIsRiding] = useState(false);
  const [elapsedTime, setElapsedTime] = useState<number>(0);
  const [fuelSchedule, setFuelSchedule] = useState<FuelAlert[]>([]);
  const [completedAlerts, setCompletedAlerts] = useState<Set<number>>(new Set());
  const [currentTemp, setCurrentTemp] = useState<number>(75); // Fahrenheit

  // Generate fueling schedule based on your proven protocol
  const generateSchedule = (durationMinutes: number) => {
    const schedule: FuelAlert[] = [];
    
    // Carb schedule: every 25 minutes starting at 20 minutes
    for (let time = 20; time < durationMinutes; time += 25) {
      schedule.push({
        time,
        type: 'carbs',
        amount: '10-15g carbs (½ gel or 8oz sports drink)',
        priority: 'normal'
      });
    }

    // Electrolyte schedule: every 60 minutes if temp > 80°F
    if (currentTemp > 80) {
      for (let time = 70; time < durationMinutes; time += 60) {
        schedule.push({
          time,
          type: 'electrolytes',
          amount: '200-400mg sodium (electrolyte tab/chew)',
          priority: 'normal'
        });
      }
    }

    return schedule.sort((a, b) => a.time - b.time);
  };

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

  // Update schedule when ride time or temperature changes
  useEffect(() => {
    setFuelSchedule(generateSchedule(rideTime));
  }, [rideTime, currentTemp]);

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
  const progressPercent = (elapsedTime / rideTime) * 100;

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
        </div>

        {!isRiding ? (
          /* Setup Screen */
          <div className="space-y-6">
            <div className="bg-white/10 rounded-xl p-6 backdrop-blur-sm">
              <h2 className="text-2xl font-semibold mb-4">Plan Your Ride</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Expected Ride Time
                  </label>
                  <select 
                    value={rideTime} 
                    onChange={(e) => setRideTime(Number(e.target.value))}
                    className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white"
                  >
                    <option value={60}>1 hour (20 miles)</option>
                    <option value={120}>2 hours (40 miles)</option>
                    <option value={150}>2.5 hours (50 miles)</option>
                    <option value={180}>3 hours (60 miles)</option>
                    <option value={240}>4 hours (80 miles)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Temperature (°F)
                  </label>
                  <input 
                    type="number" 
                    value={currentTemp}
                    onChange={(e) => setCurrentTemp(Number(e.target.value))}
                    className="w-full p-3 rounded-lg bg-white/20 border border-white/30 text-white"
                    min="40" 
                    max="110"
                  />
                  {currentTemp > 80 && (
                    <p className="text-yellow-300 text-sm mt-1">
                      Hot day - electrolyte alerts enabled
                    </p>
                  )}
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
                  <div className="text-sm text-blue-200">of {formatTime(rideTime)}</div>
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
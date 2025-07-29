'use client';

import { useState, useEffect } from 'react';
import { useFeatureFlag, trackVariantExposure } from '../utils/flags';

interface FeatureFlagDebugPanelProps {
  isVisible: boolean;
  onClose: () => void;
}

export default function FeatureFlagDebugPanel({ isVisible, onClose }: FeatureFlagDebugPanelProps) {
  const [flags, setFlags] = useState({
    enhancedWeatherWidget: false,
    improvedSurveyFlow: false,
    advancedNutritionRecommendations: false,
    premiumFeatures: false
  });

  useEffect(() => {
    // Load current flag states from localStorage
    const loadFlags = () => {
      const newFlags = { ...flags };
      Object.keys(flags).forEach(flagName => {
        try {
          const stored = localStorage.getItem(`flag_${flagName}`);
          if (stored !== null) {
            newFlags[flagName as keyof typeof flags] = JSON.parse(stored);
          }
        } catch {
          // Ignore errors
        }
      });
      setFlags(newFlags);
    };

    if (isVisible) {
      loadFlags();
    }
  }, [isVisible]);

  const toggleFlag = (flagName: keyof typeof flags) => {
    const newValue = !flags[flagName];
    localStorage.setItem(`flag_${flagName}`, JSON.stringify(newValue));
    setFlags(prev => ({ ...prev, [flagName]: newValue }));
    
    // Track the flag change
    trackVariantExposure('debug_flag_toggle', newValue ? 'enabled' : 'disabled', {
      flag_name: flagName,
      manual_toggle: true
    });
  };

  const resetAllFlags = () => {
    Object.keys(flags).forEach(flagName => {
      localStorage.removeItem(`flag_${flagName}`);
    });
    setFlags({
      enhancedWeatherWidget: false,
      improvedSurveyFlow: false,
      advancedNutritionRecommendations: false,
      premiumFeatures: false
    });
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-gray-900">Feature Flag Debug Panel</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="space-y-4">
          {Object.entries(flags).map(([flagName, isEnabled]) => (
            <div key={flagName} className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {flagName.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </label>
              <button
                onClick={() => toggleFlag(flagName as keyof typeof flags)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                  isEnabled ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isEnabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={resetAllFlags}
            className="flex-1 bg-gray-200 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Reset All
          </button>
          <button
            onClick={onClose}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Done
          </button>
        </div>

        <div className="mt-4 text-xs text-gray-500">
          🧪 This panel is for testing A/B variants. Changes are tracked in analytics.
        </div>
      </div>
    </div>
  );
}
'use client';

import { useState, useEffect } from 'react';
import { X, Shield, Eye, Settings } from 'lucide-react';

interface ConsentSettings {
  essential: boolean;
  analytics: boolean;
  performance: boolean;
  marketing: boolean;
}

interface ConsentBannerProps {
  onConsentChange?: (settings: ConsentSettings) => void;
}

export default function ConsentBanner({ onConsentChange }: ConsentBannerProps) {
  const [showBanner, setShowBanner] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [consentSettings, setConsentSettings] = useState<ConsentSettings>({
    essential: true, // Always required
    analytics: false,
    performance: false,
    marketing: false
  });

  // Check if consent has been given
  useEffect(() => {
    const consent = localStorage.getItem('user_consent');
    if (!consent) {
      setShowBanner(true);
    } else {
      try {
        const savedSettings = JSON.parse(consent);
        setConsentSettings(savedSettings);
        onConsentChange?.(savedSettings);
      } catch {
        // Invalid consent data, show banner again
        setShowBanner(true);
      }
    }
  }, [onConsentChange]);

  const handleAcceptAll = () => {
    const allConsent: ConsentSettings = {
      essential: true,
      analytics: true,
      performance: true,
      marketing: true
    };
    saveConsent(allConsent);
  };

  const handleAcceptEssential = () => {
    const essentialOnly: ConsentSettings = {
      essential: true,
      analytics: false,
      performance: false,
      marketing: false
    };
    saveConsent(essentialOnly);
  };

  const handleCustomSave = () => {
    saveConsent(consentSettings);
  };

  const saveConsent = (settings: ConsentSettings) => {
    localStorage.setItem('user_consent', JSON.stringify(settings));
    localStorage.setItem('consent_timestamp', new Date().toISOString());
    setConsentSettings(settings);
    setShowBanner(false);
    setShowDetails(false);
    onConsentChange?.(settings);
  };

  const handleSettingChange = (key: keyof ConsentSettings, value: boolean) => {
    if (key === 'essential') return; // Essential cookies cannot be disabled
    setConsentSettings(prev => ({ ...prev, [key]: value }));
  };

  if (!showBanner) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-gray-900/95 backdrop-blur-sm border-t border-gray-700">
      <div className="container mx-auto px-4 py-4">
        {!showDetails ? (
          // Simple banner
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3 flex-1">
              <Shield className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="text-white font-medium mb-1">Cookie Consent</h3>
                <p className="text-gray-300 text-sm">
                  We use cookies to improve your experience and analyze site usage. 
                  <button 
                    onClick={() => setShowDetails(true)}
                    className="text-blue-400 hover:text-blue-300 underline ml-1"
                  >
                    Customize settings
                  </button>
                </p>
              </div>
            </div>
            <div className="flex gap-3 flex-shrink-0">
              <button
                onClick={handleAcceptEssential}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Accept All
              </button>
            </div>
          </div>
        ) : (
          // Detailed settings
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Settings className="w-5 h-5 text-blue-400" />
                Cookie Preferences
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {/* Essential Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-white font-medium">Essential Cookies</h4>
                  <p className="text-gray-400 text-sm">Required for basic site functionality</p>
                </div>
                <div className="text-green-400 font-medium">Always On</div>
              </div>

              {/* Analytics Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-white font-medium">Analytics Cookies</h4>
                  <p className="text-gray-400 text-sm">Help us understand how you use our site (Google Analytics)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentSettings.analytics}
                    onChange={(e) => handleSettingChange('analytics', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Performance Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-white font-medium">Performance Cookies</h4>
                  <p className="text-gray-400 text-sm">Monitor site performance and speed (Vercel Analytics)</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentSettings.performance}
                    onChange={(e) => handleSettingChange('performance', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>

              {/* Marketing Cookies */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                <div className="flex-1">
                  <h4 className="text-white font-medium">Marketing Cookies</h4>
                  <p className="text-gray-400 text-sm">Track conversion and advertising effectiveness</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentSettings.marketing}
                    onChange={(e) => handleSettingChange('marketing', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={handleAcceptEssential}
                className="px-4 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Essential Only
              </button>
              <button
                onClick={handleCustomSave}
                className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Save Preferences
              </button>
              <button
                onClick={handleAcceptAll}
                className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                Accept All
              </button>
            </div>

            <div className="text-xs text-gray-400 pt-2 border-t border-gray-700">
              <p>
                You can change these settings at any time. For more information, see our{' '}
                <a href="/privacy" className="text-blue-400 hover:text-blue-300 underline">
                  Privacy Policy
                </a>.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
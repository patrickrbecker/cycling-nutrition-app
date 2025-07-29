// GA4 Analytics Utility Functions with Feature Flag Integration and Consent Management
import { ConsentManager } from './consent';

declare global {
  interface Window {
    va?: (command: string, event: string, properties?: Record<string, unknown>) => void;
  }
}

// Helper function to get active feature flags for analytics
const getActiveFeatureFlags = (): string[] => {
  if (typeof window === 'undefined') return [];
  
  const flags: string[] = [];
  const flagNames = [
    'enhancedWeatherWidget',
    'improvedSurveyFlow', 
    'advancedNutritionRecommendations',
    'premiumFeatures'
  ];

  flagNames.forEach(flagName => {
    try {
      const stored = localStorage.getItem(`flag_${flagName}`);
      if (stored && JSON.parse(stored) === true) {
        flags.push(flagName);
      }
    } catch {
      // Ignore localStorage errors
    }
  });

  return flags;
};

// Helper function to check if analytics tracking is allowed
const canTrack = (): boolean => {
  return typeof window !== 'undefined' && !!window.gtag && ConsentManager.canTrackAnalytics();
};

export const analytics = {
  // Survey completion tracking with feature flags and consent
  trackSurveyCompleted: (profileData: {
    weight: number;
    sweatRate: string;
    intensity: string;
    experienceLevel: string;
    name?: string;
  }) => {
    if (canTrack() && window.gtag) {
      const activeFlags = getActiveFeatureFlags();
      
      window.gtag('event', 'survey_completed', {
        event_category: 'engagement',
        event_label: 'nutrition_profile_created',
        custom_parameters: {
          user_weight: profileData.weight,
          sweat_rate: profileData.sweatRate,
          intensity_level: profileData.intensity,
          experience_level: profileData.experienceLevel,
          has_name: !!profileData.name,
          active_feature_flags: activeFlags.join(','),
          feature_flag_count: activeFlags.length
        }
      });

      // Also track with Vercel Analytics if available
      if (typeof window.va !== 'undefined') {
        window.va('track', 'survey_completed', {
          weight: profileData.weight,
          sweat_rate: profileData.sweatRate,
          flags: activeFlags
        });
      }
    }
  },

  // Survey step tracking
  trackSurveyStep: (stepNumber: number, stepName: string, timeSpent?: number) => {
    if (canTrack() && window.gtag) {
      window.gtag('event', 'survey_step_completed', {
        event_category: 'engagement',
        event_label: `survey_step_${stepNumber}`,
        custom_parameters: {
          step_number: stepNumber,
          step_name: stepName,
          time_spent_seconds: timeSpent || 0
        }
      });
    }
  },

  // Survey abandonment tracking
  trackSurveyAbandoned: (stepNumber: number, timeSpent: number) => {
    if (canTrack() && window.gtag) {
      window.gtag('event', 'survey_abandoned', {
        event_category: 'engagement',
        event_label: `abandoned_at_step_${stepNumber}`,
        custom_parameters: {
          abandoned_step: stepNumber,
          time_spent_seconds: timeSpent
        }
      });
    }
  },

  // Print schedule tracking
  trackSchedulePrint: (rideData: {
    distance: number;
    duration: number;
    temperature: number;
    rideType: string;
  }) => {
    if (canTrack() && window.gtag) {
      window.gtag('event', 'schedule_printed', {
        event_category: 'feature_usage',
        event_label: 'nutrition_schedule_print',
        custom_parameters: {
          ride_distance: rideData.distance,
          ride_duration_minutes: rideData.duration,
          weather_temp: rideData.temperature,
          ride_type: rideData.rideType
        }
      });
    }
  },

  // Weather data usage tracking
  trackWeatherLoaded: (weatherData: {
    zipCode: string;
    temperature: number;
    cached: boolean;
    location: string;
  }) => {
    if (canTrack() && window.gtag) {
      window.gtag('event', 'weather_data_loaded', {
        event_category: 'feature_usage',
        event_label: 'weather_integration_success',
        custom_parameters: {
          zip_code: weatherData.zipCode,
          temperature: weatherData.temperature,
          is_cached: weatherData.cached,
          location: weatherData.location
        }
      });
    }
  },

  // Ride timer tracking
  trackRideStarted: (rideConfig: {
    type: string;
    duration: number;
    hasWeather: boolean;
    hasProfile: boolean;
  }) => {
    if (canTrack() && window.gtag) {
      window.gtag('event', 'ride_started', {
        event_category: 'engagement',
        event_label: 'cycling_session_start',
        custom_parameters: {
          ride_type: rideConfig.type,
          planned_duration: rideConfig.duration,
          has_weather_data: rideConfig.hasWeather,
          has_nutrition_profile: rideConfig.hasProfile
        }
      });
    }
  },

  // Fuel alert completion
  trackFuelAlertCompleted: (alertData: {
    time: number;
    type: string;
    rideProgress: number;
  }) => {
    if (canTrack() && window.gtag) {
      window.gtag('event', 'fuel_alert_completed', {
        event_category: 'engagement',
        event_label: 'nutrition_timing_followed',
        custom_parameters: {
          alert_time_minutes: alertData.time,
          fuel_type: alertData.type,
          ride_progress_percent: alertData.rideProgress
        }
      });
    }
  },

  // GPX file upload tracking
  trackGpxUpload: (routeData: {
    distance: number;
    elevationGain: number;
    estimatedTime: number;
  }) => {
    if (canTrack() && window.gtag) {
      window.gtag('event', 'gpx_file_uploaded', {
        event_category: 'feature_usage',
        event_label: 'route_analysis_used',
        custom_parameters: {
          route_distance_km: routeData.distance,
          elevation_gain_m: routeData.elevationGain,
          estimated_time_min: routeData.estimatedTime
        }
      });
    }
  },

  // Feature engagement tracking
  trackFeatureUsage: (feature: string, action: string, value?: string | number) => {
    if (canTrack() && window.gtag) {
      window.gtag('event', 'feature_used', {
        event_category: 'feature_usage',
        event_label: `${feature}_${action}`,
        custom_parameters: {
          feature_name: feature,
          action_type: action,
          value: value || null
        }
      });
    }
  },

  // User journey tracking
  trackUserJourney: (journeyStep: string, metadata?: Record<string, unknown>) => {
    if (canTrack() && window.gtag) {
      window.gtag('event', 'user_journey', {
        event_category: 'user_flow',
        event_label: journeyStep,
        custom_parameters: {
          journey_step: journeyStep,
          ...metadata
        }
      });
    }
  }
};

// Conversion goals for GA4
export const conversionGoals = {
  SURVEY_COMPLETED: 'survey_completed',
  SCHEDULE_PRINTED: 'schedule_printed', 
  RIDE_COMPLETED: 'ride_completed',
  WEATHER_USED: 'weather_data_loaded',
  GPX_ANALYZED: 'gpx_file_uploaded'
};
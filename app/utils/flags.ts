import { track } from '@vercel/analytics';

// Feature flag definitions for A/B testing
export interface FeatureFlags {
  enhancedWeatherWidget: boolean;
  improvedSurveyFlow: boolean;
  advancedNutritionRecommendations: boolean;
  premiumFeatures: boolean;
}

// Default flag values (fallbacks)
export const DEFAULT_FLAGS: FeatureFlags = {
  enhancedWeatherWidget: false,
  improvedSurveyFlow: false,
  advancedNutritionRecommendations: false,
  premiumFeatures: false,
};

// Client-side flag tracking with analytics
export const trackFeatureFlag = (flagName: keyof FeatureFlags, value: boolean, eventName?: string) => {
  if (typeof window !== 'undefined') {
    // Track the feature flag usage
    track(eventName || 'feature_flag_exposure', {
      flag_name: flagName,
      flag_value: value,
      timestamp: Date.now()
    }, { 
      flags: [flagName] 
    });
  }
};

// Server-side flag reporting (client-side only implementation)
export const reportFeatureFlag = (flagName: keyof FeatureFlags, value: boolean) => {
  // For now, we'll just track client-side
  // In production, this could integrate with Vercel's feature flag API
  console.log(`Feature flag ${flagName}: ${value}`);
};

// Feature flag hooks for React components
export const useFeatureFlag = (flagName: keyof FeatureFlags, defaultValue?: boolean): boolean => {
  // In a real implementation, this would connect to Vercel's feature flag system
  // For now, we'll use localStorage for testing and demo purposes
  const getValue = (): boolean => {
    if (typeof window === 'undefined') {
      return defaultValue ?? DEFAULT_FLAGS[flagName];
    }

    try {
      const stored = localStorage.getItem(`flag_${flagName}`);
      if (stored !== null) {
        const value = JSON.parse(stored);
        trackFeatureFlag(flagName, value);
        return value;
      }
    } catch {
      // Ignore localStorage errors
    }

    const value = defaultValue ?? DEFAULT_FLAGS[flagName];
    trackFeatureFlag(flagName, value);
    return value;
  };

  return getValue();
};

// A/B test variant tracking
export const trackVariantExposure = (testName: string, variant: string, metadata?: Record<string, unknown>) => {
  if (typeof window !== 'undefined') {
    track('ab_test_exposure', {
      test_name: testName,
      variant,
      timestamp: Date.now(),
      ...metadata
    }, {
      flags: [`${testName}_${variant}`]
    });
  }
};

// Conversion tracking with feature flags
export const trackConversionWithFlags = (
  conversionEvent: string, 
  activeFlags: Partial<FeatureFlags>,
  metadata?: Record<string, unknown>
) => {
  if (typeof window !== 'undefined') {
    const flagNames = Object.entries(activeFlags)
      .filter(([, value]) => value)
      .map(([name]) => name);

    track(conversionEvent, {
      active_flags: flagNames.join(','),
      flag_count: flagNames.length,
      timestamp: Date.now(),
      ...metadata
    }, {
      flags: flagNames
    });
  }
};

// Feature flag analytics summary
export const getActiveFlags = (): Partial<FeatureFlags> => {
  const flags: Partial<FeatureFlags> = {};
  
  Object.keys(DEFAULT_FLAGS).forEach((flagName) => {
    const key = flagName as keyof FeatureFlags;
    flags[key] = useFeatureFlag(key);
  });

  return flags;
};
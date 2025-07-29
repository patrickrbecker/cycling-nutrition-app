/**
 * GDPR/CCPA Consent Management Utilities
 * Manages user consent for different types of tracking and analytics
 */

export interface ConsentSettings {
  essential: boolean;
  analytics: boolean;
  performance: boolean;
  marketing: boolean;
}

export class ConsentManager {
  private static readonly CONSENT_KEY = 'user_consent';
  private static readonly CONSENT_TIMESTAMP_KEY = 'consent_timestamp';
  private static readonly CONSENT_VERSION = '1.0';
  private static readonly CONSENT_EXPIRY_DAYS = 365;

  /**
   * Gets current consent settings
   */
  static getConsent(): ConsentSettings | null {
    try {
      const consent = localStorage.getItem(this.CONSENT_KEY);
      if (!consent) return null;

      const settings = JSON.parse(consent);
      
      // Check if consent has expired
      if (this.hasConsentExpired()) {
        this.clearConsent();
        return null;
      }

      return settings;
    } catch {
      return null;
    }
  }

  /**
   * Saves consent settings
   */
  static setConsent(settings: ConsentSettings): void {
    try {
      localStorage.setItem(this.CONSENT_KEY, JSON.stringify(settings));
      localStorage.setItem(this.CONSENT_TIMESTAMP_KEY, new Date().toISOString());
      localStorage.setItem('consent_version', this.CONSENT_VERSION);
    } catch (error) {
      console.error('Failed to save consent:', error);
    }
  }

  /**
   * Checks if user has given consent for a specific type
   */
  static hasConsent(type: keyof ConsentSettings): boolean {
    const consent = this.getConsent();
    if (!consent) return false;
    
    // Essential cookies are always allowed
    if (type === 'essential') return true;
    
    return consent[type] || false;
  }

  /**
   * Checks if analytics tracking is allowed
   */
  static canTrackAnalytics(): boolean {
    return this.hasConsent('analytics');
  }

  /**
   * Checks if performance monitoring is allowed
   */
  static canTrackPerformance(): boolean {
    return this.hasConsent('performance');
  }

  /**
   * Checks if marketing tracking is allowed
   */
  static canTrackMarketing(): boolean {
    return this.hasConsent('marketing');
  }

  /**
   * Checks if any consent has been given
   */
  static hasAnyConsent(): boolean {
    return this.getConsent() !== null;
  }

  /**
   * Checks if consent has expired
   */
  private static hasConsentExpired(): boolean {
    try {
      const timestamp = localStorage.getItem(this.CONSENT_TIMESTAMP_KEY);
      if (!timestamp) return true;

      const consentDate = new Date(timestamp);
      const expiryDate = new Date(consentDate.getTime() + (this.CONSENT_EXPIRY_DAYS * 24 * 60 * 60 * 1000));
      
      return new Date() > expiryDate;
    } catch {
      return true;
    }
  }

  /**
   * Clears all consent data
   */
  static clearConsent(): void {
    localStorage.removeItem(this.CONSENT_KEY);
    localStorage.removeItem(this.CONSENT_TIMESTAMP_KEY);
    localStorage.removeItem('consent_version');
  }

  /**
   * Gets consent summary for analytics
   */
  static getConsentSummary(): {
    hasConsent: boolean;
    consentTypes: string[];
    consentDate?: string;
  } {
    const consent = this.getConsent();
    if (!consent) {
      return { hasConsent: false, consentTypes: [] };
    }

    const consentTypes = Object.entries(consent)
      .filter(([, value]) => value)
      .map(([key]) => key);

    const timestamp = localStorage.getItem(this.CONSENT_TIMESTAMP_KEY);

    return {
      hasConsent: true,
      consentTypes,
      consentDate: timestamp || undefined
    };
  }

  /**
   * Checks if user is in a region requiring consent (simplified check)
   */
  static requiresConsent(): boolean {
    // Simplified check - in a real implementation, you might:
    // 1. Check user's IP location
    // 2. Use a geolocation service
    // 3. Check browser language settings
    // For now, we'll always require consent to be GDPR compliant
    return true;
  }

  /**
   * Updates Google Analytics consent state
   */
  static updateGoogleAnalyticsConsent(): void {
    if (typeof window !== 'undefined' && window.gtag) {
      const consent = this.getConsent();
      
      window.gtag('consent', 'update', {
        'analytics_storage': consent?.analytics ? 'granted' : 'denied',
        'ad_storage': consent?.marketing ? 'granted' : 'denied',
        'functionality_storage': 'granted', // Essential functionality
        'security_storage': 'granted', // Security features
      });
    }
  }

  /**
   * Initializes default consent state for Google Analytics
   */
  static initializeGoogleAnalyticsConsent(): void {
    if (typeof window !== 'undefined' && window.gtag) {
      // Set default consent state before GA loads
      window.gtag('consent', 'default', {
        'analytics_storage': 'denied',
        'ad_storage': 'denied',
        'functionality_storage': 'granted',
        'security_storage': 'granted',
        'wait_for_update': 500 // Wait for user choice
      });

      // Update with saved consent if available
      this.updateGoogleAnalyticsConsent();
    }
  }
}

// Extend global Window interface for gtag
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
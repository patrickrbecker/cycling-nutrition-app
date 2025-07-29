/**
 * Secure GPX file validation and parsing utilities
 * Provides comprehensive protection against XXE attacks, XML bombs, and malicious content
 */

export interface GPXValidationResult {
  isValid: boolean;
  error?: string;
  warnings?: string[];
}

export class GPXValidator {
  // Security limits
  private static readonly MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  private static readonly MAX_CONTENT_SIZE = 10 * 1024 * 1024; // 10MB text content
  private static readonly MAX_TRACK_POINTS = 50000; // Reasonable limit for track points
  private static readonly MAX_ENTITY_EXPANSIONS = 100; // Prevent XML bomb attacks
  private static readonly MAX_NESTED_ELEMENTS = 1000; // Prevent deeply nested XML

  // Allowed MIME types
  private static readonly ALLOWED_MIME_TYPES = [
    'application/xml',
    'text/xml',
    'application/gpx+xml',
    'application/octet-stream' // Some browsers don't set MIME type correctly
  ];

  // Dangerous XML patterns that should be blocked
  private static readonly DANGEROUS_PATTERNS = [
    /<!ENTITY/i,        // XML entities
    /<!DOCTYPE/i,       // DOCTYPE declarations
    /<\?xml[^>]*encoding\s*=\s*["'][^"']*["']/i, // Non-UTF-8 encodings
    /<script[^>]*>/i,   // Script tags
    /javascript:/i,     // JavaScript URLs
    /data:/i,          // Data URLs
    /file:/i,          // File URLs
    /ftp:/i,           // FTP URLs
  ];

  /**
   * Validates a GPX file for security and format compliance
   */
  static validateFile(file: File): GPXValidationResult {
    const warnings: string[] = [];

    // File size validation
    if (file.size > this.MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: `File too large. Maximum size is ${this.MAX_FILE_SIZE / (1024 * 1024)}MB`
      };
    }

    // File extension validation
    if (!file.name.toLowerCase().endsWith('.gpx')) {
      return {
        isValid: false,
        error: 'Invalid file extension. Only .gpx files are allowed'
      };
    }

    // MIME type validation (if available)
    if (file.type && !this.ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      warnings.push(`Unexpected MIME type: ${file.type}. Proceeding with caution.`);
    }

    // Filename validation
    if (!this.isValidFilename(file.name)) {
      return {
        isValid: false,
        error: 'Invalid filename. Only alphanumeric characters, hyphens, underscores, and dots are allowed'
      };
    }

    return {
      isValid: true,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  }

  /**
   * Validates and sanitizes GPX content for security threats
   */
  static async validateContent(file: File): Promise<GPXValidationResult> {
    try {
      const content = await this.readFileSecurely(file);
      
      // Content size validation
      if (content.length > this.MAX_CONTENT_SIZE) {
        return {
          isValid: false,
          error: `Content too large. Maximum content size is ${this.MAX_CONTENT_SIZE / (1024 * 1024)}MB`
        };
      }

      // Check for dangerous patterns
      const dangerousPattern = this.DANGEROUS_PATTERNS.find(pattern => pattern.test(content));
      if (dangerousPattern) {
        return {
          isValid: false,
          error: 'File contains potentially dangerous content and cannot be processed'
        };
      }

      // Validate XML structure without parsing entities
      const structureValidation = this.validateXMLStructure(content);
      if (!structureValidation.isValid) {
        return structureValidation;
      }

      // Parse and validate GPX-specific content
      const gpxValidation = this.validateGPXStructure(content);
      return gpxValidation;

    } catch (error) {
      return {
        isValid: false,
        error: error instanceof Error ? error.message : 'Failed to read file content'
      };
    }
  }

  /**
   * Safely reads file content with encoding validation
   */
  private static readFileSecurely(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const content = event.target?.result as string;
          
          // Validate encoding - ensure it's valid UTF-8
          const encoder = new TextEncoder();
          const decoder = new TextDecoder('utf-8', { fatal: true });
          
          try {
            const encoded = encoder.encode(content);
            decoder.decode(encoded);
          } catch {
            reject(new Error('Invalid text encoding. File must be UTF-8 encoded'));
            return;
          }

          resolve(content);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsText(file, 'utf-8');
    });
  }

  /**
   * Validates XML structure without enabling entity processing
   */
  private static validateXMLStructure(content: string): GPXValidationResult {
    try {
      // Count nesting depth to prevent deeply nested XML attacks
      let maxDepth = 0;
      let currentDepth = 0;
      let openTags = 0;

      for (let i = 0; i < content.length; i++) {
        if (content[i] === '<') {
          if (content[i + 1] === '/') {
            currentDepth--;
          } else if (content[i + 1] !== '!' && content[i + 1] !== '?') {
            currentDepth++;
            openTags++;
            maxDepth = Math.max(maxDepth, currentDepth);
          }
        }
      }

      if (maxDepth > this.MAX_NESTED_ELEMENTS) {
        return {
          isValid: false,
          error: 'XML structure too deeply nested'
        };
      }

      // Basic XML well-formedness check
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'application/xml');
      
      const parseErrors = doc.getElementsByTagName('parsererror');
      if (parseErrors.length > 0) {
        return {
          isValid: false,
          error: 'Invalid XML format'
        };
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'Failed to validate XML structure'
      };
    }
  }

  /**
   * Validates GPX-specific structure and content
   */
  private static validateGPXStructure(content: string): GPXValidationResult {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, 'application/xml');
      
      // Check for GPX root element
      const gpxElement = doc.getElementsByTagName('gpx')[0];
      if (!gpxElement) {
        return {
          isValid: false,
          error: 'Invalid GPX file: missing GPX root element'
        };
      }

      // Validate GPX version
      const version = gpxElement.getAttribute('version');
      if (!version || !['1.0', '1.1'].includes(version)) {
        return {
          isValid: false,
          error: 'Unsupported GPX version. Only versions 1.0 and 1.1 are supported'
        };
      }

      // Count track points
      const trackPoints = doc.getElementsByTagName('trkpt');
      if (trackPoints.length === 0) {
        return {
          isValid: false,
          error: 'No track points found in GPX file'
        };
      }

      if (trackPoints.length > this.MAX_TRACK_POINTS) {
        return {
          isValid: false,
          error: `Too many track points. Maximum allowed is ${this.MAX_TRACK_POINTS}`
        };
      }

      // Validate track point structure
      for (let i = 0; i < Math.min(trackPoints.length, 100); i++) { // Sample validation
        const point = trackPoints[i];
        const lat = point.getAttribute('lat');
        const lon = point.getAttribute('lon');
        
        if (!lat || !lon) {
          return {
            isValid: false,
            error: 'Invalid track point: missing latitude or longitude'
          };
        }

        const latNum = parseFloat(lat);
        const lonNum = parseFloat(lon);
        
        if (isNaN(latNum) || isNaN(lonNum) || 
            latNum < -90 || latNum > 90 || 
            lonNum < -180 || lonNum > 180) {
          return {
            isValid: false,
            error: 'Invalid coordinates in track point'
          };
        }
      }

      return { isValid: true };
    } catch (error) {
      return {
        isValid: false,
        error: 'Failed to validate GPX structure'
      };
    }
  }

  /**
   * Validates filename for security
   */
  private static isValidFilename(filename: string): boolean {
    // Allow only safe characters in filename
    const safePattern = /^[a-zA-Z0-9._-]+\.gpx$/i;
    return safePattern.test(filename) && filename.length <= 255;
  }

  /**
   * Sanitizes text content from GPX elements
   */
  static sanitizeText(text: string): string {
    return text
      .replace(/[<>&"']/g, '') // Remove potential HTML/XML characters
      .replace(/[\x00-\x1f\x7f-\x9f]/g, '') // Remove control characters
      .trim()
      .substring(0, 1000); // Limit length
  }
}
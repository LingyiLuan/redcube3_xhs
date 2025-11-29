/**
 * ============================================================================
 * Feature Flags (Instant Rollback Capability)
 * Pattern: Meta's Gatekeeper + LaunchDarkly
 * ============================================================================
 *
 * Features:
 * - Instant killswitch for problematic features (0-5 seconds)
 * - Environment-based feature control
 * - Per-feature configuration with descriptions
 * - Hot reload without service restart
 *
 * Companies using this pattern:
 * - Meta: Gatekeeper (5-30 second rollback)
 * - Netflix: Zuul with dynamic routing
 * - Uber: Feature flags for gradual rollout
 * - Airbnb: Trebuchet for A/B testing
 *
 * Usage:
 * if (featureFlags.isEnabled('ugc_analysis')) {
 *   // Run feature
 * }
 */

// Default feature flags (can be overridden by environment variables)
const DEFAULT_FLAGS = {
  // === Core Features ===
  ugc_analysis: {
    enabled: true,
    description: 'User-generated content analysis (Interview Intel)',
    env_var: 'FEATURE_UGC_ANALYSIS',
  },
  learning_maps: {
    enabled: true,
    description: 'Learning map generation',
    env_var: 'FEATURE_LEARNING_MAPS',
  },
  batch_analysis: {
    enabled: true,
    description: 'Batch analysis for multiple posts',
    env_var: 'FEATURE_BATCH_ANALYSIS',
  },

  // === Intelligence Features ===
  citation_tracking: {
    enabled: true,
    description: 'Track citations in learning maps',
    env_var: 'FEATURE_CITATION_TRACKING',
  },
  reputation_system: {
    enabled: true,
    description: 'User reputation and voting system',
    env_var: 'FEATURE_REPUTATION_SYSTEM',
  },
  trending_algorithm: {
    enabled: true,
    description: 'Trending experiences algorithm',
    env_var: 'FEATURE_TRENDING_ALGORITHM',
  },

  // === Background Jobs ===
  schedulers: {
    enabled: true,
    description: 'Background schedulers (embeddings, scraping, etc)',
    env_var: 'FEATURE_SCHEDULERS',
  },
  auto_scraping: {
    enabled: true,
    description: 'Automatic content scraping',
    env_var: 'FEATURE_AUTO_SCRAPING',
  },
  auto_embeddings: {
    enabled: true,
    description: 'Automatic embedding generation',
    env_var: 'FEATURE_AUTO_EMBEDDINGS',
  },

  // === External Integrations ===
  openrouter_ai: {
    enabled: true,
    description: 'OpenRouter AI integration',
    env_var: 'FEATURE_OPENROUTER_AI',
  },

  // === New/Experimental Features ===
  enhanced_intelligence: {
    enabled: false,
    description: 'Enhanced intelligence extraction (experimental)',
    env_var: 'FEATURE_ENHANCED_INTELLIGENCE',
  },
};

class FeatureFlags {
  constructor() {
    this.flags = this.loadFlags();
  }

  /**
   * Load feature flags from environment variables
   * Environment variables override default values
   */
  loadFlags() {
    const flags = {};

    for (const [key, config] of Object.entries(DEFAULT_FLAGS)) {
      // Check environment variable first
      const envValue = process.env[config.env_var];

      if (envValue !== undefined) {
        // Environment variable takes precedence
        flags[key] = {
          ...config,
          enabled: envValue === 'true' || envValue === '1',
          source: 'env',
        };
      } else {
        // Use default value
        flags[key] = {
          ...config,
          source: 'default',
        };
      }
    }

    return flags;
  }

  /**
   * Check if a feature is enabled
   * @param {string} featureName - Name of the feature
   * @returns {boolean} - True if enabled
   */
  isEnabled(featureName) {
    const flag = this.flags[featureName];

    if (!flag) {
      console.warn(`[FeatureFlags] Unknown feature flag: ${featureName}`);
      return false;
    }

    return flag.enabled;
  }

  /**
   * Get all feature flags
   * @returns {object} - All feature flags
   */
  getAll() {
    const result = {};
    for (const [key, config] of Object.entries(this.flags)) {
      result[key] = {
        enabled: config.enabled,
        description: config.description,
        source: config.source,
      };
    }
    return result;
  }

  /**
   * Hot reload feature flags from environment
   * Useful for runtime updates without restart
   */
  reload() {
    this.flags = this.loadFlags();
    console.log('[FeatureFlags] ♻️  Flags reloaded from environment');
  }

  /**
   * Disable a specific feature (emergency killswitch)
   * @param {string} featureName - Name of the feature to disable
   */
  disable(featureName) {
    if (this.flags[featureName]) {
      this.flags[featureName].enabled = false;
      console.warn(`[FeatureFlags] ⚠️  Feature disabled: ${featureName}`);
    }
  }

  /**
   * Enable a specific feature
   * @param {string} featureName - Name of the feature to enable
   */
  enable(featureName) {
    if (this.flags[featureName]) {
      this.flags[featureName].enabled = true;
      console.log(`[FeatureFlags] ✅ Feature enabled: ${featureName}`);
    }
  }
}

// Singleton instance
const featureFlags = new FeatureFlags();

// Log startup configuration
console.log('[FeatureFlags] 🚩 Feature flags initialized:');
for (const [key, config] of Object.entries(featureFlags.getAll())) {
  const status = config.enabled ? '✅ ON' : '❌ OFF';
  const source = config.source === 'env' ? '(from env)' : '(default)';
  console.log(`  ${status} ${key} ${source}`);
}

module.exports = featureFlags;

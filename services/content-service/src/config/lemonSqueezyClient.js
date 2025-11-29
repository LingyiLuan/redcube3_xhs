/**
 * ============================================================================
 * Lemon Squeezy Client Configuration
 * Merchant of Record - NO SSN/ITIN/EIN Required!
 * ============================================================================
 *
 * Why Lemon Squeezy:
 * - ✅ No SSN/ITIN required (perfect for US residents without SSN)
 * - ✅ Handles ALL tax compliance (sales tax, VAT, GST worldwide)
 * - ✅ Merchant of Record (they're the legal seller)
 * - ✅ Owned by Stripe (acquired 2024)
 * - ✅ Built for SaaS subscriptions
 * - ✅ 5% + $0.50 per transaction
 *
 * Pricing Configuration:
 * - Free: $0/month (5 analyses, 2 learning maps)
 * - Pro: $9/month or $79/year (15 analyses, 10 learning maps)
 * - Premium: $19/month or $169/year (unlimited)
 */

const { lemonSqueezySetup } = require('@lemonsqueezy/lemonsqueezy.js');
const logger = require('../utils/logger');

// Initialize Lemon Squeezy client (only if API key is provided)
let lsClient = null;

if (process.env.LEMON_SQUEEZY_API_KEY) {
  lsClient = lemonSqueezySetup({
    apiKey: process.env.LEMON_SQUEEZY_API_KEY,
    onError: (error) => {
      logger.error('[LemonSqueezy] API Error:', error);
    },
  });
  logger.info('[LemonSqueezy] ✅ Client initialized');
} else {
  logger.warn('[LemonSqueezy] ⚠️  LEMON_SQUEEZY_API_KEY not set - payment features disabled');
}

/**
 * Lemon Squeezy Configuration
 * Get these from your Lemon Squeezy Dashboard:
 * https://app.lemonsqueezy.com/settings/api
 */
const LS_CONFIG = {
  storeId: process.env.LEMON_SQUEEZY_STORE_ID || 'store_placeholder',

  // Product Variant IDs (from Lemon Squeezy Dashboard)
  variants: {
    pro_monthly: process.env.LS_VARIANT_PRO_MONTHLY || 'variant_pro_monthly_placeholder',
    pro_annual: process.env.LS_VARIANT_PRO_ANNUAL || 'variant_pro_annual_placeholder',
    premium_monthly: process.env.LS_VARIANT_PREMIUM_MONTHLY || 'variant_premium_monthly_placeholder',
    premium_annual: process.env.LS_VARIANT_PREMIUM_ANNUAL || 'variant_premium_annual_placeholder',
  },

  // Webhook secret for signature verification
  webhookSecret: process.env.LEMON_SQUEEZY_WEBHOOK_SECRET || '',
};

/**
 * Pricing metadata (matches database usage_limits)
 */
const PRICING_METADATA = {
  free: {
    tier: 'free',
    price: 0,
    analyses_per_month: 5,
    learning_maps_per_month: 2,
    api_access: false,
    priority_support: false,
  },
  pro_monthly: {
    tier: 'pro',
    price: 9.00,
    billing_interval: 'month',
    variant_id: LS_CONFIG.variants.pro_monthly,
    analyses_per_month: 15,
    learning_maps_per_month: 10,
    api_access: false,
    priority_support: true,
  },
  pro_annual: {
    tier: 'pro',
    price: 79.00,
    monthly_equivalent: 6.58,
    billing_interval: 'year',
    variant_id: LS_CONFIG.variants.pro_annual,
    analyses_per_month: 15,
    learning_maps_per_month: 10,
    api_access: false,
    priority_support: true,
    discount_percent: 26,
  },
  premium_monthly: {
    tier: 'premium',
    price: 19.00,
    billing_interval: 'month',
    variant_id: LS_CONFIG.variants.premium_monthly,
    analyses_per_month: -1, // Unlimited
    learning_maps_per_month: -1,
    api_access: true,
    priority_support: true,
    data_export: true,
  },
  premium_annual: {
    tier: 'premium',
    price: 169.00,
    monthly_equivalent: 14.08,
    billing_interval: 'year',
    variant_id: LS_CONFIG.variants.premium_annual,
    analyses_per_month: -1,
    learning_maps_per_month: -1,
    api_access: true,
    priority_support: true,
    data_export: true,
    discount_percent: 26,
  },
};

/**
 * Helper function to determine tier from variant ID
 */
function getTierFromVariantId(variantId) {
  for (const [key, metadata] of Object.entries(PRICING_METADATA)) {
    if (metadata.variant_id === variantId) {
      return {
        tier: metadata.tier,
        interval: metadata.billing_interval,
      };
    }
  }
  return { tier: 'free', interval: null };
}

/**
 * Verify Lemon Squeezy configuration on startup
 */
function verifyLSConfig() {
  if (!process.env.LEMON_SQUEEZY_API_KEY) {
    logger.warn('[LemonSqueezy] ⚠️  LEMON_SQUEEZY_API_KEY not set');
    return false;
  }

  if (!process.env.LEMON_SQUEEZY_STORE_ID) {
    logger.warn('[LemonSqueezy] ⚠️  LEMON_SQUEEZY_STORE_ID not set');
    return false;
  }

  // Check if variant IDs are configured
  const hasPlaceholders = Object.values(LS_CONFIG.variants).some(id => id.includes('placeholder'));
  if (hasPlaceholders) {
    logger.warn('[LemonSqueezy] ⚠️  Variant IDs not configured - using placeholders');
    logger.warn('[LemonSqueezy] Create products at https://app.lemonsqueezy.com');
  }

  logger.info('[LemonSqueezy] ✅ Configuration validated');
  return true;
}

// Verify on module load
verifyLSConfig();

module.exports = {
  lsClient,
  LS_CONFIG,
  PRICING_METADATA,
  getTierFromVariantId,
  verifyLSConfig,
};

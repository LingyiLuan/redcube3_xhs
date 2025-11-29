/**
 * ============================================================================
 * Stripe Client Configuration
 * Pattern: Stripe SDK Integration (Industry Standard for SaaS Billing)
 * ============================================================================
 *
 * Companies using Stripe:
 * - Slack, Notion, Linear, Vercel, OpenAI, Figma, Shopify
 * - 58% of SaaS platforms with $5M+ ARR
 *
 * Pricing Configuration:
 * - Free: $0/month (5 analyses, 2 learning maps)
 * - Pro: $9/month or $79/year (15 analyses, 10 learning maps)
 * - Premium: $19/month or $169/year (unlimited)
 */

const Stripe = require('stripe');
const logger = require('../utils/logger');

// Initialize Stripe client (only if API key is provided)
let stripe = null;

if (process.env.STRIPE_SECRET_KEY) {
  stripe = Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2024-11-20.acacia', // Latest stable version
    appInfo: {
      name: 'Interview Intel',
      version: '1.0.0',
      url: 'https://interview-intel.com'
    },
    telemetry: false // Disable telemetry for privacy
  });
} else {
  logger.warn('[Stripe] ⚠️  STRIPE_SECRET_KEY not set - payment features disabled');
}

/**
 * Stripe Price IDs (configured in Stripe Dashboard)
 * IMPORTANT: Update these after creating products in Stripe Dashboard
 */
const STRIPE_PRICE_IDS = {
  // Pro tier
  pro_monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly_placeholder',
  pro_annual: process.env.STRIPE_PRICE_PRO_ANNUAL || 'price_pro_annual_placeholder',

  // Premium tier
  premium_monthly: process.env.STRIPE_PRICE_PREMIUM_MONTHLY || 'price_premium_monthly_placeholder',
  premium_annual: process.env.STRIPE_PRICE_PREMIUM_ANNUAL || 'price_premium_annual_placeholder',
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
    stripe_price_id: STRIPE_PRICE_IDS.pro_monthly,
    analyses_per_month: 15,
    learning_maps_per_month: 10,
    api_access: false,
    priority_support: true,
  },
  pro_annual: {
    tier: 'pro',
    price: 79.00, // Save 26% vs monthly
    monthly_equivalent: 6.58,
    billing_interval: 'year',
    stripe_price_id: STRIPE_PRICE_IDS.pro_annual,
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
    stripe_price_id: STRIPE_PRICE_IDS.premium_monthly,
    analyses_per_month: -1, // Unlimited
    learning_maps_per_month: -1,
    api_access: true,
    priority_support: true,
    data_export: true,
  },
  premium_annual: {
    tier: 'premium',
    price: 169.00, // Save 26% vs monthly
    monthly_equivalent: 14.08,
    billing_interval: 'year',
    stripe_price_id: STRIPE_PRICE_IDS.premium_annual,
    analyses_per_month: -1,
    learning_maps_per_month: -1,
    api_access: true,
    priority_support: true,
    data_export: true,
    discount_percent: 26,
  },
};

/**
 * Stripe webhook secret for signature verification
 */
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

/**
 * Verify Stripe configuration on startup
 */
function verifyStripeConfig() {
  if (!process.env.STRIPE_SECRET_KEY) {
    logger.warn('[Stripe] ⚠️  STRIPE_SECRET_KEY not set - payment features disabled');
    return false;
  }

  if (process.env.STRIPE_SECRET_KEY.startsWith('sk_test_')) {
    logger.info('[Stripe] 🧪 Running in TEST mode');
  } else if (process.env.STRIPE_SECRET_KEY.startsWith('sk_live_')) {
    logger.info('[Stripe] 🚀 Running in LIVE mode');
  } else {
    logger.error('[Stripe] ❌ Invalid STRIPE_SECRET_KEY format');
    return false;
  }

  // Check if price IDs are configured
  const hasPlaceholders = Object.values(STRIPE_PRICE_IDS).some(id => id.includes('placeholder'));
  if (hasPlaceholders) {
    logger.warn('[Stripe] ⚠️  Price IDs not configured - using placeholders');
    logger.warn('[Stripe] Create products in Stripe Dashboard and update environment variables');
  }

  logger.info('[Stripe] ✅ Stripe client initialized');
  return true;
}

// Verify on module load
verifyStripeConfig();

module.exports = {
  stripe,
  STRIPE_PRICE_IDS,
  PRICING_METADATA,
  STRIPE_WEBHOOK_SECRET,
  verifyStripeConfig,
};

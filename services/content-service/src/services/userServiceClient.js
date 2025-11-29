/**
 * User Service Client
 * Handles communication with user-service for payment-related operations
 * Pattern: Direct HTTP calls (bypass nginx for internal communication)
 */

const logger = require('../utils/logger');

class UserServiceClient {
  constructor() {
    // Use Docker service name for DNS resolution
    this.baseUrl = process.env.USER_SERVICE_URL || 'http://user-service:3001';
    this.timeout = 5000;
    this.serviceName = 'content-service';
  }

  /**
   * Create or update subscription in user-service
   */
  async upsertSubscription(subscriptionData) {
    const requestId = this._generateRequestId();

    try {
      logger.info('[UserServiceClient] Upserting subscription', {
        requestId,
        userId: subscriptionData.userId,
        subscriptionId: subscriptionData.lsSubscriptionId
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/internal/subscriptions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Call': 'true',
          'X-Service-Name': this.serviceName,
          'X-Request-ID': requestId,
          'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_SECRET || 'dev-secret'}`
        },
        body: JSON.stringify(subscriptionData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`User service responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      logger.info('[UserServiceClient] Subscription upserted successfully', {
        requestId,
        userId: subscriptionData.userId
      });

      return result;
    } catch (error) {
      logger.error('[UserServiceClient] Failed to upsert subscription', {
        requestId,
        userId: subscriptionData.userId,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  /**
   * Update user's subscription tier
   */
  async updateUserTier(userId, tier) {
    const requestId = this._generateRequestId();

    try {
      logger.info('[UserServiceClient] Updating user tier', {
        requestId,
        userId,
        tier
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/internal/users/${userId}/tier`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Call': 'true',
          'X-Service-Name': this.serviceName,
          'X-Request-ID': requestId,
          'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_SECRET || 'dev-secret'}`
        },
        body: JSON.stringify({ tier }),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`User service responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      logger.info('[UserServiceClient] User tier updated successfully', {
        requestId,
        userId,
        tier
      });

      return result;
    } catch (error) {
      logger.error('[UserServiceClient] Failed to update user tier', {
        requestId,
        userId,
        tier,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Record payment transaction
   */
  async recordPaymentTransaction(transactionData) {
    const requestId = this._generateRequestId();

    try {
      logger.info('[UserServiceClient] Recording payment transaction', {
        requestId,
        userId: transactionData.userId,
        amount: transactionData.amountCents
      });

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/internal/payment-transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Internal-Call': 'true',
          'X-Service-Name': this.serviceName,
          'X-Request-ID': requestId,
          'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_SECRET || 'dev-secret'}`
        },
        body: JSON.stringify(transactionData),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`User service responded with ${response.status}: ${errorText}`);
      }

      const result = await response.json();

      logger.info('[UserServiceClient] Payment transaction recorded', {
        requestId,
        userId: transactionData.userId
      });

      return result;
    } catch (error) {
      logger.error('[UserServiceClient] Failed to record payment transaction', {
        requestId,
        userId: transactionData.userId,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Get user by ID
   */
  async getUser(userId) {
    const requestId = this._generateRequestId();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(`${this.baseUrl}/api/internal/users/${userId}`, {
        method: 'GET',
        headers: {
          'X-Internal-Call': 'true',
          'X-Service-Name': this.serviceName,
          'X-Request-ID': requestId,
          'Authorization': `Bearer ${process.env.INTERNAL_SERVICE_SECRET || 'dev-secret'}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`User service responded with ${response.status}: ${errorText}`);
      }

      return await response.json();
    } catch (error) {
      logger.error('[UserServiceClient] Failed to get user', {
        requestId,
        userId,
        error: error.message
      });
      throw error;
    }
  }

  _generateRequestId() {
    return `${this.serviceName}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = new UserServiceClient();

const axios = require('axios');
const logger = require('../utils/logger');

/**
 * Discord service for scraping tech interview discussions
 * Uses Discord Bot API (REST) to fetch messages from tech career servers
 *
 * Required Environment Variables:
 * - DISCORD_BOT_TOKEN: Your Discord bot token
 * - DISCORD_SERVER_IDS: Comma-separated list of server IDs to scrape
 */

const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_SERVER_IDS = process.env.DISCORD_SERVER_IDS ?
  process.env.DISCORD_SERVER_IDS.split(',').map(id => id.trim()) : [];

// Discord API base URL
const DISCORD_API = 'https://discord.com/api/v10';

/**
 * Fetch messages from a Discord channel
 * @param {string} channelId - Discord channel ID
 * @param {number} limit - Number of messages to fetch (max 100 per request)
 * @returns {Promise<Array>} Array of messages
 */
async function fetchChannelMessages(channelId, limit = 100) {
  try {
    const response = await axios.get(
      `${DISCORD_API}/channels/${channelId}/messages`,
      {
        params: { limit: Math.min(limit, 100) },
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    return response.data;
  } catch (error) {
    if (error.response?.status === 401) {
      logger.error('[Discord Service] ❌ Invalid bot token');
    } else if (error.response?.status === 403) {
      logger.warn(`[Discord Service] ⚠️ Bot lacks permission for channel: ${channelId}`);
    } else if (error.response?.status === 429) {
      logger.warn('[Discord Service] ⚠️ Rate limited by Discord API');
    } else {
      logger.error('[Discord Service] ❌ Failed to fetch messages:', error.message);
    }
    return [];
  }
}

/**
 * Get all text channels from a Discord server
 * @param {string} serverId - Discord server (guild) ID
 * @returns {Promise<Array>} Array of channel objects
 */
async function getServerChannels(serverId) {
  try {
    const response = await axios.get(
      `${DISCORD_API}/guilds/${serverId}/channels`,
      {
        headers: {
          'Authorization': `Bot ${DISCORD_BOT_TOKEN}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    );

    // Filter for text channels only (type 0 = GUILD_TEXT)
    // Focus on channels likely to have interview content
    const relevantChannels = response.data.filter(channel => {
      if (channel.type !== 0) return false; // Not a text channel

      const name = channel.name.toLowerCase();
      return (
        name.includes('interview') ||
        name.includes('career') ||
        name.includes('job') ||
        name.includes('experience') ||
        name.includes('offer') ||
        name.includes('technical') ||
        name.includes('coding') ||
        name.includes('general') // General channels often have interview discussion
      );
    });

    return relevantChannels;
  } catch (error) {
    if (error.response?.status === 403) {
      logger.error(`[Discord Service] ❌ Bot not in server ${serverId} or lacks permission`);
    } else {
      logger.error(`[Discord Service] ❌ Failed to get channels for server ${serverId}:`, error.message);
    }
    return [];
  }
}

/**
 * Check if a message is interview-related
 * @param {Object} message - Discord message object
 * @returns {boolean} True if interview-related
 */
function isInterviewRelated(message) {
  if (!message.content || message.content.length < 50) {
    return false; // Too short to be meaningful
  }

  const content = message.content.toLowerCase();

  // Interview-related keywords
  const interviewKeywords = [
    'interview', 'interviewed', 'interviewing',
    'onsite', 'phone screen', 'technical round',
    'coding challenge', 'system design',
    'behavioral', 'hr round', 'final round',
    'offer', 'rejected', 'accepted',
    'leetcode', 'hackerrank', 'codesignal',
    'got an offer', 'failed the', 'passed the',
    'interview experience', 'interview process'
  ];

  // Major tech companies
  const companyKeywords = [
    'google', 'amazon', 'meta', 'facebook', 'apple', 'microsoft',
    'netflix', 'uber', 'airbnb', 'stripe', 'twitter', 'linkedin',
    'salesforce', 'oracle', 'adobe', 'nvidia', 'intel', 'qualcomm'
  ];

  const hasInterviewKeyword = interviewKeywords.some(keyword => content.includes(keyword));
  const hasCompanyKeyword = companyKeywords.some(keyword => content.includes(keyword));

  // Must have interview keyword AND (company keyword OR be long enough to be substantive)
  return hasInterviewKeyword && (hasCompanyKeyword || content.length > 150);
}

/**
 * Transform Discord message to standard post format
 * @param {Object} message - Discord message object
 * @param {string} channelName - Channel name
 * @param {string} serverId - Server ID
 * @returns {Object} Standardized post object
 */
function transformDiscordMessage(message, channelName = 'unknown', serverId = 'unknown') {
  // Extract title (first line or first 100 chars)
  const lines = message.content.split('\n');
  const title = lines[0].substring(0, 100) || message.content.substring(0, 100);

  return {
    postId: `discord_${message.id}`,
    title: title,
    bodyText: message.content,
    author: message.author?.username || 'unknown',
    createdAt: new Date(message.timestamp),
    url: `https://discord.com/channels/${serverId}/${message.channel_id}/${message.id}`,
    source: 'discord',
    metadata: {
      channelName: channelName,
      serverId: serverId,
      reactions: message.reactions || [],
      hasAttachments: (message.attachments || []).length > 0,
    }
  };
}

/**
 * Scrape interview discussions from Discord servers
 * @param {Object} options - Scraping options
 * @param {string} options.query - Search query (not used with bot API)
 * @param {number} options.numberOfPosts - Target number of posts to fetch
 * @returns {Promise<Array>} Array of scraped posts
 */
async function scrapeInterviewData({
  query = 'tech interview experience',
  numberOfPosts = 400,
} = {}) {
  try {
    logger.info(`[Discord Service] 🎮 Starting Discord scraping: target ${numberOfPosts} posts`);

    // Check if Discord bot is configured
    if (!DISCORD_BOT_TOKEN) {
      logger.warn('[Discord Service] ⚠️ DISCORD_BOT_TOKEN not set in .env');
      logger.info('[Discord Service] 💡 To enable Discord scraping:');
      logger.info('[Discord Service]    1. Create bot at https://discord.com/developers/applications');
      logger.info('[Discord Service]    2. Add DISCORD_BOT_TOKEN=your_token to .env');
      logger.info('[Discord Service]    3. Invite bot to servers with "Read Message History" permission');
      return [];
    }

    if (DISCORD_SERVER_IDS.length === 0) {
      logger.warn('[Discord Service] ⚠️ DISCORD_SERVER_IDS not set in .env');
      logger.info('[Discord Service] 💡 Add DISCORD_SERVER_IDS=server_id_1,server_id_2 to .env');
      logger.info('[Discord Service] 💡 Recommended servers: CS Career Hackers, Tech Career Growth, etc.');
      return [];
    }

    const allPosts = [];
    const messagesPerServer = Math.ceil(numberOfPosts / DISCORD_SERVER_IDS.length);

    logger.info(`[Discord Service] 📊 Scraping ${DISCORD_SERVER_IDS.length} servers (~${messagesPerServer} posts each)`);

    for (const serverId of DISCORD_SERVER_IDS) {
      logger.info(`[Discord Service] 🔍 Fetching channels from server: ${serverId}`);

      const channels = await getServerChannels(serverId);

      if (channels.length === 0) {
        logger.warn(`[Discord Service] ⚠️ No accessible channels in server ${serverId}`);
        continue;
      }

      logger.info(`[Discord Service] 📁 Found ${channels.length} relevant channels`);

      const messagesPerChannel = Math.ceil(messagesPerServer / Math.max(channels.length, 1));

      for (const channel of channels) {
        logger.info(`[Discord Service] 💬 Fetching from #${channel.name} (up to ${messagesPerChannel} messages)`);

        const messages = await fetchChannelMessages(channel.id, messagesPerChannel);

        if (messages.length === 0) {
          continue;
        }

        // Filter for interview-related messages
        const relevantMessages = messages.filter(isInterviewRelated);

        logger.info(`[Discord Service] ✅ Found ${relevantMessages.length}/${messages.length} interview-related in #${channel.name}`);

        // Transform to standard format
        const transformedPosts = relevantMessages.map(msg =>
          transformDiscordMessage(msg, channel.name, serverId)
        );

        allPosts.push(...transformedPosts);

        // Stop if we've reached target
        if (allPosts.length >= numberOfPosts) break;

        // Rate limiting: small delay between channels
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      if (allPosts.length >= numberOfPosts) break;

      // Rate limiting: delay between servers
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    logger.info(`[Discord Service] 🎉 Scraping complete: ${allPosts.length} posts collected`);
    return allPosts.slice(0, numberOfPosts);

  } catch (error) {
    logger.error('[Discord Service] ❌ Scraping failed:', error.message);
    return [];
  }
}

module.exports = {
  scrapeInterviewData,
  transformDiscordMessage,
};

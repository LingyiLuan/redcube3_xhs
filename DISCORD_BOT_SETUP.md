# Discord Bot Setup Guide

This guide will help you set up Discord scraping for your interview data collection platform.

## 📋 Overview

The Discord bot scrapes interview discussions from tech career Discord servers using Discord's official REST API. It targets 400 posts/hour from multiple servers.

## 🚀 Step 1: Create Discord Bot

### 1.1 Go to Discord Developer Portal
Visit: https://discord.com/developers/applications

### 1.2 Create New Application
1. Click **"New Application"** button
2. Name it: `Interview Scraper Bot` (or any name you prefer)
3. Click **"Create"**

### 1.3 Create Bot User
1. Go to **"Bot"** tab in left sidebar
2. Click **"Add Bot"**
3. Confirm by clicking **"Yes, do it!"**

### 1.4 Get Bot Token
1. Under **"TOKEN"** section, click **"Copy"**
2. **IMPORTANT:** Save this token securely - you'll need it for `.env`
3. Token looks like: `MTk4NjIyNDgzNDc4NTI4MDU2.GkV9Zx.a1b2c3d4e5f6g7h8i9j0...`

### 1.5 Configure Bot Permissions
1. Scroll down to **"Privileged Gateway Intents"**
2. Enable:
   - ✅ **MESSAGE CONTENT INTENT** (required to read message text)
   - ✅ **SERVER MEMBERS INTENT** (optional, helps with metadata)

### 1.6 Generate Invite URL
1. Go to **"OAuth2" → "URL Generator"** tab
2. Select scopes:
   - ✅ `bot`
3. Select bot permissions:
   - ✅ **Read Messages/View Channels**
   - ✅ **Read Message History**
4. Copy the generated URL at the bottom

## 🎯 Step 2: Join Tech Career Discord Servers

### Recommended Servers:

1. **CS Career Hackers**
   - Link: https://discord.gg/cscareers (or search on Google)
   - Members: 100K+
   - Channels: #interview-experiences, #job-search, #career-advice

2. **Tech Career Growth**
   - Search for "Tech Career Growth Discord" on Google
   - Channels: #interviews, #offers, #career-discussions

3. **Blind Community Discord**
   - Public Discord for anonymous tech career discussions
   - Channels: #tech-interviews, #compensation

4. **Your Local University CS Discord**
   - Often have interview prep channels
   - High-quality personal experiences

### How to Join:
1. Click invite links or find them via Google/Reddit
2. Join as your personal Discord account first
3. Note down the **Server ID** for each server

## 🔑 Step 3: Get Server IDs

### Method 1: Enable Developer Mode
1. Open Discord app
2. Go to **User Settings** (gear icon)
3. **Advanced** → Enable **Developer Mode**
4. Right-click any server icon → **Copy Server ID**

### Method 2: From URL
When you're in a Discord server, the URL looks like:
```
https://discord.com/channels/123456789012345678/...
                               ^^^^^^^^^^^^^^^^^
                               This is Server ID
```

### Example Server IDs:
```
CS Career Hackers: 1234567890123456
Tech Career Growth: 2345678901234567
Blind Community: 3456789012345678
```

## 🤖 Step 4: Invite Bot to Servers

### 4.1 Use Generated Invite URL
1. Copy the invite URL from Step 1.6
2. Replace `CLIENT_ID` with your Application ID (from "General Information" tab)
3. Example URL:
```
https://discord.com/api/oauth2/authorize?client_id=YOUR_APP_ID&permissions=66560&scope=bot
```

### 4.2 Authorize Bot
1. Open URL in browser
2. Select which server to add bot to
3. Click **"Authorize"**
4. Complete CAPTCHA if prompted

### 4.3 Verify Bot Joined
- Go to server
- Bot should appear in member list with a BOT tag
- Bot will appear offline (that's normal - it uses REST API, not WebSocket)

## ⚙️ Step 5: Configure Environment Variables

### 5.1 Edit `.env` File
```bash
cd /Users/luan02/Desktop/redcube3_xhs
nano .env  # or use any text editor
```

### 5.2 Add Discord Configuration
```env
# Discord Bot Configuration
DISCORD_BOT_TOKEN=MTk4NjIyNDgzNDc4NTI4MDU2.GkV9Zx.your_actual_token_here
DISCORD_SERVER_IDS=1234567890123456,2345678901234567,3456789012345678
```

**Format:**
- `DISCORD_BOT_TOKEN`: Your bot token from Step 1.4
- `DISCORD_SERVER_IDS`: Comma-separated server IDs (no spaces)

### 5.3 Example Configuration
```env
DISCORD_BOT_TOKEN=MTk4NjIyNDgzNDc4NTI4MDU2.GkV9Zx.abcdefghijklmnopqrstuvwxyz1234567890
DISCORD_SERVER_IDS=864834672569622559,921234567890123456,987654321098765432
```

## 🔄 Step 6: Restart Services

```bash
cd /Users/luan02/Desktop/redcube3_xhs

# Restart content-service to pick up new env variables
docker-compose restart content-service

# Check logs to verify Discord is working
docker logs redcube3_xhs-content-service-1 | grep -i discord
```

### Expected Output (Success):
```
[Discord Service] 🎮 Starting Discord scraping: target 400 posts
[Discord Service] 📊 Scraping 3 servers (~133 posts each)
[Discord Service] 🔍 Fetching channels from server: 864834672569622559
[Discord Service] 📁 Found 4 relevant channels
[Discord Service] 💬 Fetching from #interview-experiences (up to 33 messages)
[Discord Service] ✅ Found 12/33 interview-related in #interview-experiences
[Discord Service] 🎉 Scraping complete: 45 posts collected
```

### Expected Output (Not Configured):
```
[Discord Service] ⚠️ DISCORD_BOT_TOKEN not set in .env
[Discord Service] 💡 To enable Discord scraping:
[Discord Service]    1. Create bot at https://discord.com/developers/applications
[Discord Service]    2. Add DISCORD_BOT_TOKEN=your_token to .env
```

## 🧪 Step 7: Test Discord Scraping

### Manual Test:
```bash
# Trigger manual scrape (will hit all sources including Discord)
curl -X POST http://localhost:8080/api/content/agent/trigger-scraping
```

### Check Results:
```bash
# View stats by source
curl http://localhost:8080/api/content/agent/stats

# Should show Discord posts
{
  "discord": {
    "count": 45,
    "percentage": "7.4%"
  }
}
```

## 📊 Current Configuration

**Post Allocation (per hour):**
- Reddit: 400 posts (4 subreddits × 100 each)
- Hacker News: 50 posts
- **Discord: 400 posts** (distributed across your servers)

**Scraping Schedule:**
- Frequency: Every hour
- Mode: Parallel (all sources at once)
- Estimated time: 2-3 minutes per run

## ⚠️ Troubleshooting

### Bot Token Invalid
```
[Discord Service] ❌ Invalid bot token
```
**Fix:** Regenerate token in Discord Developer Portal

### Bot Lacks Permission
```
[Discord Service] ❌ Bot not in server 123456 or lacks permission
```
**Fix:**
1. Verify bot was invited to server
2. Check bot has "Read Message History" permission

### Rate Limiting
```
[Discord Service] ⚠️ Rate limited by Discord API
```
**Fix:** This is normal - the service has built-in delays (500ms between channels)

### No Interview Content Found
```
[Discord Service] ✅ Found 0/50 interview-related in #general
```
**Fix:**
1. Make sure you're in servers with active interview discussion
2. The filter requires messages with interview keywords + company names

## 🎯 Best Practices

### 1. Choose Active Servers
- Look for servers with 10K+ members
- Check that #interview or #career channels have recent activity

### 2. Respect Discord ToS
- Only scrape servers you have legitimate access to
- Use bot token (not user token)
- Built-in rate limiting prevents abuse

### 3. Monitor Quality
After 24 hours, check relevance:
```sql
SELECT
  source,
  is_relevant,
  COUNT(*) as count
FROM scraped_posts
WHERE source = 'discord'
GROUP BY source, is_relevant;
```

### 4. Add More Servers Over Time
Start with 2-3 servers, then expand:
```env
DISCORD_SERVER_IDS=server1,server2,server3,server4,server5
```

## 📚 Resources

- **Discord Developer Docs:** https://discord.com/developers/docs/
- **Discord API Rate Limits:** https://discord.com/developers/docs/topics/rate-limits
- **Find Discord Servers:**
  - https://disboard.org/servers/tag/programming
  - Reddit: r/cscareerquestions sidebar
  - Google: "tech career discord server"

## ✅ Success Checklist

- [ ] Discord bot created
- [ ] Bot token saved securely
- [ ] MESSAGE CONTENT INTENT enabled
- [ ] Bot invited to 2+ tech career servers
- [ ] Server IDs collected
- [ ] `.env` file updated with token and server IDs
- [ ] Content-service restarted
- [ ] Logs show Discord scraping working
- [ ] Database receiving Discord posts

---

**Status:** Once configured, Discord will automatically scrape 400 posts/hour in parallel with Reddit and Hacker News!

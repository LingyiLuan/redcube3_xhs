/**
 * Utility functions for data formatting and processing
 */

/**
 * Get sentiment class name for CSS styling
 */
export const getSentimentClass = (sentiment) => {
  switch (sentiment) {
    case 'positive': return 'sentiment-positive';
    case 'negative': return 'sentiment-negative';
    default: return 'sentiment-neutral';
  }
};

/**
 * Get localized sentiment text
 */
export const getSentimentText = (sentiment) => {
  switch (sentiment) {
    case 'positive': return '积极';
    case 'negative': return '消极';
    default: return '中性';
  }
};

/**
 * Get connection type display text with icons
 */
export const getConnectionTypeDisplay = (type) => {
  const types = {
    'same_company': '🏢 同公司',
    'similar_role': '👨‍💻 相似职位',
    'topic_overlap': '📝 话题重叠',
    'same_industry': '🏭 同行业',
    'career_progression': '📈 职业发展'
  };
  return types[type] || type;
};

/**
 * Format date to Chinese locale
 */
export const formatDate = (dateString) => {
  try {
    return new Date(dateString).toLocaleDateString('zh-CN');
  } catch (error) {
    return dateString;
  }
};

/**
 * Truncate text to specified length
 */
export const truncateText = (text, maxLength = 150) => {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Generate unique ID for posts
 */
export const generatePostId = (prefix = 'post') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Validate post text
 */
export const validatePostText = (text) => {
  if (!text) return { isValid: false, message: '请输入内容' };
  if (text.trim().length < 10) return { isValid: false, message: '内容至少需要10个字符' };
  if (text.length > 10000) return { isValid: false, message: '内容不能超过10000个字符' };
  return { isValid: true, message: '' };
};

/**
 * Calculate percentage and round to integer
 */
export const calculatePercentage = (value, total) => {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * Get error message from API error
 */
export const getErrorMessage = (error) => {
  return error.response?.data?.error ||
         error.response?.data?.message ||
         error.message ||
         '操作失败，请稍后重试';
};

/**
 * Sample XHS posts for testing
 */
export const samplePosts = [
  "刚刚结束了字节跳动的面试，三轮技术面试真的很有挑战性！第一轮主要考算法题，做了两道中等难度的动态规划，面试官人很nice。第二轮是系统设计，让我设计一个类似小红书的推荐系统，需要考虑并发和缓存。第三轮面的是项目经验，深入聊了我之前做的微服务架构项目。总的来说感觉良好，面试官们都很专业，希望能收到好消息！💪",
  "腾讯产品经理面试复盘来啦！整个流程包括简历筛选、笔试、三轮面试。笔试主要考产品思维和数据分析，有几道关于微信功能优化的题目。面试分为产品思维面、案例分析面、和HR面。印象最深的是让我分析一个新的社交产品如何在竞争激烈的市场中脱颖而出。准备了很久的竞品分析和用户画像派上了用场！面试官问得很细，对行业理解要求挺高的。",
  "分享一下我的阿里云实习面试经验。作为一个大三学生，这是我第一次参加大厂面试，说不紧张是假的😅。一面主要考基础知识，Java集合、多线程、JVM这些都有涉及。二面更多聊项目，面试官对我GitHub上的开源项目很感兴趣，问了很多实现细节。三面是交叉面，一个其他团队的senior来面，主要看综合能力和学习能力。整体感觉阿里的技术氛围真的很棒，学到了很多！"
];
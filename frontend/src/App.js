import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './index.css';

function App() {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  // Sample XHS posts for testing
  const samplePosts = [
    "刚刚结束了字节跳动的面试，三轮技术面试真的很有挑战性！第一轮主要考算法题，做了两道中等难度的动态规划，面试官人很nice。第二轮是系统设计，让我设计一个类似小红书的推荐系统，需要考虑并发和缓存。第三轮面的是项目经验，深入聊了我之前做的微服务架构项目。总的来说感觉良好，面试官们都很专业，希望能收到好消息！💪",
    "腾讯产品经理面试复盘来啦！整个流程包括简历筛选、笔试、三轮面试。笔试主要考产品思维和数据分析，有几道关于微信功能优化的题目。面试分为产品思维面、案例分析面、和HR面。印象最深的是让我分析一个新的社交产品如何在竞争激烈的市场中脱颖而出。准备了很久的竞品分析和用户画像派上了用场！面试官问得很细，对行业理解要求挺高的。",
    "分享一下我的阿里云实习面试经验。作为一个大三学生，这是我第一次参加大厂面试，说不紧张是假的😅。一面主要考基础知识，Java集合、多线程、JVM这些都有涉及。二面更多聊项目，面试官对我GitHub上的开源项目很感兴趣，问了很多实现细节。三面是交叉面，一个其他团队的senior来面，主要看综合能力和学习能力。整体感觉阿里的技术氛围真的很棒，学到了很多！"
  ];

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await axios.get('/api/content/history?limit=5');
      setHistory(response.data);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const handleAnalyze = async () => {
    if (!text.trim()) {
      setError('请输入要分析的内容');
      return;
    }

    setLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const response = await axios.post('/api/content/analyze', {
        text: text.trim(),
        userId: 1 // Mock user ID for MVP
      });

      setAnalysis(response.data);
      fetchHistory(); // Refresh history after new analysis
    } catch (error) {
      console.error('Analysis error:', error);
      setError(
        error.response?.data?.error ||
        error.response?.data?.message ||
        '分析失败，请稍后重试'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSamplePost = (sampleText) => {
    setText(sampleText);
  };

  const getSentimentClass = (sentiment) => {
    switch (sentiment) {
      case 'positive': return 'sentiment-positive';
      case 'negative': return 'sentiment-negative';
      default: return 'sentiment-neutral';
    }
  };

  const getSentimentText = (sentiment) => {
    switch (sentiment) {
      case 'positive': return '积极';
      case 'negative': return '消极';
      default: return '中性';
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>RedCube XHS 内容分析平台</h1>
        <p>智能分析小红书面试经验分享，提取关键信息和见解</p>
      </header>

      <div className="analysis-form">
        <div className="form-group">
          <label htmlFor="content">粘贴或输入小红书面试经验分享内容:</label>
          <textarea
            id="content"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="例如：刚刚结束了字节跳动的面试，三轮技术面试真的很有挑战性..."
            maxLength="10000"
          />
          <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '5px' }}>
            {text.length}/10000 字符
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label>或者使用示例内容:</label>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
            {samplePosts.map((sample, index) => (
              <button
                key={index}
                onClick={() => handleSamplePost(sample)}
                style={{
                  padding: '8px 15px',
                  background: '#f1f3f4',
                  border: '1px solid #dadce0',
                  borderRadius: '20px',
                  cursor: 'pointer',
                  fontSize: '0.9rem'
                }}
              >
                示例 {index + 1}
              </button>
            ))}
          </div>
        </div>

        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
        >
          {loading ? '分析中...' : '开始分析'}
        </button>
      </div>

      {loading && (
        <div className="loading">
          <div className="loading-spinner"></div>
          正在使用 AI 分析内容，请稍候...
        </div>
      )}

      {error && (
        <div className="error">
          错误: {error}
        </div>
      )}

      {analysis && (
        <div className="results">
          <h2>分析结果</h2>

          <div className="result-grid">
            <div className="result-card">
              <h3>公司</h3>
              <div className="value">{analysis.company || '未识别'}</div>
            </div>

            <div className="result-card">
              <h3>职位</h3>
              <div className="value">{analysis.role || '未识别'}</div>
            </div>

            <div className="result-card">
              <h3>行业</h3>
              <div className="value">{analysis.industry || '未识别'}</div>
            </div>

            <div className="result-card">
              <h3>经验水平</h3>
              <div className="value">{analysis.experience_level || '未识别'}</div>
            </div>

            <div className="result-card">
              <h3>情感倾向</h3>
              <div className={`value ${getSentimentClass(analysis.sentiment)}`}>
                {getSentimentText(analysis.sentiment)}
              </div>
            </div>
          </div>

          {analysis.interview_topics && analysis.interview_topics.length > 0 && (
            <div className="result-card" style={{ marginBottom: '20px' }}>
              <h3>面试话题</h3>
              <div className="tags-container">
                {analysis.interview_topics.map((topic, index) => (
                  <span key={index} className="tag">{topic}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.preparation_materials && analysis.preparation_materials.length > 0 && (
            <div className="result-card" style={{ marginBottom: '20px' }}>
              <h3>准备材料</h3>
              <div className="tags-container">
                {analysis.preparation_materials.map((material, index) => (
                  <span key={index} className="tag" style={{ background: '#28a745' }}>{material}</span>
                ))}
              </div>
            </div>
          )}

          {analysis.key_insights && analysis.key_insights.length > 0 && (
            <div className="result-card">
              <h3>关键见解</h3>
              <ul className="insights-list">
                {analysis.key_insights.map((insight, index) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {history.length > 0 && (
        <div className="history-section">
          <h2>最近分析记录</h2>
          {history.map((item, index) => (
            <div key={index} className="history-item">
              <div className="history-text">
                "{item.original_text.substring(0, 100)}..."
              </div>
              <div className="history-summary">
                {item.company && <span>🏢 {item.company}</span>}
                {item.role && <span>👨‍💻 {item.role}</span>}
                {item.sentiment && (
                  <span className={getSentimentClass(item.sentiment)}>
                    😊 {getSentimentText(item.sentiment)}
                  </span>
                )}
                <span>📅 {new Date(item.created_at).toLocaleDateString('zh-CN')}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default App;
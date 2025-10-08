import React from 'react';
import { useTrends } from '../hooks/useData';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import MarketActivityChart from '../components/charts/MarketActivityChart';
import TrendingSkillsChart from '../components/charts/TrendingSkillsChart';
import CompanyOpportunityChart from '../components/charts/CompanyOpportunityChart';

/**
 * Trends analysis page component
 */
const TrendsPage = () => {
  const { trends, loading, error } = useTrends();

  if (loading) {
    return <LoadingSpinner message="加载趋势数据中..." />;
  }

  if (error) {
    return <ErrorMessage error={error} />;
  }

  if (!trends) {
    return <div className="trends-analysis">暂无趋势数据</div>;
  }

  return (
    <div className="trends-analysis">
      <TrendsOverview trends={trends} />

      {/* Interactive Charts Section */}
      <div className="charts-section">
        <h2 className="section-title">📊 数据可视化</h2>
        <div className="charts-grid">
          <div className="chart-card">
            <MarketActivityChart trendsData={trends} />
          </div>
          <div className="chart-card">
            <TrendingSkillsChart trendsData={trends} />
          </div>
          <div className="chart-card full-width">
            <CompanyOpportunityChart trendsData={trends} />
          </div>
        </div>
      </div>

      <CompaniesSection companies={trends.topCompanies} />
      <TopicsSection topics={trends.topTopics} />
      <TrendsInsights insights={trends.trending_insights} />
      <MarketSignalsSection signals={trends.market_signals} />
      <RecommendationsSection recommendations={trends.recommended_focuses} />
    </div>
  );
};

/**
 * Trends overview component with stats
 */
const TrendsOverview = ({ trends }) => (
  <div className="trends-overview">
    <h3>📈 分析概览</h3>
    <div className="stats-grid">
      <div className="stat-card">
        <div className="stat-number">{trends.totalAnalyses}</div>
        <div className="stat-label">总分析数量</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{trends.topCompanies?.length || 0}</div>
        <div className="stat-label">活跃公司</div>
      </div>
      <div className="stat-card">
        <div className="stat-number">{trends.topTopics?.length || 0}</div>
        <div className="stat-label">热门话题</div>
      </div>
    </div>
  </div>
);

/**
 * Trends insights component
 */
const TrendsInsights = ({ insights }) => {
  if (!insights || insights.length === 0) return null;

  return (
    <div className="trends-insights">
      <h3>💡 趋势洞察</h3>
      {insights.map((insight, index) => (
        <div key={index} className={`insight-card ${insight.category}`}>
          <div className="insight-message">{insight.message}</div>
          <div className="insight-confidence">置信度: {Math.round(insight.confidence * 100)}%</div>
        </div>
      ))}
    </div>
  );
};

/**
 * Companies section component
 */
const CompaniesSection = ({ companies }) => {
  if (!companies || companies.length === 0) return null;

  return (
    <div className="companies-section">
      <h3>🏢 热门公司</h3>
      <div className="companies-grid">
        {companies.slice(0, 6).map((company, index) => (
          <div key={index} className="company-card">
            <div className="company-name">{company.company}</div>
            <div className="company-stats">
              <div className="mention-count">{company.mention_count} 次提及</div>
              <div className="sentiment-score">
                情感: {(company.avg_sentiment * 100).toFixed(0)}%
              </div>
            </div>
            {company.roles_mentioned && (
              <div className="roles-mentioned">
                岗位: {company.roles_mentioned.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Topics section component
 */
const TopicsSection = ({ topics }) => {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="topics-section">
      <h3>🎯 热门话题</h3>
      <div className="topics-grid">
        {topics.slice(0, 10).map((topic, index) => (
          <div key={index} className="topic-card">
            <div className="topic-name">{topic.topic}</div>
            <div className="topic-stats">
              <div className="frequency">{topic.frequency} 次</div>
              <div className="sentiment-bar">
                <div
                  className="sentiment-fill"
                  style={{ width: `${topic.avg_sentiment * 100}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Market signals section component
 */
const MarketSignalsSection = ({ signals }) => {
  if (!signals || signals.length === 0) return null;

  return (
    <div className="market-signals">
      <h3>📡 市场信号</h3>
      <div className="signals-list">
        {signals.map((signal, index) => (
          <div key={index} className={`signal-card ${signal.actionable ? 'actionable' : ''}`}>
            <div className="signal-header">
              <span className="signal-type">{signal.type}</span>
              <span className="signal-strength">
                强度: {(signal.signal_strength * 100).toFixed(0)}%
              </span>
            </div>
            <div className="signal-message">{signal.message}</div>
            {signal.company && (
              <div className="signal-company">公司: {signal.company}</div>
            )}
            {signal.topics && (
              <div className="signal-topics">
                话题: {signal.topics.join(', ')}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Recommendations section component
 */
const RecommendationsSection = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) return null;

  return (
    <div className="recommendations">
      <h3>🎯 推荐行动</h3>
      {recommendations.map((rec, index) => (
        <div key={index} className={`recommendation-card ${rec.priority}`}>
          <h4>{rec.title}</h4>
          <p>{rec.description}</p>
          <div className="recommendation-meta">
            <span className="priority">优先级: {rec.priority}</span>
            <span className="confidence">置信度: {(rec.confidence * 100).toFixed(0)}%</span>
          </div>
          {rec.action_items && (
            <ul className="action-items">
              {rec.action_items.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
};

export default TrendsPage;
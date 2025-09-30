import React from 'react';
import { getSentimentClass, getSentimentText, formatDate, truncateText } from '../utils/helpers';

/**
 * History section component displaying recent analysis results
 */
const HistorySection = ({ history, loading }) => {
  if (loading) {
    return (
      <div className="history-section">
        <h2>最近分析记录</h2>
        <div>加载中...</div>
      </div>
    );
  }

  if (!history || history.length === 0) {
    return null;
  }

  return (
    <div className="history-section">
      <h2>最近分析记录</h2>
      {history.map((item, index) => (
        <div key={index} className="history-item">
          <div className="history-text">
            "{truncateText(item.original_text, 100)}"
          </div>
          <div className="history-summary">
            {item.company && <span>🏢 {item.company}</span>}
            {item.role && <span>👨‍💻 {item.role}</span>}
            {item.sentiment && (
              <span className={getSentimentClass(item.sentiment)}>
                😊 {getSentimentText(item.sentiment)}
              </span>
            )}
            <span>📅 {formatDate(item.created_at)}</span>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HistorySection;
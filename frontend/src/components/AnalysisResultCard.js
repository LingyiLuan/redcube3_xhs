import React from 'react';
import { getSentimentClass, getSentimentText } from '../utils/helpers';

/**
 * Single analysis result display component
 */
const AnalysisResultCard = ({ analysis }) => {
  if (!analysis) return null;

  return (
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
  );
};

export default AnalysisResultCard;
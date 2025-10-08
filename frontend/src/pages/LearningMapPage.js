import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import LearningMapDisplay from '../components/learning/LearningMapDisplay';
import LearningMapsHistory from '../components/learning/LearningMapsHistory';

const LearningMapPage = () => {
  const { isAuthenticated, user, userGoals, fetchUserAnalysisIds } = useAuth();
  const [learningMap, setLearningMap] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [userAnalyses, setUserAnalyses] = useState(null);
  const [activeTab, setActiveTab] = useState('generate'); // 'generate' or 'history'
  const [isCrazyPlan, setIsCrazyPlan] = useState(false);

  const generateLearningMap = async () => {
    if (!isAuthenticated || !user) {
      setError('Please log in to generate learning maps');
      return;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Step 1: Fetch user's analysis data if not already loaded
      let analysisData = userAnalyses;
      if (!analysisData) {
        console.log('Fetching user analysis data...');
        analysisData = await fetchUserAnalysisIds(user.id);
        setUserAnalyses(analysisData);
      }

      // Step 2: Check if user has sufficient data
      if (!analysisData.analysisIds || analysisData.analysisIds.length === 0) {
        setError('No analysis data found. Please analyze some interview posts first to generate a personalized learning map.');
        return;
      }

      // Step 3: Prepare user goals - use fetched goals or fallback
      const effectiveUserGoals = userGoals || {
        target_role: 'Data Analyst',
        experience_level: 'Intermediate',
        learning_style: 'Structured',
        timeline_months: 6,
        target_companies: [],
        focus_areas: []
      };

      console.log('Generating learning map with real data:', {
        userId: user.id,
        analysisCount: analysisData.analysisIds.length,
        userGoals: effectiveUserGoals
      });

      // Step 4: Generate learning map with real data (including CrazyPlan mode)
      const response = await fetch('/api/content/learning-map', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.id,
          analysisIds: analysisData.analysisIds,
          userGoals: effectiveUserGoals,
          isCrazyPlan: isCrazyPlan
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate learning map');
      }

      const data = await response.json();
      setLearningMap(data.data);

      console.log('Learning map generated successfully:', {
        title: data.data.title,
        analysisCount: data.data.analysis_count,
        personalizationScore: data.data.personalization_score
      });

    } catch (err) {
      console.error('Error generating learning map:', err);
      setError(err.message || 'Failed to generate learning map. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSelectMapFromHistory = (map) => {
    setLearningMap(map);
    setActiveTab('generate'); // Switch to generate tab to view the map
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>🎯 AI学习路径生成器</h2>
        <p>基于XHS内容分析结果，生成个性化学习路径</p>
      </div>

      {/* Tab Navigation */}
      {isAuthenticated && (
        <div className="tab-navigation">
          <button
            className={`tab-btn ${activeTab === 'generate' ? 'active' : ''}`}
            onClick={() => setActiveTab('generate')}
          >
            🚀 生成新路径
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📚 我的学习路径
          </button>
        </div>
      )}

      {activeTab === 'history' ? (
        <LearningMapsHistory onSelectMap={handleSelectMapFromHistory} />
      ) : (
        <div className="learning-map-controls">
        {!isAuthenticated ? (
          <div className="auth-required">
            <div className="auth-message">
              <h3>🔐 需要登录</h3>
              <p>请先登录以生成个性化学习路径</p>
            </div>
          </div>
        ) : (
          <div className="controls-section">
            {/* CrazyPlan Toggle */}
            <div className="crazy-plan-toggle">
              <label className="toggle-container">
                <input
                  type="checkbox"
                  checked={isCrazyPlan}
                  onChange={(e) => setIsCrazyPlan(e.target.checked)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">
                  🚀 <strong>CrazyPlan 模式</strong>
                  {isCrazyPlan && <span className="toggle-badge">激活</span>}
                </span>
              </label>
              {isCrazyPlan && (
                <div className="crazy-plan-info">
                  <p>⚡ <strong>30天极速冲刺计划</strong></p>
                  <p>专注实战项目 · AI工具加速 · 快速交付作品集</p>
                </div>
              )}
            </div>

            <div className="control-group">
              <button
                className={`generate-button ${isCrazyPlan ? 'crazy-mode' : ''}`}
                onClick={generateLearningMap}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <span className="loading-spinner">⏳</span>
                    生成中...
                  </>
                ) : (
                  <>
                    <span className="generate-icon">{isCrazyPlan ? '🚀' : '🎯'}</span>
                    {isCrazyPlan ? '生成CrazyPlan' : '生成学习路径'}
                  </>
                )}
              </button>

              {learningMap && (
                <button
                  className="secondary-button"
                  onClick={() => setLearningMap(null)}
                >
                  <span className="clear-icon">🔄</span>
                  重新生成
                </button>
              )}
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">❌</span>
                {error}
              </div>
            )}

            <div className="info-section">
              <h3>📋 功能说明</h3>
              <ul>
                <li>🎯 <strong>个性化路径</strong>：基于您的分析历史和目标生成定制化学习计划</li>
                <li>📅 <strong>时间规划</strong>：提供详细的周计划和里程碑</li>
                <li>🎓 <strong>技能发展</strong>：涵盖XHS内容分析的核心技能</li>
                <li>💼 <strong>职业导向</strong>：面向数据分析师和内容策略师角色</li>
              </ul>

              {isAuthenticated && (
                <div className="user-data-info">
                  <h4>📊 您的数据状态</h4>
                  {userAnalyses ? (
                    <div className="data-status">
                      <p>✅ <strong>分析数据</strong>: {userAnalyses.totalCount} 条面试分析记录
                        {userAnalyses.isUserSpecific ?
                          <span className="data-type personal">（您的专属数据）</span> :
                          <span className="data-type shared">（共享演示数据）</span>
                        }
                      </p>
                      {userAnalyses.analyses && userAnalyses.analyses.length > 0 && (
                        <div className="recent-analyses">
                          <p><strong>最近分析:</strong></p>
                          {userAnalyses.analyses.slice(0, 3).map((analysis, index) => (
                            <span key={index} className="analysis-chip">
                              {analysis.company || '未知公司'} - {analysis.role || '未知职位'}
                            </span>
                          ))}
                        </div>
                      )}
                      {!userAnalyses.isUserSpecific && (
                        <div className="demo-notice">
                          <p>💡 <strong>提示</strong>: 当前使用共享演示数据。分析一些面试帖子后，您将获得基于个人数据的专属学习路径！</p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p>📈 点击生成按钮查看您的分析数据状态</p>
                  )}

                  {userGoals ? (
                    <div className="goals-status">
                      <p>🎯 <strong>目标职位</strong>: {userGoals.target_role || '未设置'}</p>
                      <p>📈 <strong>经验等级</strong>: {userGoals.current_level || '未设置'}</p>
                      {userGoals.target_companies && userGoals.target_companies.length > 0 && (
                        <p>🏢 <strong>目标公司</strong>: {userGoals.target_companies.join(', ')}</p>
                      )}
                    </div>
                  ) : (
                    <p>🎯 建议设置您的学习目标以获得更个性化的学习路径</p>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      )}

      {/* Display learning map only on generate tab */}
      {activeTab === 'generate' && (
        <LearningMapDisplay
          learningMap={learningMap}
          isGenerating={isGenerating}
        />
      )}

      <style jsx>{`
        .page {
          padding: 20px;
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          margin-bottom: 30px;
          text-align: center;
        }

        .page-header h2 {
          color: #2c3e50;
          margin: 0 0 10px 0;
          font-size: 2em;
        }

        .page-header p {
          color: #7f8c8d;
          margin: 0;
          font-size: 1.1em;
        }

        .learning-map-controls {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 25px;
          margin-bottom: 30px;
          border: 1px solid #e9ecef;
        }

        .auth-required {
          text-align: center;
          padding: 40px 20px;
        }

        .auth-message {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 8px;
          padding: 20px;
          display: inline-block;
        }

        .auth-message h3 {
          color: #856404;
          margin: 0 0 10px 0;
        }

        .auth-message p {
          color: #856404;
          margin: 0;
        }

        .controls-section {
          max-width: 800px;
          margin: 0 auto;
        }

        .control-group {
          display: flex;
          gap: 15px;
          justify-content: center;
          margin-bottom: 25px;
          flex-wrap: wrap;
        }

        .generate-button {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          padding: 15px 30px;
          border-radius: 8px;
          font-size: 1.1em;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 10px;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        .generate-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
        }

        .generate-button:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .secondary-button {
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 1em;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .secondary-button:hover {
          background: #5a6268;
          transform: translateY(-1px);
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .error-message {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
          border-radius: 6px;
          padding: 12px 16px;
          margin: 15px 0;
          display: flex;
          align-items: center;
          gap: 10px;
          justify-content: center;
        }

        .info-section {
          background: white;
          border-radius: 8px;
          padding: 20px;
          border: 1px solid #dee2e6;
        }

        .info-section h3 {
          color: #495057;
          margin: 0 0 15px 0;
          font-size: 1.2em;
        }

        .info-section ul {
          margin: 0;
          padding: 0 0 0 20px;
          color: #6c757d;
        }

        .info-section li {
          margin: 8px 0;
          line-height: 1.5;
        }

        .info-section strong {
          color: #495057;
        }

        .user-data-info {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #dee2e6;
        }

        .user-data-info h4 {
          color: #495057;
          margin: 0 0 15px 0;
          font-size: 1.1em;
        }

        .data-status, .goals-status {
          background: #f8f9fa;
          padding: 15px;
          border-radius: 6px;
          margin: 10px 0;
        }

        .data-status p, .goals-status p {
          margin: 5px 0;
          color: #6c757d;
        }

        .recent-analyses {
          margin-top: 10px;
        }

        .analysis-chip {
          display: inline-block;
          background: #e9ecef;
          color: #495057;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 0.9em;
          margin: 2px 4px 2px 0;
          border: 1px solid #dee2e6;
        }

        .data-type {
          font-weight: normal;
          font-size: 0.9em;
          margin-left: 8px;
        }

        .data-type.personal {
          color: #28a745;
        }

        .data-type.shared {
          color: #6c757d;
        }

        .demo-notice {
          background: #fff3cd;
          border: 1px solid #ffeaa7;
          border-radius: 6px;
          padding: 12px;
          margin-top: 15px;
        }

        .demo-notice p {
          margin: 0;
          color: #856404;
          font-size: 0.95em;
        }

        /* Responsive */
        @media (max-width: 768px) {
          .page {
            padding: 15px;
          }

          .control-group {
            flex-direction: column;
            align-items: center;
          }

          .generate-button,
          .secondary-button {
            width: 100%;
            max-width: 300px;
            justify-content: center;
          }

          .page-header h2 {
            font-size: 1.6em;
          }

          .learning-map-controls {
            padding: 20px 15px;
          }
        }

        /* Tab Navigation */
        .tab-navigation {
          display: flex;
          gap: 15px;
          margin-bottom: 25px;
          justify-content: center;
        }

        .tab-btn {
          padding: 12px 30px;
          background: white;
          border: 2px solid #e9ecef;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
          color: #6c757d;
        }

        .tab-btn:hover {
          border-color: #667eea;
          color: #667eea;
          transform: translateY(-2px);
        }

        .tab-btn.active {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border-color: #667eea;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
        }

        /* CrazyPlan Toggle */
        .crazy-plan-toggle {
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.1) 0%, rgba(239, 68, 68, 0.1) 100%);
          border: 2px solid #f59e0b;
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 20px;
        }

        .toggle-container {
          display: flex;
          align-items: center;
          gap: 15px;
          cursor: pointer;
        }

        .toggle-container input[type="checkbox"] {
          display: none;
        }

        .toggle-slider {
          width: 60px;
          height: 30px;
          background: #ccc;
          border-radius: 30px;
          position: relative;
          transition: all 0.3s;
        }

        .toggle-slider::after {
          content: '';
          position: absolute;
          width: 24px;
          height: 24px;
          background: white;
          border-radius: 50%;
          top: 3px;
          left: 3px;
          transition: all 0.3s;
        }

        .toggle-container input:checked + .toggle-slider {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
        }

        .toggle-container input:checked + .toggle-slider::after {
          left: 33px;
        }

        .toggle-label {
          font-size: 1.1rem;
          color: #2c3e50;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .toggle-badge {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          color: white;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 0.75rem;
          font-weight: bold;
          letter-spacing: 0.5px;
        }

        .crazy-plan-info {
          margin-top: 15px;
          padding-top: 15px;
          border-top: 1px solid rgba(245, 158, 11, 0.3);
        }

        .crazy-plan-info p {
          margin: 5px 0;
          color: #2c3e50;
          font-size: 0.95rem;
        }

        .crazy-plan-info p:first-child {
          font-size: 1.05rem;
          color: #f59e0b;
        }

        .generate-button.crazy-mode {
          background: linear-gradient(135deg, #f59e0b 0%, #ef4444 100%);
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% {
            box-shadow: 0 4px 15px rgba(245, 158, 11, 0.4);
          }
          50% {
            box-shadow: 0 6px 25px rgba(245, 158, 11, 0.6);
          }
        }

        @media (max-width: 768px) {
          .tab-navigation {
            flex-direction: column;
          }

          .tab-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default LearningMapPage;
import React from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { useBatchAnalysis } from '../hooks/useAnalysis';
import { useHistory } from '../hooks/useData';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import { samplePosts } from '../utils/helpers';

/**
 * Batch analysis page component with drag-and-drop functionality
 */
const BatchAnalysisPage = () => {
  const {
    posts,
    batchAnalysis,
    loading,
    error,
    addPost,
    updatePost,
    removePost,
    loadSamplePosts,
    reorderPosts,
    analyzeBatch,
    clearError,
    getValidPostsCount
  } = useBatchAnalysis();

  const { refreshHistory } = useHistory();

  const handleAnalyzeBatch = async () => {
    try {
      await analyzeBatch();
      await refreshHistory();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;
    reorderPosts(result.source.index, result.destination.index);
  };

  const handleLoadSamples = () => {
    loadSamplePosts(samplePosts);
    clearError();
  };

  return (
    <>
      <div className="batch-analysis">
        <div className="batch-controls">
          <button onClick={addPost} className="add-post-btn">
            ➕ 添加新帖子
          </button>
          <button onClick={handleLoadSamples} className="sample-posts-btn">
            📋 加载示例帖子
          </button>
          {posts.length > 0 && (
            <button
              className="batch-analyze-btn"
              onClick={handleAnalyzeBatch}
              disabled={loading || getValidPostsCount() === 0}
            >
              {loading ? '批量分析中...' : `分析 ${getValidPostsCount()} 篇帖子`}
            </button>
          )}
        </div>

        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="posts">
            {(provided) => (
              <div {...provided.droppableProps} ref={provided.innerRef} className="posts-container">
                {posts.map((post, index) => (
                  <Draggable key={post.id} draggableId={post.id} index={index}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className={`post-item ${snapshot.isDragging ? 'dragging' : ''}`}
                      >
                        <div className="post-header">
                          <span className="post-number">帖子 {index + 1}</span>
                          <button
                            onClick={() => removePost(post.id)}
                            className="remove-post-btn"
                          >
                            ❌
                          </button>
                        </div>
                        <textarea
                          value={post.text}
                          onChange={(e) => updatePost(post.id, e.target.value)}
                          placeholder={post.placeholder}
                          className="post-textarea"
                          maxLength="10000"
                        />
                        <div className="post-footer">
                          {post.text.length}/10000 字符
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>

        {posts.length === 0 && (
          <div className="empty-state">
            <p>📝 还没有添加任何帖子</p>
            <p>点击"添加新帖子"开始批量分析，或使用"加载示例帖子"快速开始</p>
          </div>
        )}
      </div>

      {loading && (
        <LoadingSpinner message="正在批量分析多篇内容，请稍候..." />
      )}

      <ErrorMessage error={error} onDismiss={clearError} />

      {batchAnalysis && <BatchResultsDisplay batchAnalysis={batchAnalysis} />}
    </>
  );
};

/**
 * Batch analysis results display component
 */
const BatchResultsDisplay = ({ batchAnalysis }) => {
  if (!batchAnalysis) return null;

  const { individual_analyses, connections, batch_insights } = batchAnalysis;

  return (
    <div className="batch-results">
      <h2>🔍 批量分析结果</h2>

      <div className="batch-summary">
        <div className="summary-stats">
          <div className="stat">
            <span className="stat-value">{batchAnalysis.total_posts}</span>
            <span className="stat-label">分析帖子</span>
          </div>
          <div className="stat">
            <span className="stat-value">{batchAnalysis.total_connections}</span>
            <span className="stat-label">发现连接</span>
          </div>
          <div className="stat">
            <span className="stat-value">{batch_insights?.most_mentioned_companies?.length || 0}</span>
            <span className="stat-label">涉及公司</span>
          </div>
        </div>
      </div>

      {/* Connections Section */}
      {connections && connections.length > 0 && (
        <div className="connections-section">
          <h3>🔗 发现的连接</h3>
          <div className="connections-list">
            {connections.map((connection, index) => (
              <div key={connection.id || index} className="connection-card">
                <div className="connection-header">
                  <span className="connection-strength">
                    强度: {(connection.strength * 100).toFixed(0)}%
                  </span>
                  <span className="connection-types">
                    {connection.connection_types?.join(', ') || '未知类型'}
                  </span>
                </div>
                <div className="connection-details">
                  <div className="connected-posts">
                    <div className="post-preview">
                      <strong>帖子 {connection.post1_index + 1}:</strong>
                      <span>{individual_analyses[connection.post1_index]?.company || '未知公司'}</span>
                      <span>{individual_analyses[connection.post1_index]?.role || '未知岗位'}</span>
                    </div>
                    <div className="connection-arrow">↔️</div>
                    <div className="post-preview">
                      <strong>帖子 {connection.post2_index + 1}:</strong>
                      <span>{individual_analyses[connection.post2_index]?.company || '未知公司'}</span>
                      <span>{individual_analyses[connection.post2_index]?.role || '未知岗位'}</span>
                    </div>
                  </div>
                  {connection.insights && (
                    <div className="connection-insights">
                      <strong>洞察:</strong> {connection.insights}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Batch Insights Section */}
      {batch_insights && (
        <div className="batch-insights-section">
          <h3>📊 批量洞察</h3>

          {/* Most mentioned companies */}
          {batch_insights.most_mentioned_companies?.length > 0 && (
            <div className="insight-group">
              <h4>🏢 提及最多的公司</h4>
              <div className="insight-items">
                {batch_insights.most_mentioned_companies.map((company, index) => (
                  <div key={index} className="insight-item">
                    <span className="item-name">{company.item}</span>
                    <span className="item-count">{company.count} 次</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most mentioned roles */}
          {batch_insights.most_mentioned_roles?.length > 0 && (
            <div className="insight-group">
              <h4>💼 提及最多的岗位</h4>
              <div className="insight-items">
                {batch_insights.most_mentioned_roles.map((role, index) => (
                  <div key={index} className="insight-item">
                    <span className="item-name">{role.item}</span>
                    <span className="item-count">{role.count} 次</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Most common topics */}
          {batch_insights.most_common_topics?.length > 0 && (
            <div className="insight-group">
              <h4>🎯 最常见面试话题</h4>
              <div className="insight-items">
                {batch_insights.most_common_topics.map((topic, index) => (
                  <div key={index} className="insight-item">
                    <span className="item-name">{topic.item}</span>
                    <span className="item-count">{topic.count} 次</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Overall sentiment */}
          {batch_insights.overall_sentiment && (
            <div className="insight-group">
              <h4>😊 整体情感倾向</h4>
              <div className="sentiment-stats">
                <div className="sentiment-item positive">
                  正面: {batch_insights.overall_sentiment.positive || 0}
                </div>
                <div className="sentiment-item neutral">
                  中性: {batch_insights.overall_sentiment.neutral || 0}
                </div>
                <div className="sentiment-item negative">
                  负面: {batch_insights.overall_sentiment.negative || 0}
                </div>
                <div className="sentiment-dominant">
                  主导情感: <strong>{batch_insights.overall_sentiment.dominant}</strong>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Individual Results Section */}
      <div className="individual-results-section">
        <h3>📋 单独分析结果</h3>
        <div className="individual-results-grid">
          {individual_analyses?.map((analysis, index) => (
            <div key={analysis.id || index} className="individual-result-card">
              <div className="result-header">
                <span className="post-number">帖子 {index + 1}</span>
                <span className="sentiment-badge">{analysis.sentiment}</span>
              </div>
              <div className="result-content">
                <div className="company-role">
                  {analysis.company && <span className="company">🏢 {analysis.company}</span>}
                  {analysis.role && <span className="role">💼 {analysis.role}</span>}
                </div>
                {analysis.interview_topics?.length > 0 && (
                  <div className="topics">
                    <strong>面试话题:</strong>
                    <div className="topic-tags">
                      {analysis.interview_topics.map((topic, i) => (
                        <span key={i} className="topic-tag">{topic}</span>
                      ))}
                    </div>
                  </div>
                )}
                {analysis.key_insights?.length > 0 && (
                  <div className="insights">
                    <strong>关键洞察:</strong>
                    <ul>
                      {analysis.key_insights.map((insight, i) => (
                        <li key={i}>{insight}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BatchAnalysisPage;
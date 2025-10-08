import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './LearningMapsHistory.css';

/**
 * Component to display user's learning map history
 */
const LearningMapsHistory = ({ onSelectMap }) => {
  const { user } = useAuth();
  const [maps, setMaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // all, active, completed, crazyplan

  useEffect(() => {
    if (user?.id) {
      fetchMapsHistory();
    }
  }, [user, filter]);

  const fetchMapsHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        userId: user.id,
        limit: 50,
        offset: 0
      });

      if (filter === 'active') {
        params.append('status', 'active');
      } else if (filter === 'completed') {
        params.append('status', 'completed');
      } else if (filter === 'crazyplan') {
        params.append('isCrazyPlan', 'true');
      }

      const response = await fetch(`/api/content/learning-maps/history?${params}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch learning maps history');
      }

      const data = await response.json();
      setMaps(data.data.maps || []);
    } catch (err) {
      console.error('Error fetching maps history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleViewMap = async (mapId) => {
    try {
      const response = await fetch(`/api/content/learning-map/${mapId}?userId=${user.id}`, {
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to fetch learning map');
      }

      const data = await response.json();
      onSelectMap(data.data);
    } catch (err) {
      console.error('Error loading map:', err);
      alert('Failed to load learning map');
    }
  };

  const handleDeleteMap = async (mapId, e) => {
    e.stopPropagation();

    if (!window.confirm('Are you sure you want to delete this learning map?')) {
      return;
    }

    try {
      const response = await fetch(`/api/content/learning-map/${mapId}?userId=${user.id}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete learning map');
      }

      // Refresh the list
      fetchMapsHistory();
    } catch (err) {
      console.error('Error deleting map:', err);
      alert('Failed to delete learning map');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="maps-history-loading">
        <div className="loading-spinner">⏳</div>
        <p>加载学习路径历史...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="maps-history-error">
        <span className="error-icon">❌</span>
        <p>{error}</p>
        <button onClick={fetchMapsHistory} className="retry-btn">重试</button>
      </div>
    );
  }

  return (
    <div className="maps-history">
      <div className="history-header">
        <h3>📚 我的学习路径</h3>
        <div className="history-filters">
          <button
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            全部
          </button>
          <button
            className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
            onClick={() => setFilter('active')}
          >
            进行中
          </button>
          <button
            className={`filter-btn ${filter === 'completed' ? 'active' : ''}`}
            onClick={() => setFilter('completed')}
          >
            已完成
          </button>
          <button
            className={`filter-btn ${filter === 'crazyplan' ? 'active' : ''}`}
            onClick={() => setFilter('crazyplan')}
          >
            🚀 CrazyPlan
          </button>
        </div>
      </div>

      {maps.length === 0 ? (
        <div className="no-maps">
          <p>暂无学习路径记录</p>
          <p className="no-maps-hint">生成你的第一个学习路径吧！</p>
        </div>
      ) : (
        <div className="maps-grid">
          {maps.map((map) => (
            <div
              key={map.id}
              className={`map-card ${map.is_crazy_plan ? 'crazy-plan' : ''}`}
              onClick={() => handleViewMap(map.id)}
            >
              {map.is_crazy_plan && (
                <div className="crazy-badge">🚀 CRAZYPLAN</div>
              )}

              <div className="map-card-header">
                <h4 className="map-card-title">{map.title}</h4>
                <span className={`status-badge ${map.status}`}>
                  {map.status === 'active' ? '进行中' :
                   map.status === 'completed' ? '已完成' : '已归档'}
                </span>
              </div>

              <p className="map-card-summary">{map.summary}</p>

              <div className="map-card-meta">
                <div className="meta-row">
                  <span className="meta-label">创建时间:</span>
                  <span className="meta-value">{formatDate(map.created_at)}</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">时长:</span>
                  <span className="meta-value">{map.timeline_weeks} 周</span>
                </div>
                <div className="meta-row">
                  <span className="meta-label">难度:</span>
                  <span className="meta-value">{map.difficulty}</span>
                </div>
              </div>

              {map.progress > 0 && (
                <div className="progress-section">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${map.progress}%` }}
                    ></div>
                  </div>
                  <span className="progress-text">{map.progress}% 完成</span>
                </div>
              )}

              <div className="map-card-actions">
                <button
                  className="action-btn view"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleViewMap(map.id);
                  }}
                >
                  查看详情
                </button>
                <button
                  className="action-btn delete"
                  onClick={(e) => handleDeleteMap(map.id, e)}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default LearningMapsHistory;

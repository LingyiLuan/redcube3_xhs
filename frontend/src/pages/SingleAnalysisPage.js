import React from 'react';
import { useSingleAnalysis } from '../hooks/useAnalysis';
import { useHistory } from '../hooks/useData';
import LoadingSpinner from '../components/LoadingSpinner';
import ErrorMessage from '../components/ErrorMessage';
import SamplePostButtons from '../components/SamplePostButtons';
import AnalysisResultCard from '../components/AnalysisResultCard';
import HistorySection from '../components/HistorySection';
import { samplePosts } from '../utils/helpers';

/**
 * Single analysis page component
 */
const SingleAnalysisPage = () => {
  const {
    text,
    setText,
    analysis,
    loading,
    error,
    analyzeSingle,
    clearError
  } = useSingleAnalysis();

  const {
    history,
    loading: historyLoading,
    refreshHistory
  } = useHistory();

  const handleAnalyze = async () => {
    try {
      await analyzeSingle();
      await refreshHistory(); // Refresh history after analysis
    } catch (err) {
      // Error is handled by the hook
    }
  };

  const handleSamplePost = (sampleText) => {
    setText(sampleText);
    clearError();
  };

  return (
    <>
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

        <SamplePostButtons
          samplePosts={samplePosts}
          onSelectSample={handleSamplePost}
        />

        <button
          className="analyze-btn"
          onClick={handleAnalyze}
          disabled={loading || !text.trim()}
        >
          {loading ? '分析中...' : '开始分析'}
        </button>
      </div>

      {loading && (
        <LoadingSpinner message="正在使用 AI 分析内容，请稍候..." />
      )}

      <ErrorMessage error={error} onDismiss={clearError} />

      <AnalysisResultCard analysis={analysis} />

      <HistorySection history={history} loading={historyLoading} />
    </>
  );
};

export default SingleAnalysisPage;
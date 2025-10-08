import React, { useState } from 'react';
import { AuthProvider } from './contexts/AuthContext';
import TabNavigation from './components/TabNavigation';
import AuthButton from './components/auth/AuthButton';
import SingleAnalysisPage from './pages/SingleAnalysisPage';
import BatchAnalysisPage from './pages/BatchAnalysisPage';
import TrendsPage from './pages/TrendsPage';
import LearningMapPage from './pages/LearningMapPage';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('single');

  const tabs = [
    { id: 'single', icon: '📝', label: '单篇分析' },
    { id: 'batch', icon: '📚', label: '批量分析' },
    { id: 'trends', icon: '📊', label: '趋势分析' },
    { id: 'learning', icon: '🎯', label: '学习路径' }
  ];

  const renderActivePage = () => {
    switch (activeTab) {
      case 'single':
        return <SingleAnalysisPage />;
      case 'batch':
        return <BatchAnalysisPage />;
      case 'trends':
        return <TrendsPage />;
      case 'learning':
        return <LearningMapPage />;
      default:
        return <SingleAnalysisPage />;
    }
  };


  return (
    <AuthProvider>
      <div className="container">
        <header className="header">
          <div className="header-content">
            <div className="header-text">
              <h1>RedCube XHS 内容分析平台 v3</h1>
              <p>智能分析小红书面试经验分享，批量处理，连接检测，趋势分析</p>
            </div>
            <div className="header-auth">
              <AuthButton />
            </div>
          </div>
        </header>

        <TabNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          tabs={tabs}
        />

        {renderActivePage()}
      </div>
    </AuthProvider>
  );
}

export default App;
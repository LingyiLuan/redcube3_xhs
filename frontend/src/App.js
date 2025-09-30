import React, { useState } from 'react';
import TabNavigation from './components/TabNavigation';
import SingleAnalysisPage from './pages/SingleAnalysisPage';
import BatchAnalysisPage from './pages/BatchAnalysisPage';
import TrendsPage from './pages/TrendsPage';
import './index.css';

function App() {
  const [activeTab, setActiveTab] = useState('single');

  const tabs = [
    { id: 'single', icon: '📝', label: '单篇分析' },
    { id: 'batch', icon: '📚', label: '批量分析' },
    { id: 'trends', icon: '📊', label: '趋势分析' }
  ];

  const renderActivePage = () => {
    switch (activeTab) {
      case 'single':
        return <SingleAnalysisPage />;
      case 'batch':
        return <BatchAnalysisPage />;
      case 'trends':
        return <TrendsPage />;
      default:
        return <SingleAnalysisPage />;
    }
  };


  return (
    <div className="container">
      <header className="header">
        <h1>RedCube XHS 内容分析平台 v2</h1>
        <p>智能分析小红书面试经验分享，批量处理，连接检测，趋势分析</p>
      </header>

      <TabNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        tabs={tabs}
      />

      {renderActivePage()}
    </div>
  );
}

export default App;
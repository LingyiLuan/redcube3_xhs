import React from 'react';

/**
 * Tab navigation component for switching between different views
 */
const TabNavigation = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="tab-navigation">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`tab-button ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.icon} {tab.label}
        </button>
      ))}
    </div>
  );
};

export default TabNavigation;
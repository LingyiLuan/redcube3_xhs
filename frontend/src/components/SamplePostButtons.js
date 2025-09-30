import React from 'react';

/**
 * Sample post buttons component for quick testing
 */
const SamplePostButtons = ({ samplePosts, onSelectSample, label = "或者使用示例内容:" }) => {
  return (
    <div style={{ marginBottom: '20px' }}>
      <label>{label}</label>
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '10px' }}>
        {samplePosts.map((sample, index) => (
          <button
            key={index}
            onClick={() => onSelectSample(sample)}
            style={{
              padding: '8px 15px',
              background: '#f1f3f4',
              border: '1px solid #dadce0',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.9rem'
            }}
          >
            示例 {index + 1}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SamplePostButtons;
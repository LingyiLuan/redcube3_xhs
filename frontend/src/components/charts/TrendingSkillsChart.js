import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * Top 10 Trending Skills Bar Chart
 * Shows most mentioned skills in the last 30 days
 */
const TrendingSkillsChart = ({ trendsData }) => {
  const chartData = useMemo(() => {
    if (!trendsData?.topTopics) {
      return null;
    }

    // Get top 10 skills/topics
    const topSkills = trendsData.topTopics.slice(0, 10);
    const labels = topSkills.map(skill => skill.topic || skill.name || skill);
    const frequencies = topSkills.map(skill => skill.frequency || skill.count || 0);
    const sentiments = topSkills.map(skill => (skill.avg_sentiment || 0.5) * 100);

    return {
      labels,
      datasets: [
        {
          label: '提及频率',
          data: frequencies,
          backgroundColor: 'rgba(59, 130, 246, 0.8)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 1,
          yAxisID: 'y',
        },
        {
          label: '平均情感分数',
          data: sentiments,
          backgroundColor: 'rgba(168, 85, 247, 0.8)',
          borderColor: 'rgb(168, 85, 247)',
          borderWidth: 1,
          yAxisID: 'y1',
        }
      ]
    };
  }, [trendsData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e5e7eb',
          font: {
            size: 12
          }
        }
      },
      title: {
        display: true,
        text: 'Top 10 热门技能趋势',
        color: '#f3f4f6',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              if (context.datasetIndex === 1) {
                label += context.parsed.y.toFixed(1) + '%';
              } else {
                label += context.parsed.y + ' 次';
              }
            }
            return label;
          }
        }
      }
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        title: {
          display: true,
          text: '提及次数',
          color: '#e5e7eb'
        }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#9ca3af',
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          drawOnChartArea: false,
        },
        title: {
          display: true,
          text: '情感分数',
          color: '#e5e7eb'
        }
      },
      x: {
        ticks: {
          color: '#9ca3af',
          maxRotation: 45,
          minRotation: 45
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      }
    }
  };

  if (!chartData) {
    return (
      <div className="chart-placeholder">
        <p>暂无技能数据</p>
      </div>
    );
  }

  return (
    <div className="chart-container" style={{ height: '400px' }}>
      <Bar data={chartData} options={options} />
    </div>
  );
};

export default TrendingSkillsChart;

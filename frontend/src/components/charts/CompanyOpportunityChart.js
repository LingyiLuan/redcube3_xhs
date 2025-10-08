import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  LinearScale,
  PointElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Scatter } from 'react-chartjs-2';

ChartJS.register(LinearScale, PointElement, Tooltip, Legend);

/**
 * Company Opportunity Matrix Scatter Plot
 * X-axis: Interview volume (number of posts)
 * Y-axis: Average sentiment score
 * Bubble size: Hiring intensity or post recency
 */
const CompanyOpportunityChart = ({ trendsData }) => {
  const chartData = useMemo(() => {
    if (!trendsData?.topCompanies) {
      return null;
    }

    // Process company data for scatter plot
    const companies = trendsData.topCompanies;

    const dataPoints = companies.map((company, index) => ({
      x: company.mention_count || company.count || 0,
      y: (company.avg_sentiment || 0.5) * 100, // Convert to percentage
      label: company.company || company.name || `公司${index + 1}`,
      radius: Math.max(5, Math.min(20, (company.mention_count || 1) / 2)), // Dynamic bubble size
    }));

    // Color coding based on opportunity (high volume + high sentiment = green)
    const getPointColor = (point) => {
      const volumeScore = Math.min(point.x / 10, 1); // Normalize volume
      const sentimentScore = point.y / 100; // Already normalized
      const opportunityScore = (volumeScore + sentimentScore) / 2;

      if (opportunityScore > 0.7) return 'rgba(34, 197, 94, 0.7)'; // Green - high opportunity
      if (opportunityScore > 0.5) return 'rgba(59, 130, 246, 0.7)'; // Blue - medium opportunity
      if (opportunityScore > 0.3) return 'rgba(251, 191, 36, 0.7)'; // Yellow - low opportunity
      return 'rgba(239, 68, 68, 0.7)'; // Red - poor opportunity
    };

    return {
      datasets: [
        {
          label: '公司机会矩阵',
          data: dataPoints,
          backgroundColor: dataPoints.map(getPointColor),
          borderColor: dataPoints.map(point => {
            const bg = getPointColor(point);
            return bg.replace('0.7', '1'); // Solid border
          }),
          borderWidth: 2,
        }
      ]
    };
  }, [trendsData]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: '公司机会矩阵 (面试量 vs 评价)',
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
            const point = context.raw;
            return [
              `公司: ${point.label}`,
              `面试量: ${point.x} 次`,
              `平均评价: ${point.y.toFixed(1)}%`,
            ];
          }
        }
      }
    },
    scales: {
      x: {
        beginAtZero: true,
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        title: {
          display: true,
          text: '面试活跃度 (帖子数量)',
          color: '#e5e7eb',
          font: {
            size: 13
          }
        }
      },
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          color: '#9ca3af',
          callback: function(value) {
            return value + '%';
          }
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        },
        title: {
          display: true,
          text: '平均情感分数',
          color: '#e5e7eb',
          font: {
            size: 13
          }
        }
      }
    }
  };

  if (!chartData) {
    return (
      <div className="chart-placeholder">
        <p>暂无公司数据</p>
      </div>
    );
  }

  return (
    <div className="chart-container" style={{ height: '400px' }}>
      <Scatter data={chartData} options={options} />
      <div className="chart-legend" style={{ marginTop: '10px', textAlign: 'center', color: '#9ca3af', fontSize: '12px' }}>
        <span style={{ color: 'rgba(34, 197, 94, 1)', marginRight: '15px' }}>● 高机会</span>
        <span style={{ color: 'rgba(59, 130, 246, 1)', marginRight: '15px' }}>● 中等机会</span>
        <span style={{ color: 'rgba(251, 191, 36, 1)', marginRight: '15px' }}>● 低机会</span>
        <span style={{ color: 'rgba(239, 68, 68, 1)' }}>● 谨慎考虑</span>
      </div>
    </div>
  );
};

export default CompanyOpportunityChart;

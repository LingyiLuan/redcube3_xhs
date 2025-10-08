import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

/**
 * Market Activity Over Time Line Chart
 * Shows interview activity trends with company filtering
 */
const MarketActivityChart = ({ trendsData }) => {
  const chartData = useMemo(() => {
    if (!trendsData?.timeline_data) {
      return null;
    }

    // Process timeline data for chart
    const timeline = trendsData.timeline_data;
    const labels = timeline.map(item => item.date || item.week || item.month);
    const totalActivity = timeline.map(item => item.total_posts || item.count || 0);
    const positiveActivity = timeline.map(item => item.positive_posts || 0);
    const negativeActivity = timeline.map(item => item.negative_posts || 0);

    return {
      labels,
      datasets: [
        {
          label: '总活跃度',
          data: totalActivity,
          borderColor: 'rgb(75, 192, 192)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.4,
        },
        {
          label: '积极评价',
          data: positiveActivity,
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          fill: true,
          tension: 0.4,
        },
        {
          label: '消极评价',
          data: negativeActivity,
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          fill: true,
          tension: 0.4,
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
        text: '市场活跃度趋势',
        color: '#f3f4f6',
        font: {
          size: 16,
          weight: 'bold'
        }
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#f3f4f6',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      },
      x: {
        ticks: {
          color: '#9ca3af'
        },
        grid: {
          color: 'rgba(75, 85, 99, 0.3)'
        }
      }
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  if (!chartData) {
    return (
      <div className="chart-placeholder">
        <p>暂无时间线数据</p>
      </div>
    );
  }

  return (
    <div className="chart-container" style={{ height: '400px' }}>
      <Line data={chartData} options={options} />
    </div>
  );
};

export default MarketActivityChart;

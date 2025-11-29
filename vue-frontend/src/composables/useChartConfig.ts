/**
 * useChartConfig
 * Centralized Chart.js configuration for all report visualizations
 * Ensures consistent styling across all charts
 */

// @ts-nocheck
import { computed } from 'vue'
import type { ChartOptions } from 'chart.js'
import { MCKINSEY_COLORS, CHART_DIMENSIONS } from '@/constants/reportConstants'

export function useChartConfig() {
  // ============================================================================
  // BASE CONFIGURATION
  // ============================================================================

  const baseOptions: ChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    animation: false,  // Disable animations globally for deterministic scatter plots
    plugins: {
      legend: {
        display: false // We use custom legends
      },
      tooltip: {
        enabled: true,
        backgroundColor: '#FFFFFF',
        titleColor: MCKINSEY_COLORS.gray800,
        bodyColor: MCKINSEY_COLORS.gray700,
        borderColor: MCKINSEY_COLORS.gray200,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 6,
        titleFont: {
          size: 14,
          weight: 'bold'
        },
        bodyFont: {
          size: 13
        },
        displayColors: true,
        boxWidth: 12,
        boxHeight: 12
      }
    },
    interaction: {
      mode: 'index',
      intersect: false
    }
  }

  // ============================================================================
  // BAR CHART CONFIGURATION
  // ============================================================================

  function getBarChartConfig(options: Partial<ChartOptions> = {}): ChartOptions {
    return {
      ...baseOptions,
      ...options,
      scales: {
        x: {
          grid: {
            display: false
          },
          ticks: {
            color: MCKINSEY_COLORS.gray600,
            font: {
              size: 12,
              weight: '500'
            },
            maxRotation: 45,
            minRotation: 0
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: MCKINSEY_COLORS.gray200,
            lineWidth: 1
          },
          ticks: {
            color: MCKINSEY_COLORS.gray600,
            font: {
              size: 12
            },
            callback: function(value) {
              return value + '%'
            }
          }
        }
      }
    }
  }

  // ============================================================================
  // HORIZONTAL BAR CHART CONFIGURATION
  // ============================================================================

  function getHorizontalBarChartConfig(options: Partial<ChartOptions> = {}): ChartOptions {
    return {
      ...baseOptions,
      indexAxis: 'y' as const,
      ...options,
      scales: {
        x: {
          beginAtZero: true,
          grid: {
            color: MCKINSEY_COLORS.gray200
          },
          ticks: {
            color: MCKINSEY_COLORS.gray600,
            font: {
              size: 12
            },
            callback: function(value) {
              return value + '%'
            }
          }
        },
        y: {
          grid: {
            display: false
          },
          ticks: {
            color: MCKINSEY_COLORS.gray700,
            font: {
              size: 13,
              weight: '600'
            }
          }
        }
      }
    }
  }

  // ============================================================================
  // LINE CHART CONFIGURATION
  // ============================================================================

  function getLineChartConfig(options: Partial<ChartOptions> = {}): ChartOptions {
    return {
      ...baseOptions,
      ...options,
      scales: {
        x: {
          grid: {
            color: MCKINSEY_COLORS.gray200,
            lineWidth: 1
          },
          ticks: {
            color: MCKINSEY_COLORS.gray600,
            font: {
              size: 12
            }
          }
        },
        y: {
          beginAtZero: true,
          grid: {
            color: MCKINSEY_COLORS.gray200,
            lineWidth: 1
          },
          ticks: {
            color: MCKINSEY_COLORS.gray600,
            font: {
              size: 12
            },
            callback: function(value) {
              return value + '%'
            }
          }
        }
      },
      elements: {
        line: {
          tension: 0.4,
          borderWidth: 3,
          borderCapStyle: 'round' as const,
          borderJoinStyle: 'round' as const
        },
        point: {
          radius: 4,
          hitRadius: 8,
          hoverRadius: 6,
          borderWidth: 2
        }
      }
    }
  }

  // ============================================================================
  // SCATTER PLOT CONFIGURATION
  // ============================================================================

  function getScatterPlotConfig(options: Partial<ChartOptions> = {}): ChartOptions {
    return {
      ...baseOptions,
      ...options,
      layout: {
        padding: {
          top: 20,
          right: 20,
          bottom: 20,
          left: 20
        }
      },
      scales: {
        x: {
          type: 'linear' as const,
          position: 'bottom' as const,
          grid: {
            color: MCKINSEY_COLORS.gray200
          },
          ticks: {
            color: MCKINSEY_COLORS.gray600,
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: 'Market Demand (%)',
            color: MCKINSEY_COLORS.gray700,
            font: {
              size: 13,
              weight: '600'
            }
          }
        },
        y: {
          type: 'linear' as const,
          grid: {
            color: MCKINSEY_COLORS.gray200
          },
          ticks: {
            color: MCKINSEY_COLORS.gray600,
            font: {
              size: 12
            }
          },
          title: {
            display: true,
            text: 'Success Impact (%)',
            color: MCKINSEY_COLORS.gray700,
            font: {
              size: 13,
              weight: '600'
            }
          }
        }
      },
      elements: {
        point: {
          radius: 8,
          hoverRadius: 10,
          borderWidth: 2,
          backgroundColor: MCKINSEY_COLORS.primaryBlue,
          borderColor: '#FFFFFF'
        }
      }
    }
  }

  // ============================================================================
  // DOUGHNUT CHART CONFIGURATION
  // ============================================================================

  function getDoughnutChartConfig(options: Partial<ChartOptions> = {}): ChartOptions {
    return {
      ...baseOptions,
      ...options,
      plugins: {
        ...baseOptions.plugins,
        legend: {
          display: true,
          position: 'right' as const,
          labels: {
            color: MCKINSEY_COLORS.gray700,
            font: {
              size: 13
            },
            padding: 16,
            boxWidth: 16,
            boxHeight: 16,
            useBorderRadius: true,
            borderRadius: 4
          }
        }
      },
      cutout: '65%'
    }
  }

  // ============================================================================
  // RADAR CHART CONFIGURATION
  // ============================================================================

  function getRadarChartConfig(options: Partial<ChartOptions> = {}): ChartOptions {
    return {
      ...baseOptions,
      ...options,
      scales: {
        r: {
          beginAtZero: true,
          max: 100,
          ticks: {
            stepSize: 20,
            color: MCKINSEY_COLORS.gray600,
            backdropColor: 'transparent',
            font: {
              size: 11
            }
          },
          grid: {
            color: MCKINSEY_COLORS.gray200
          },
          angleLines: {
            color: MCKINSEY_COLORS.gray200
          },
          pointLabels: {
            color: MCKINSEY_COLORS.gray700,
            font: {
              size: 12,
              weight: '600'
            }
          }
        }
      },
      elements: {
        line: {
          borderWidth: 2
        },
        point: {
          radius: 3,
          hitRadius: 6,
          hoverRadius: 5
        }
      }
    }
  }

  // ============================================================================
  // COLOR SCHEMES
  // ============================================================================

  const chartColorSchemes = {
    primary: [
      MCKINSEY_COLORS.chartBlue,
      MCKINSEY_COLORS.chartGreen,
      MCKINSEY_COLORS.chartYellow,
      MCKINSEY_COLORS.chartRed,
      MCKINSEY_COLORS.chartPurple,
      MCKINSEY_COLORS.chartOrange,
      MCKINSEY_COLORS.chartTeal,
      MCKINSEY_COLORS.chartPink
    ],
    success: [
      MCKINSEY_COLORS.successGreen,
      MCKINSEY_COLORS.lightGreen,
      MCKINSEY_COLORS.darkGreen
    ],
    warning: [
      MCKINSEY_COLORS.warningYellow,
      MCKINSEY_COLORS.orange,
      MCKINSEY_COLORS.darkYellow
    ],
    error: [
      MCKINSEY_COLORS.errorRed,
      MCKINSEY_COLORS.lightRed,
      MCKINSEY_COLORS.darkRed
    ],
    neutral: [
      MCKINSEY_COLORS.gray400,
      MCKINSEY_COLORS.gray500,
      MCKINSEY_COLORS.gray600,
      MCKINSEY_COLORS.gray700
    ],
    gradient: [
      MCKINSEY_COLORS.lightBlue,
      MCKINSEY_COLORS.secondaryBlue,
      MCKINSEY_COLORS.primaryBlue,
      MCKINSEY_COLORS.darkBlue
    ]
  }

  // ============================================================================
  // UTILITY FUNCTIONS
  // ============================================================================

  /**
   * Get color for a value based on threshold
   */
  function getThresholdColor(value: number, thresholds: { critical: number, high: number, medium: number }): string {
    if (value >= thresholds.critical) return MCKINSEY_COLORS.successGreen
    if (value >= thresholds.high) return MCKINSEY_COLORS.primaryBlue
    if (value >= thresholds.medium) return MCKINSEY_COLORS.warningYellow
    return MCKINSEY_COLORS.gray400
  }

  /**
   * Get gradient background for charts
   */
  function createGradient(ctx: CanvasRenderingContext2D, colorStart: string, colorEnd: string): CanvasGradient {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400)
    gradient.addColorStop(0, colorStart)
    gradient.addColorStop(1, colorEnd)
    return gradient
  }

  /**
   * Format percentage for chart labels
   */
  function formatPercentage(value: number, decimals: number = 1): string {
    return `${value.toFixed(decimals)}%`
  }

  /**
   * Truncate long labels
   */
  function truncateLabel(label: string, maxLength: number = 20): string {
    if (label.length <= maxLength) return label
    return label.substring(0, maxLength - 3) + '...'
  }

  /**
   * Get responsive font size based on container width
   */
  function getResponsiveFontSize(containerWidth: number): number {
    if (containerWidth < 400) return 10
    if (containerWidth < 600) return 11
    if (containerWidth < 800) return 12
    return 13
  }

  // ============================================================================
  // RETURN PUBLIC API
  // ============================================================================

  return {
    // Base configuration
    baseOptions,

    // Chart-specific configs
    getBarChartConfig,
    getHorizontalBarChartConfig,
    getLineChartConfig,
    getScatterPlotConfig,
    getDoughnutChartConfig,
    getRadarChartConfig,

    // Color schemes
    chartColorSchemes,

    // Utility functions
    getThresholdColor,
    createGradient,
    formatPercentage,
    truncateLabel,
    getResponsiveFontSize,

    // Constants
    colors: MCKINSEY_COLORS,
    dimensions: CHART_DIMENSIONS
  }
}

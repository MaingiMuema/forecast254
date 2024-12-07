/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

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
  Filler,
  ChartData,
  ChartOptions
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { format } from 'date-fns';

// Register ChartJS components
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

interface ProbabilityData {
  timestamp: string;
  probabilityYes: number;
  probabilityNo: number;
  volume?: number;
}

interface ProbabilityGraphProps {
  data: ProbabilityData[];
  currentProbabilityYes: number;
  currentProbabilityNo: number;
}

export default function ProbabilityGraph({
  data,
  currentProbabilityYes,
  currentProbabilityNo,
}: ProbabilityGraphProps) {
  const createGradient = (ctx: CanvasRenderingContext2D, color: string) => {
    const gradient = ctx.createLinearGradient(0, 0, 0, 200);
    gradient.addColorStop(0, color);
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    return gradient;
  };

  // Process and smooth the probability data
  const processedData = useMemo(() => {
    // Sort data chronologically
    const sortedData = [...data].sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate cumulative probabilities
    let runningYesVolume = 0;
    let runningNoVolume = 0;

    const smoothedData = sortedData.map(point => {
      // Update running totals
      runningYesVolume += (point.volume || 0) * point.probabilityYes;
      runningNoVolume += (point.volume || 0) * point.probabilityNo;
      
      const totalVolume = runningYesVolume + runningNoVolume;
      
      // Calculate smoothed probabilities
      const smoothedYes = totalVolume > 0 ? runningYesVolume / totalVolume : point.probabilityYes;
      const smoothedNo = totalVolume > 0 ? runningNoVolume / totalVolume : point.probabilityNo;

      return {
        timestamp: point.timestamp,
        probabilityYes: smoothedYes,
        probabilityNo: smoothedNo
      };
    });

    // Add current point
    smoothedData.push({
      timestamp: new Date().toISOString(),
      probabilityYes: currentProbabilityYes,
      probabilityNo: currentProbabilityNo
    });

    return smoothedData;
  }, [data, currentProbabilityYes, currentProbabilityNo]);

  const chartData: ChartData<'line'> = {
    labels: processedData.map(d => format(new Date(d.timestamp), 'HH:mm')),
    datasets: [
      {
        label: 'YES',
        data: processedData.map(d => d.probabilityYes * 100),
        borderColor: 'rgba(74, 222, 128, 0.8)',
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const {ctx} = chart;
          return createGradient(ctx, 'rgba(74, 222, 128, 0.2)');
        },
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
        cubicInterpolationMode: 'monotone' as const,
      },
      {
        label: 'NO',
        data: processedData.map(d => d.probabilityNo * 100),
        borderColor: 'rgba(248, 113, 113, 0.8)',
        backgroundColor: function(context: any) {
          const chart = context.chart;
          const {ctx} = chart;
          return createGradient(ctx, 'rgba(248, 113, 113, 0.2)');
        },
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        borderWidth: 2,
        cubicInterpolationMode: 'monotone' as const,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    animations: {
      tension: {
        duration: 750,
        easing: 'easeInOutQuart',
        from: 0.3,
        to: 0.3,
      }
    },
    interaction: {
      intersect: false,
      mode: 'index' as const,
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.9)',
        titleColor: 'rgba(243, 244, 246, 1)',
        bodyColor: 'rgba(243, 244, 246, 1)',
        borderColor: 'rgba(75, 85, 99, 0.3)',
        borderWidth: 1,
        padding: 10,
        displayColors: true,
        titleFont: {
          size: 12,
          weight: 'bold',
        },
        bodyFont: {
          size: 11,
        },
        callbacks: {
          label: function(context: any) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += context.parsed.y.toFixed(1) + '%';
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
          font: {
            size: 10,
          },
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 6,
        },
        border: {
          display: false,
        },
      },
      y: {
        min: 0,
        max: 100,
        grid: {
          color: 'rgba(75, 85, 99, 0.06)',
          drawTicks: false,
          display: true,
        },
        ticks: {
          color: 'rgba(156, 163, 175, 0.8)',
          font: {
            size: 10,
          },
          padding: 8,
          stepSize: 20,
          callback: function(value: any) {
            return value + '%';
          },
        },
        border: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="w-full bg-[#141B2D]/90 backdrop-blur-sm rounded-xl p-4 border border-border/50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-green-400/80" />
            <span className="text-xs font-medium text-white/90">
              YES: {(currentProbabilityYes * 100).toFixed(1)}%
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 rounded-full bg-red-400/80" />
            <span className="text-xs font-medium text-white/90">
              NO: {(currentProbabilityNo * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>
      
      <div className="h-[180px]">
        <Line data={chartData} options={options} />
      </div>
    </div>
  );
}

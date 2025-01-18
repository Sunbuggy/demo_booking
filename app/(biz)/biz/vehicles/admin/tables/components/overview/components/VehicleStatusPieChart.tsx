import React from 'react';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface VehicleStatusPieChartProps {
  operational: number;
  broken: number;
}

export function VehicleStatusPieChart({
  operational,
  broken
}: VehicleStatusPieChartProps) {
  const data = {
    labels: ['Operational', 'Broken'],
    datasets: [
      {
        data: [operational, broken],
        backgroundColor: ['#4ade80', '#f87171'],
        hoverBackgroundColor: ['#22c55e', '#ef4444']
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const
      },
      title: {
        display: true,
        text: 'Vehicle Status Distribution'
      }
    }
  };

  return <Pie data={data} options={options} />;
}

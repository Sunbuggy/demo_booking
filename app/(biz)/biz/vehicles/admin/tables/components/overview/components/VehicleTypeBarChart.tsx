import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface VehicleTypeBarChartProps {
  vehicleTypes: Record<string, { operational: number; broken: number }>;
}

export function VehicleTypeBarChart({
  vehicleTypes
}: VehicleTypeBarChartProps) {
  const data = {
    labels: Object.keys(vehicleTypes),
    datasets: [
      {
        label: 'Operational',
        data: Object.values(vehicleTypes).map((type) => type.operational),
        backgroundColor: '#4ade80'
      },
      {
        label: 'Broken',
        data: Object.values(vehicleTypes).map((type) => type.broken),
        backgroundColor: '#f87171'
      }
    ]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top' as const
      },
      title: {
        display: true,
        text: 'Vehicle Type Distribution'
      }
    },
    scales: {
      x: {
        stacked: true
      },
      y: {
        stacked: true
      }
    }
  };

  return <Bar data={data} options={options} />;
}

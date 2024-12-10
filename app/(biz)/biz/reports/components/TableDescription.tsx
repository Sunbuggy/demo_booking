import { useMemo, useState } from 'react';
import {
  Bar,
  Line,
  Pie,
  Bubble,
  Doughnut,
  Radar,
  PolarArea,
  Scatter,
} from 'react-chartjs-2';
import 'chart.js/auto';
import { format, parseISO } from 'date-fns';

interface TableDescriptionProps {
  data: any[];
  columns: string[];
}

const TableDescription: React.FC<TableDescriptionProps> = ({
  data,
  columns,
}) => {
  const [chartTypes, setChartTypes] = useState<Record<string, string>>({});

  const tableInfo = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        rowCount: 0,
        columnCount: 0,
      };
    }

    const getColumnValue = (row: any, column: string) => {
      try {
        return column.split('.').reduce((acc, key) => acc?.[key], row);
      } catch {
        return undefined;
      }
    };

    const getType = (value: any) => {
      if (value === null) return 'null';
      if (Array.isArray(value)) return 'array';
      return typeof value;
    };

    const info: Record<string, any> = {
      rowCount: data.length,
      columnCount: columns.length,
    };

    columns.forEach((column) => {
      const uniqueValues = new Set(
        data
          .map((row) => getColumnValue(row, column))
          .filter((value) => value !== null && value !== undefined)
      );

      if (uniqueValues.size === 0) {
        info[column] = {
          uniqueCount: 0,
          type: 'unknown',
          valueCounts: [],
        };
        return;
      }

      info[column] = {
        uniqueCount: uniqueValues.size,
        type: getType(getColumnValue(data[0], column)),
      };

      const valueCounts = data.reduce((acc, row) => {
        let value = getColumnValue(row, column);
        if (value === null || value === undefined) return acc;

        if (column.includes('created_at') || column.includes('updated_at')) {
          value = format(parseISO(value), 'yyyy-MM-dd');
        }

        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});

      info[column].valueCounts = Object.entries(valueCounts).map(
        ([value, count]) => ({
          value,
          count,
          percentage: (((count as number) / data.length) * 100).toFixed(2),
        })
      );
    });

    return info;
  }, [data, columns]);

  const handleChartTypeChange = (column: string, type: string) => {
    setChartTypes((prev) => ({ ...prev, [column]: type }));
  };

  const getRandomColor = () => {
    const colors = [
      'rgba(255, 99, 132, 0.2)',
      'rgba(54, 162, 235, 0.2)',
      'rgba(255, 206, 86, 0.2)',
      'rgba(75, 192, 192, 0.2)',
      'rgba(153, 102, 255, 0.2)',
      'rgba(255, 159, 64, 0.2)',
      'rgba(199, 199, 199, 0.2)',
      'rgba(83, 102, 255, 0.2)',
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  const renderChart = (column: string) => {
    const chartType = chartTypes[column] || 'Bar';
    const columnInfo = tableInfo[column];

    if (!columnInfo || !columnInfo.valueCounts) {
      return <p className="text-red-600">No data available for this column.</p>;
    }

    const chartData = {
      labels: columnInfo.valueCounts.map((vc: any) => vc.value),
      datasets: [
        {
          label: 'Count',
          data: columnInfo.valueCounts.map((vc: any) => vc.count),
          backgroundColor: columnInfo.valueCounts.map(() => getRandomColor()),
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1,
        },
      ],
    };

    const chartOptions = {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
    };

    switch (chartType) {
      case 'Line':
        return <Line data={chartData} options={chartOptions} />;
      case 'Pie':
        return <Pie data={chartData} options={chartOptions} />;
      case 'Bubble':
        return <Bubble data={chartData} options={chartOptions} />;
      case 'Doughnut':
        return <Doughnut data={chartData} options={chartOptions} />;
      case 'Radar':
        return <Radar data={chartData} options={chartOptions} />;
      case 'PolarArea':
        return <PolarArea data={chartData} options={chartOptions} />;
      case 'Scatter':
        return <Scatter data={chartData} options={chartOptions} />;
      default:
        return <Bar data={chartData} options={chartOptions} />;
    }
  };

  return (
    <div className="space-y-6 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-3xl font-bold text-gray-800">Table Description</h2>
      <p className="text-lg text-gray-600">Total rows: {tableInfo.rowCount}</p>
      <p className="text-lg text-gray-600">
        Total columns: {tableInfo.columnCount}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {columns.map((column) => (
          <div key={column} className="p-4 bg-gray-100 rounded-lg shadow-md">
            <h3 className="text-xl font-semibold text-gray-700">{column}</h3>
            <p className="text-gray-600">
              Unique values: {tableInfo[column]?.uniqueCount || 0}
            </p>
            <div className="mt-4">
              <label className="text-gray-600">Select chart type:</label>
              <select
                className="ml-2 p-1 border rounded"
                value={chartTypes[column] || 'Bar'}
                onChange={(e) => handleChartTypeChange(column, e.target.value)}
              >
                <option value="Bar">Bar</option>
                <option value="Line">Line</option>
                <option value="Pie">Pie</option>
                <option value="Bubble">Bubble</option>
                <option value="Doughnut">Doughnut</option>
                <option value="Radar">Radar</option>
                <option value="PolarArea">PolarArea</option>
                <option value="Scatter">Scatter</option>
              </select>
            </div>
            <div className="mt-4">
              <p className="text-gray-600">Value distribution:</p>
              {renderChart(column)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableDescription;

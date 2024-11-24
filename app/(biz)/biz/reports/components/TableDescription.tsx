import { useMemo, useState } from 'react';
import { Bar, Line, Pie } from 'react-chartjs-2';
import 'chart.js/auto';
import { format, parseISO } from 'date-fns';

interface TableDescriptionProps {
  data: any[];
  columns: string[];
}

const TableDescription: React.FC<TableDescriptionProps> = ({
  data,
  columns
}) => {
  const [chartTypes, setChartTypes] = useState<Record<string, string>>({});

  const tableInfo = useMemo(() => {
    const info: Record<string, any> = {
      rowCount: data.length,
      columnCount: columns.length
    };

    columns.forEach((column) => {
      const uniqueValues = new Set(
        data.map((row) => row[column]).filter((value) => value !== null)
      );
      info[column] = {
        uniqueCount: uniqueValues.size,
        type: typeof data[0][column]
      };

      const valueCounts = data.reduce((acc, row) => {
        let value = row[column];
        if (value === null) return acc;

        if (column === 'created_at' || column === 'updated_at') {
          value = format(parseISO(value), 'yyyy-MM-dd'); // Group by day
          // value = format(parseISO(value), 'yyyy-ww'); // Group by week
        }

        acc[value] = (acc[value] || 0) + 1;
        return acc;
      }, {});

      info[column].valueCounts = Object.entries(valueCounts).map(
        ([value, count]) => ({
          value,
          count,
          percentage: (((count as number) / data.length) * 100).toFixed(2)
        })
      );
    });

    return info;
  }, [data, columns]);

  const handleChartTypeChange = (column: string, type: string) => {
    setChartTypes((prev) => ({ ...prev, [column]: type }));
  };

  const renderChart = (column: string) => {
    const chartType = chartTypes[column] || 'Bar';
    const chartData = {
      labels: tableInfo[column].valueCounts.map((vc: any) => vc.value),
      datasets: [
        {
          label: 'Count',
          data: tableInfo[column].valueCounts.map((vc: any) => vc.count),
          backgroundColor: 'rgba(75, 192, 192, 0.6)',
          borderColor: 'rgba(75, 192, 192, 1)',
          borderWidth: 1
        }
      ]
    };

    const chartOptions = {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true
        }
      }
    };

    switch (chartType) {
      case 'Line':
        return <Line data={chartData} options={chartOptions} />;
      case 'Pie':
        return <Pie data={chartData} options={chartOptions} />;
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
              Unique values: {tableInfo[column].uniqueCount}
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

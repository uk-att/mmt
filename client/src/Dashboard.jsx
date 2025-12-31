import React from 'react';
import { Pie } from 'react-chartjs-2';
// Example chunk progress data
const chunkProgress = [100, 80, 60, 40, 20]; // Replace with real data if available
import { Chart, ArcElement, Tooltip, Legend } from 'chart.js';
Chart.register(ArcElement, Tooltip, Legend);

const stats = {
  totalMappings: 120,
  totalTransformations: 85,
  totalModels: 42,
  successRate: 92,
};

const pieData = {
  labels: ['Mappings', 'Transformations', 'Models'],
  datasets: [
    {
      data: [stats.totalMappings, stats.totalTransformations, stats.totalModels],
      backgroundColor: ['#2563eb', '#10b981', '#6366f1'],
      borderColor: ['#fff', '#fff', '#fff'],
      borderWidth: 2,
    },
  ],
};

export default function Dashboard() {
    // Chunk run progress pie chart data
    const chunkPieData = {
      labels: chunkProgress.map((_, idx) => `Chunk ${idx + 1}`),
      datasets: [
        {
          data: chunkProgress,
          backgroundColor: ['#2563eb', '#10b981', '#6366f1', '#f59e42', '#ef4444'],
          borderColor: ['#fff', '#fff', '#fff', '#fff', '#fff'],
          borderWidth: 2,
        },
      ],
    };
  return (
    <div style={{ padding: 40 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32, marginTop: 0 }}>
        <div style={{ minWidth: 220, marginBottom: 32 }}>
          <h3 style={{ color: '#2563eb', fontWeight: 700, fontSize: 22, marginBottom: 12 }}>Statistics</h3>
          <ul style={{ fontSize: 18, listStyle: 'none', padding: 0 }}>
            <li>Total Mappings: <b>{stats.totalMappings}</b></li>
            <li>Total Transformations: <b>{stats.totalTransformations}</b></li>
            <li>Total Models: <b>{stats.totalModels}</b></li>
            <li>Success Rate: <b>{stats.successRate}%</b></li>
          </ul>
        </div>
        <div style={{ width: 480, height: 480, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', marginTop: -48 }}>
          <div style={{ width: 320, height: 320 }}>
            <Pie data={pieData} options={{
              plugins: {
                legend: { position: 'bottom', labels: { color: '#2563eb', font: { size: 16 } } },
              },
              maintainAspectRatio: false,
            }} />
          </div>
          <div style={{ width: 320, height: 320 }}>
            <Pie data={chunkPieData} options={{
              plugins: {
                legend: { position: 'bottom', labels: { color: '#6366f1', font: { size: 16 } } },
              },
              maintainAspectRatio: false,
            }} />
          </div>
        </div>
      </div>
    </div>
  );
}

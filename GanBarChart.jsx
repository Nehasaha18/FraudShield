import React from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function GanBarChart({ results }) {
  const low = results.filter(r => r.gan_score < 0.3).length;
  const med = results.filter(r => r.gan_score >= 0.3 && r.gan_score < 0.7).length;
  const high = results.filter(r => r.gan_score >= 0.7).length;

  const data = {
    labels: ['Low (0–0.3)', 'Medium (0.3–0.7)', 'High (0.7–1.0)'],
    datasets: [{
      label: 'Transactions',
      data: [low, med, high],
      backgroundColor: ['green', 'orange', 'red'],
      borderRadius: 5
    }]
  };

  const options = {
    responsive: true,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { stepSize: 1 }
      }
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: '30px auto' }}>
      <h3>📊 GAN Score Distribution</h3>
      <Bar data={data} options={options} />
    </div>
  );
}

export default GanBarChart;

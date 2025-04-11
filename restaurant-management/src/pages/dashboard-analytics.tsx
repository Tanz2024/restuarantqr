import { useEffect, useState } from 'react';
import axios from 'axios';
import DashboardLayout from '@/components/dashboardLayout';
import styles from './dashboardAnalytics.module.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function DashboardAnalytics() {
  const [analytics, setAnalytics] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  const fetchAnalytics = async () => {
    try {
      const res = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/api/analytics`);
      setAnalytics(res.data.analytics || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch analytics.');
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, []);

  // Prepare data for the chart
  const chartData = {
    labels: analytics.map(item => item.metric),
    datasets: [
      {
        label: 'Metrics',
        data: analytics.map(item => item.value),
        backgroundColor: 'rgba(0,112,243,0.5)',
      },
    ],
  };

  return (
    <DashboardLayout>
      <div className={styles.container}>
        <h1 className={styles.title}>Analytics Overview</h1>
        {error && <p className={styles.error}>{error}</p>}
        <div className={styles.chartContainer}>
          <Bar data={chartData} options={{ responsive: true, plugins: { legend: { position: 'top' } } }} />
        </div>
      </div>
    </DashboardLayout>
  );
}

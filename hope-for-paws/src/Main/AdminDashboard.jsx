import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { motion } from 'framer-motion';
import PropTypes from 'prop-types';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

const AdminDashboard = ({ vets = [], users = [] }) => {
  const chartData = {
    labels: ['Veterinarians', 'Regular Users'],
    datasets: [
      {
        label: 'User Count',
        data: [vets.length, users.length],
        backgroundColor: ['#6b493d', '#a07855'],
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { display: false },
      title: {
        display: true,
        text: 'User Distribution',
        color: '#4E3B31',
        font: { size: 20, weight: 'bold' },
      },
    },
    scales: {
      x: {
        ticks: { color: '#4E3B31', font: { weight: 'bold' } },
        grid: { color: '#f3e7d8' },
      },
      y: {
        beginAtZero: true,
        ticks: { color: '#4E3B31', font: { weight: 'bold' } },
        grid: { color: '#f3e7d8' },
      },
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -40 }}
      transition={{ duration: 0.4 }}
      className="mb-8 bg-white rounded-xl shadow p-6"
    >
      <Bar data={chartData} options={chartOptions} height={80} />
    </motion.div>
  );
};

AdminDashboard.propTypes = {
  vets: PropTypes.array.isRequired,
  users: PropTypes.array.isRequired,
};

export default AdminDashboard;
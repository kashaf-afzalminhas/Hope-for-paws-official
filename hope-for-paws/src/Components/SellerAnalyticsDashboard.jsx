import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Doughnut } from 'react-chartjs-2';
import { TrendingUp, PieChart } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

export default function SellerAnalyticsDashboard() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('all');

  // Fetch real order data for the logged in seller
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token =
          localStorage.getItem('token') ||
          sessionStorage.getItem('token') ||
          localStorage.getItem('hope_for_paws_token');
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        const res = await fetch(`${apiBase}/api/orders/seller`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 404) {
          setOrders([]);
          return;
        }

        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

        const data = await res.json();
        if (Array.isArray(data)) {
          setOrders(data);
        } else if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
        } else {
          setOrders([]);
        }
      } catch (err) {
        console.error('Error fetching analytics orders:', err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  // Filter orders by date range tab
  const filteredOrders = useMemo(() => {
    if (range === 'all') return orders;
    const now = new Date();
    const cutoff = new Date();

    if (range === '30-days') {
      cutoff.setDate(now.getDate() - 30);
    } else if (range === '7-days') {
      cutoff.setDate(now.getDate() - 7);
    }

    return orders.filter((o) => new Date(o.createdAt || Date.now()) >= cutoff);
  }, [orders, range]);

  // Calculate real metrics
  const stats = useMemo(() => {
    const totalOrders = filteredOrders.length;
    const totalRevenue = filteredOrders
      .filter((o) => o.status !== 'Cancelled')
      .reduce((sum, o) => sum + (o.totals?.finalTotal || 0), 0);

    const pending = filteredOrders.filter((o) => o.status === 'Pending').length;
    const processing = filteredOrders.filter((o) =>
      ['Confirmed', 'Processing'].includes(o.status)
    ).length;
    const shipped = filteredOrders.filter((o) => o.status === 'Shipped').length;
    const delivered = filteredOrders.filter((o) => o.status === 'Delivered').length;
    const cancelled = filteredOrders.filter((o) => o.status === 'Cancelled').length;

    return { totalOrders, totalRevenue, pending, processing, shipped, delivered, cancelled };
  }, [filteredOrders]);

  // Revenue trend chart data
  const hasRevenueData = useMemo(() => {
    return filteredOrders.some((o) => o.status !== 'Cancelled' && (o.totals?.finalTotal || 0) > 0);
  }, [filteredOrders]);

  const salesTrendData = useMemo(() => {
    const monthlyMap = {};

    filteredOrders.forEach((o) => {
      if (o.status === 'Cancelled') return;
      const date = new Date(o.createdAt || Date.now());
      const label = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      monthlyMap[label] = (monthlyMap[label] || 0) + (o.totals?.finalTotal || 0);
    });

    const labels = Object.keys(monthlyMap).slice(-7);
    const dataValues = labels.map((l) => monthlyMap[l]);

    return {
      labels: labels.length > 0 ? labels : [],
      datasets: [
        {
          label: 'Revenue',
          data: dataValues,
          fill: true,
          tension: 0.35,
          borderColor: '#6b493d',
          borderWidth: 2,
          backgroundColor: (context) => {
            const ctx = context.chart.ctx;
            const gradient = ctx.createLinearGradient(0, 0, 0, 260);
            gradient.addColorStop(0, 'rgba(107, 73, 61, 0.18)');
            gradient.addColorStop(1, 'rgba(107, 73, 61, 0.0)');
            return gradient;
          },
          pointBackgroundColor: '#ffffff',
          pointBorderColor: '#6b493d',
          pointBorderWidth: 2,
          pointRadius: 4,
        },
      ],
    };
  }, [filteredOrders]);

  const salesTrendOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1917',
        callbacks: {
          label: (context) => ` Revenue: Rs ${context.parsed.y.toLocaleString()}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (val) => `Rs ${val.toLocaleString()}`,
          color: '#78716c',
          font: { size: 11, weight: '500' },
        },
        grid: { color: '#f5f5f4' },
      },
      x: {
        ticks: { color: '#78716c', font: { size: 11, weight: '500' } },
        grid: { display: false },
      },
    },
  };

  // Order distribution chart
  const orderDistributionData = {
    labels: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    datasets: [
      {
        data: [
          stats.pending,
          stats.processing,
          stats.shipped,
          stats.delivered,
          stats.cancelled,
        ],
        backgroundColor: ['#f59e0b', '#0ea5e9', '#3b82f6', '#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const orderDistributionOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '72%',
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1c1917',
        callbacks: {
          label: (ctx) => {
            const val = ctx.parsed;
            const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
            return ` ${ctx.label}: ${val} (${pct}%)`;
          },
        },
      },
    },
  };

  const deliverySuccessRate = stats.totalOrders > 0
    ? ((stats.delivered / stats.totalOrders) * 100).toFixed(1)
    : 0;

  return (
    <div className="min-h-screen bg-[#f8f6f4] py-8 text-stone-700 antialiased font-sans">
      <div className="mx-auto max-w-[1200px] px-4 space-y-6">
        
        {/* TOP BAR */}
        <div className="bg-white rounded-2xl p-4 border border-stone-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate('/seller/orders')}
            className="inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-4 py-2 text-xs font-semibold text-stone-600 shadow-sm transition hover:bg-stone-50 hover:text-[#6b493d]"
          >
            ← Back to Orders
          </button>

          {/* Clean Main Heading */}
          <h1 className="text-xl font-bold tracking-tight text-stone-900 text-center">
            Seller Analytics Dashboard
          </h1>

          <div className="flex items-center gap-2">
            {[
              { key: 'all', label: 'All Time' },
              { key: '30-days', label: 'Last 30 Days' },
              { key: '7-days', label: 'Last 7 Days' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setRange(tab.key)}
                className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-all ${
                  range === tab.key
                    ? 'bg-[#6b493d] text-white shadow-sm'
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-2xl bg-white border border-stone-200/80">
            <span className="text-sm font-medium text-stone-400">Loading analytics...</span>
          </div>
        ) : (
          <>
            {/* TOP ROW: TOTAL REVENUE & TOTAL ORDERS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  TOTAL REVENUE
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900 tracking-tight">
                  Rs {stats.totalRevenue.toLocaleString()}
                </p>
              </div>

              <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  TOTAL ORDERS
                </p>
                <p className="mt-2 text-3xl font-bold text-stone-900 tracking-tight">
                  {stats.totalOrders}
                </p>
              </div>
            </div>

            {/* MIDDLE ROW: STATUS BREAKDOWN */}
            <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                STATUS BREAKDOWN
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="rounded-xl bg-amber-500/10 p-4 border border-amber-500/20">
                  <p className="text-xs font-medium text-amber-800">Pending</p>
                  <p className="mt-2 text-2xl font-bold text-amber-950">{stats.pending}</p>
                </div>

                <div className="rounded-xl bg-sky-500/10 p-4 border border-sky-500/20">
                  <p className="text-xs font-medium text-sky-800">Processing</p>
                  <p className="mt-2 text-2xl font-bold text-sky-950">{stats.processing}</p>
                </div>

                <div className="rounded-xl bg-blue-500/10 p-4 border border-blue-500/20">
                  <p className="text-xs font-medium text-blue-800">Shipped</p>
                  <p className="mt-2 text-2xl font-bold text-blue-950">{stats.shipped}</p>
                </div>

                <div className="rounded-xl bg-emerald-500/10 p-4 border border-emerald-500/20">
                  <p className="text-xs font-medium text-emerald-800">Delivered</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-950">{stats.delivered}</p>
                </div>

                <div className="rounded-xl bg-red-500/10 p-4 border border-red-500/20 col-span-2 sm:col-span-1">
                  <p className="text-xs font-medium text-red-800">Cancelled</p>
                  <p className="mt-2 text-2xl font-bold text-red-950">{stats.cancelled}</p>
                </div>
              </div>
            </div>

            {/* BOTTOM ROW: CHARTS */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Revenue Trend */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Revenue Trend
                </p>

                {hasRevenueData ? (
                  <div className="h-[260px]">
                    <Line data={salesTrendData} options={salesTrendOptions} />
                  </div>
                ) : (
                  <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                      <TrendingUp size={22} />
                    </div>
                    <p className="text-sm font-semibold text-stone-700">No sales recorded for this period</p>
                    <p className="text-xs text-stone-400 mt-1 max-w-xs">
                      Revenue graphs will render here automatically once orders are confirmed and fulfilled.
                    </p>
                  </div>
                )}
              </div>

              {/* Order Distribution */}
              <div className="bg-white rounded-2xl p-6 border border-stone-200/80 shadow-sm space-y-4 flex flex-col justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
                  Order Distribution
                </p>

                {stats.totalOrders > 0 ? (
                  <>
                    <div className="flex h-[210px] items-center justify-center relative">
                      <div className="h-48 w-48 relative">
                        <Doughnut data={orderDistributionData} options={orderDistributionOptions} />
                        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-bold text-stone-900">{deliverySuccessRate}%</span>
                          <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Delivered</span>
                        </div>
                      </div>
                    </div>

                    {/* Legend Pills */}
                    <div className="flex flex-wrap justify-center gap-2 text-xs font-medium text-stone-600 pt-2">
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                        <span className="w-2 h-2 rounded-full bg-amber-500" /> Pending ({stats.pending})
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                        <span className="w-2 h-2 rounded-full bg-sky-500" /> Processing ({stats.processing})
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
                        <span className="w-2 h-2 rounded-full bg-blue-500" /> Shipped ({stats.shipped})
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" /> Delivered ({stats.delivered})
                      </span>
                      <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200">
                        <span className="w-2 h-2 rounded-full bg-red-500" /> Cancelled ({stats.cancelled})
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="h-[260px] flex flex-col items-center justify-center text-center p-6 bg-stone-50/50 rounded-xl border border-dashed border-stone-200">
                    <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-3">
                      <PieChart size={22} />
                    </div>
                    <p className="text-sm font-semibold text-stone-700">No order distribution yet</p>
                    <p className="text-xs text-stone-400 mt-1 max-w-xs">
                      Status breakdown charts will display as soon as buyers place orders in your store.
                    </p>
                  </div>
                )}
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
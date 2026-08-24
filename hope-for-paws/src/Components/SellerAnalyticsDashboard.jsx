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
import { TrendingUp, PieChart, ArrowLeft } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, ArcElement, Tooltip, Legend, Filler);

export default function SellerAnalyticsDashboard({ embedded = false }) {
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
          borderWidth: 2.5,
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
          pointHoverRadius: 6,
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
          color: '#8c7e75',
          font: { size: 11, weight: '500' },
        },
        grid: { color: '#eae4dc' },
      },
      x: {
        ticks: { color: '#8c7e75', font: { size: 11, weight: '500' } },
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
    <div className={embedded ? "w-full bg-transparent text-stone-700 antialiased font-sans" : "min-h-screen bg-white py-6 md:py-8 text-stone-700 antialiased font-sans"}>
      {/* Container with balanced side margin */}
      <div className={embedded ? "w-full space-y-6" : "mx-auto max-w-[1360px] px-4 sm:px-6 md:px-8 space-y-6"}>
        
        {/* TOP HERO CARD (Matches the Profile Overview style) */}
        <div className="bg-[#f7f2eb] rounded-3xl p-6 md:p-8 border border-[#e8dfd3] shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#8c6b58]">
                ANALYTICS OVERVIEW
              </span>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[#4a3429]">
                Seller Analytics
              </h1>
              <p className="text-xs md:text-sm text-[#8c7e75]">
                A real-time snapshot of your revenue, orders, and fulfillment activity.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto justify-between md:justify-end">
              <button
                type="button"
                onClick={() => navigate('/seller/orders')}
                className="inline-flex items-center gap-2 rounded-2xl bg-[#6b493d] px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-[#56382e] active:scale-[0.98]"
              >
                <ArrowLeft size={14} /> Back to Orders
              </button>

              <div className="flex items-center gap-1.5 bg-white/70 backdrop-blur-sm p-1 rounded-2xl border border-[#e8dfd3]">
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
                        : 'text-[#6b493d] hover:bg-white/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* INNER SUMMARY PILLS */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-[#e8dfd3] shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c6b58]">
                TOTAL REVENUE
              </p>
              <p className="mt-2 text-3xl font-bold text-[#4a3429] tracking-tight">
                <span className="text-[0.7em] align-top font-semibold text-[#8c7e75] mr-1">Rs</span>
                {stats.totalRevenue.toLocaleString()}
              </p>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-[#e8dfd3] shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-wider text-[#8c6b58]">
                TOTAL ORDERS
              </p>
              <p className="mt-2 text-3xl font-bold text-[#4a3429] tracking-tight">
                {stats.totalOrders}
              </p>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex h-64 items-center justify-center rounded-3xl bg-[#f7f2eb] border border-[#e8dfd3]">
            <span className="text-sm font-medium text-[#8c7e75]">Loading analytics...</span>
          </div>
        ) : (
          <>
            {/* STATUS BREAKDOWN WRAPPER CARD */}
            <div className="bg-[#f7f2eb] rounded-3xl p-6 md:p-8 border border-[#e8dfd3] shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-[#4a3429]">Status Breakdown</h2>
                  <p className="text-xs text-[#8c7e75]">Current lifecycle stage of all filtered orders.</p>
                </div>
                <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/70 text-[#8c6b58] border border-[#e8dfd3]">
                  Status
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 pt-1">
                {/* Pending */}
                <div className="p-5 rounded-2xl border-l-4 border-l-[#FFE5B4] bg-[#FFF8E8] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-xs font-semibold text-amber-800">Pending</p>
                  <p className="mt-2 text-2xl font-bold text-amber-950">{stats.pending}</p>
                </div>

                {/* Processing */}
                <div className="p-5 rounded-2xl border-l-4 border-l-[#BAE1FF] bg-[#F0F8FF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-xs font-semibold text-sky-800">Processing</p>
                  <p className="mt-2 text-2xl font-bold text-sky-950">{stats.processing}</p>
                </div>

                {/* Shipped */}
                <div className="p-5 rounded-2xl border-l-4 border-l-[#C9DAFF] bg-[#F0F4FF] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-xs font-semibold text-blue-800">Shipped</p>
                  <p className="mt-2 text-2xl font-bold text-blue-950">{stats.shipped}</p>
                </div>

                {/* Delivered */}
                <div className="p-5 rounded-2xl border-l-4 border-l-[#B5E6C8] bg-[#F0FFF4] shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-xs font-semibold text-emerald-800">Delivered</p>
                  <p className="mt-2 text-2xl font-bold text-emerald-950">{stats.delivered}</p>
                </div>

                {/* Cancelled */}
                <div className="p-5 rounded-2xl border-l-4 border-l-[#FFB3B3] bg-[#FFF0F0] col-span-2 sm:col-span-1 lg:col-span-1 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
                  <p className="text-xs font-semibold text-rose-800">Cancelled</p>
                  <p className="mt-2 text-2xl font-bold text-rose-950">{stats.cancelled}</p>
                </div>
              </div>
            </div>

            {/* CHARTS ROW (Side by Side cards in matching darker container style) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Revenue Trend */}
              <div className="bg-[#f7f2eb] rounded-3xl p-6 md:p-8 border border-[#e8dfd3] shadow-sm space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#4a3429]">Revenue Trend</h2>
                    <p className="text-xs text-[#8c7e75]">Recent sales performance over time.</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/70 text-[#8c6b58] border border-[#e8dfd3]">
                    Timeline
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#e8dfd3]">
                  {hasRevenueData ? (
                    <div className="h-[250px]">
                      <Line data={salesTrendData} options={salesTrendOptions} />
                    </div>
                  ) : (
                    <div className="h-[250px] flex flex-col items-center justify-center text-center p-6 bg-[#f7f2eb]/50 rounded-xl border border-dashed border-[#e8dfd3]">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#8c7e75] mb-3 shadow-sm">
                        <TrendingUp size={22} />
                      </div>
                      <p className="text-sm font-semibold text-[#4a3429]">No sales recorded for this period</p>
                      <p className="text-xs text-[#8c7e75] mt-1 max-w-xs">
                        Revenue graphs will render here automatically once orders are confirmed.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Distribution */}
              <div className="bg-[#f7f2eb] rounded-3xl p-6 md:p-8 border border-[#e8dfd3] shadow-sm space-y-4 flex flex-col justify-between">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-bold text-[#4a3429]">Order Distribution</h2>
                    <p className="text-xs text-[#8c7e75]">Fulfillment ratio & status proportions.</p>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/70 text-[#8c6b58] border border-[#e8dfd3]">
                    Allocation
                  </span>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#e8dfd3] space-y-3">
                  {stats.totalOrders > 0 ? (
                    <>
                      <div className="flex h-[180px] items-center justify-center relative">
                        <div className="h-44 w-44 relative">
                          <Doughnut data={orderDistributionData} options={orderDistributionOptions} />
                          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-bold text-[#4a3429]">{deliverySuccessRate}%</span>
                            <span className="text-[10px] font-semibold text-[#8c7e75] uppercase tracking-wider">Delivered</span>
                          </div>
                        </div>
                      </div>

                      {/* Legend Pills */}
                      <div className="flex flex-wrap justify-center gap-1.5 text-xs font-medium text-stone-600 pt-1">
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Pending ({stats.pending})
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-sky-500" /> Processing ({stats.processing})
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Shipped ({stats.shipped})
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Delivered ({stats.delivered})
                        </span>
                        <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-red-50 text-red-800 border border-red-200 text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500" /> Cancelled ({stats.cancelled})
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="h-[250px] flex flex-col items-center justify-center text-center p-6 bg-[#f7f2eb]/50 rounded-xl border border-dashed border-[#e8dfd3]">
                      <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-[#8c7e75] mb-3 shadow-sm">
                        <PieChart size={22} />
                      </div>
                      <p className="text-sm font-semibold text-[#4a3429]">No order distribution yet</p>
                      <p className="text-xs text-[#8c7e75] mt-1 max-w-xs">
                        Status breakdown charts will display as soon as buyers place orders.
                      </p>
                    </div>
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </div>
    </div>
  );
}
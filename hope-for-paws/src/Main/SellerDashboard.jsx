import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);
import {
  Package, ShoppingBag, TrendingUp, Wallet,
  Plus, Edit2, Trash2, X, AlertCircle, Loader2, Image as ImageIcon, Eye, EyeOff, Pause, Play,
  BadgeCheck, Clock, RefreshCw, Star, MessageSquareText
} from 'lucide-react';
import AddProduct from './AddProduct';
import StarDisplay from '../Components/StarDisplay';

const API_URL = 'http://localhost:3000/api/sellers';

// Set up axios instance with token
const getAxiosConfig = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

const SellerDashboard = ({ onNavigateOrders }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [editingProductId, setEditingProductId] = useState(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState(null);
  
  // Data States
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalOrders: 0,
    activeProducts: 0,
    lowStock: 0,
    revenueByMonth: [],
    recentOrders: [],
    topProducts: []
  });
  const [products, setProducts] = useState([]);
  const [sellerProfile, setSellerProfile] = useState(null);
  
  // Reviews States
  const [reviews, setReviews] = useState([]);
  const [reviewsStats, setReviewsStats] = useState({ averageRating: 0, totalReviews: 0 });
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);
  const [reviewsFetched, setReviewsFetched] = useState(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const goToOrders = () => {
    if (onNavigateOrders) {
      onNavigateOrders();
    } else {
      navigate('/seller/orders');
    }
  };

  // Fetch Data
  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [statsRes, productsRes, profileRes] = await Promise.all([
        axios.get(`${API_URL}/dashboard-stats`, getAxiosConfig()),
        axios.get(`${API_URL}/products`, getAxiosConfig()),
        axios.get(`${API_URL}/me`, getAxiosConfig()).catch(() => null)
      ]);
      
      setStats(statsRes.data);
      setProducts(productsRes.data);
      if (profileRes?.data?.seller) {
        setSellerProfile(profileRes.data.seller);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Lazy-load reviews when Reviews tab is selected
  const fetchSellerReviews = async () => {
    try {
      setReviewsLoading(true);
      setReviewsError(null);
      const res = await axios.get(`${API_URL}/reviews`, getAxiosConfig());
      setReviews(res.data.reviews || []);
      setReviewsStats(res.data.stats || { averageRating: 0, totalReviews: 0 });
      setReviewsFetched(true);
    } catch (err) {
      console.error('Error fetching seller reviews:', err);
      setReviewsError('Failed to load reviews. Please try again.');
    } finally {
      setReviewsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'reviews' && !reviewsFetched) {
      fetchSellerReviews();
    }
  }, [activeTab]);

  const handleOpenEditModal = (product) => {
    setEditingProductId(product._id);
    setActiveTab('edit-product');
  };

  const handleDeleteClick = (product) => {
    setProductToDelete(product);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;
    try {
      await axios.delete(`${API_URL}/products/${productToDelete._id}`, getAxiosConfig());
      setProducts(products.filter(p => p._id !== productToDelete._id));
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Failed to delete product');
    }
  };

  const handleToggleVisibility = async (product) => {
    try {
      const res = await axios.patch(`${API_URL}/products/${product._id}/toggle-visibility`, {}, getAxiosConfig());
      setProducts(products.map(p => p._id === product._id ? { ...p, status: res.data.product.status } : p));
    } catch (err) {
      console.error('Error toggling visibility:', err);
      alert('Failed to toggle product visibility');
    }
  };

  if (isLoading) {
    return (
      <div className="w-full min-h-[70vh] rounded-[28px] border border-[#6b493d]/10 bg-[#fcfaf8] p-6 shadow-[0_20px_60px_-24px_rgba(107,73,61,0.28)]">
        <div className="flex flex-col gap-4 rounded-[24px] border border-stone-200 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-2xl bg-[#6b493d]/10 p-3">
              <Loader2 className="h-5 w-5 animate-spin text-[#6b493d]" />
            </div>
            <div className="space-y-2">
              <div className="h-4 w-40 rounded-full bg-stone-200" />
              <div className="h-3 w-56 rounded-full bg-stone-100" />
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="rounded-2xl border border-stone-200 p-4">
                <div className="h-3 w-24 rounded-full bg-stone-200" />
                <div className="mt-3 h-8 w-20 rounded-full bg-stone-100" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full min-h-[70vh] rounded-[28px] border border-red-100 bg-[#fff8f7] p-6 shadow-[0_20px_60px_-24px_rgba(239,68,68,0.2)]">
        <div className="flex flex-col items-center justify-center rounded-[24px] border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
          <div className="mb-4 rounded-2xl bg-red-50 p-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h2 className="text-lg font-semibold text-stone-900">We could not refresh your seller dashboard</h2>
          <p className="mt-2 max-w-md text-sm text-stone-500">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#6b493d] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#5a3c32]"
          >
            <RefreshCw className="h-4 w-4" />
            Try again
          </button>
        </div>
      </div>
    );
  }

  if (activeTab === 'add-product' || activeTab === 'edit-product') {
    return (
      <AddProduct
        productId={activeTab === 'edit-product' ? editingProductId : null}
        onCancel={() => { setActiveTab('products'); setEditingProductId(null); }}
        onSuccess={() => { setActiveTab('products'); setEditingProductId(null); fetchDashboardData(); }}
      />
    );
  }

  return (
    <div className="w-full bg-transparent">
      <div className="mb-6 rounded-[28px] border border-[#6b493d]/10 bg-[#fcfaf8] p-6 shadow-[0_20px_60px_-24px_rgba(107,73,61,0.28)] sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#6b493d]/15 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.24em] text-[#6b493d] shadow-sm">
                <ShoppingBag className="h-3.5 w-3.5" />
                Seller workspace
              </div>
              {sellerProfile && (
                sellerProfile.isVerified ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    <BadgeCheck className="h-4 w-4" />
                    Verified Seller
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
                    <Clock className="h-3.5 w-3.5" />
                    Pending Review
                  </span>
                )
              )}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-stone-900 sm:text-4xl">
              {sellerProfile?.storeName || 'Store Dashboard'}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-stone-500">
              Keep your listings healthy, customer orders moving, and your store performance visible in one polished workspace.
            </p>
          </div>
          <div className="rounded-2xl border border-[#6b493d]/10 bg-white px-4 py-3 shadow-sm">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">Live snapshot</p>
            <p className="mt-1 text-sm font-semibold text-stone-700">{stats.totalOrders} orders • {stats.activeProducts} active products</p>
          </div>
        </div>
      </div>

      <div className="mb-8 flex gap-2 overflow-x-auto rounded-[24px] border border-stone-200 bg-white/80 p-2 shadow-sm backdrop-blur-sm">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'reviews', label: 'Reviews', icon: Star }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-[#6b493d] text-white shadow-sm'
                : 'text-stone-600 hover:bg-[#6b493d]/5 hover:text-[#6b493d]'
            }`}
          >
            <tab.icon className="h-4 w-4" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      <div className="min-h-[420px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {[
                { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: Wallet, color: 'bg-emerald-50 text-emerald-700', accent: 'from-emerald-500 to-emerald-600' },
                { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'bg-sky-50 text-sky-700', accent: 'from-sky-500 to-sky-600', onClick: goToOrders, clickable: true },
                { label: 'Active Products', value: stats.activeProducts.toString(), icon: Package, color: 'bg-violet-50 text-violet-700', accent: 'from-violet-500 to-violet-600', onClick: () => setActiveTab('products'), clickable: true },
                { label: 'Low Stock Alerts', value: stats.lowStock.toString(), icon: AlertCircle, color: 'bg-amber-50 text-amber-700', accent: 'from-amber-500 to-amber-600' }
              ].map((stat, i) => (
                <div
                  key={i}
                  onClick={stat.onClick ? stat.onClick : undefined}
                  className={`rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm transition-all ${stat.clickable ? 'cursor-pointer hover:-translate-y-0.5 hover:shadow-md' : 'hover:shadow-md'}`}
                >
                  <div className={`inline-flex rounded-2xl p-3 ${stat.color}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                  <div className="mt-4 flex items-end justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-stone-500">{stat.label}</p>
                      <p className="mt-1 text-2xl font-semibold text-stone-900">{stat.value}</p>
                    </div>
                    <span className={`h-2.5 w-2.5 rounded-full bg-gradient-to-r ${stat.accent}`} />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">Performance</p>
                  <h3 className="text-xl font-semibold text-stone-900">Revenue overview</h3>
                </div>
                <div className="rounded-full border border-[#6b493d]/10 bg-[#6b493d]/5 px-3 py-1 text-sm font-semibold text-[#6b493d]">
                  {stats.revenueByMonth.length > 0 ? 'Updated daily' : 'Collecting data'}
                </div>
              </div>
              <div className="h-[300px] w-full">
                {stats.revenueByMonth.length > 0 ? (
                  <Bar
                    options={{
                      responsive: true,
                      maintainAspectRatio: false,
                      plugins: {
                        legend: { display: false },
                        tooltip: {
                          backgroundColor: '#1F2937',
                          titleColor: '#fff',
                          bodyColor: '#fff',
                          callbacks: {
                            label: function(context) {
                              let label = context.dataset.label || '';
                              if (label) {
                                label += ': ';
                              }
                              if (context.parsed.y !== null) {
                                label += new Intl.NumberFormat('en-PK', { style: 'currency', currency: 'PKR' }).format(context.parsed.y);
                              }
                              return label;
                            }
                          }
                        }
                      },
                      scales: {
                        x: {
                          grid: { display: false },
                          ticks: { color: '#6B7280' },
                          border: { display: false }
                        },
                        y: {
                          min: 0,
                          suggestedMax: 500000,
                          grid: { color: '#E5E7EB', tickLength: 0 },
                          border: { display: false, dash: [3, 3] },
                          ticks: {
                            color: '#6B7280',
                            callback: function(value) {
                              if (value >= 1000) {
                                return 'Rs. ' + (value / 1000) + 'k';
                              }
                              return 'Rs. ' + value;
                            }
                          }
                        }
                      }
                    }}
                    data={{
                      labels: stats.revenueByMonth.map(item => item.month),
                      datasets: [
                        {
                          label: 'Revenue',
                          data: stats.revenueByMonth.map(item => item.value),
                          backgroundColor: '#6b493d',
                          borderRadius: 4,
                          maxBarThickness: 50
                        }
                      ]
                    }}
                  />
                ) : (
                  <div className="flex h-full items-center justify-center rounded-2xl border border-dashed border-stone-200 bg-stone-50 text-sm text-stone-500">
                    Not enough data for chart yet.
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">Best sellers</p>
                    <h3 className="text-xl font-semibold text-stone-900">Top selling products</h3>
                  </div>
                  <button onClick={() => setActiveTab('products')} className="text-sm font-semibold text-[#6b493d] hover:underline">View all</button>
                </div>

                {stats.topProducts && stats.topProducts.length > 0 ? (
                  <div className="space-y-3">
                    {stats.topProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/60 p-4 transition-colors hover:bg-stone-100/70">
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                            {product.image ? (
                              <img src={product.image.startsWith('http') ? product.image : `http://localhost:3000${product.image}`} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-stone-400" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-semibold text-stone-900">{product.title}</h4>
                            <p className="text-sm text-stone-500">{product.totalSold} sold • {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-[#6b493d]">Rs. {product.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">
                    <Package className="mx-auto mb-3 h-8 w-8 text-stone-300" />
                    <p className="font-semibold text-stone-700">No products sold yet.</p>
                    <p className="mt-1">Add products to start building your momentum.</p>
                  </div>
                )}
              </div>

              <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">Orders</p>
                    <h3 className="text-xl font-semibold text-stone-900">Recent orders</h3>
                  </div>
                  <button onClick={goToOrders} className="text-sm font-semibold text-[#6b493d] hover:underline">View all</button>
                </div>

                {stats.recentOrders && stats.recentOrders.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between rounded-2xl border border-stone-100 bg-stone-50/60 p-4 transition-colors hover:bg-stone-100/70">
                        <div>
                          <p className="font-semibold text-stone-900">Order #{order.id.substring(0, 8)}</p>
                          <p className="text-sm text-stone-500">{order.customer} • {order.items} item(s)</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-stone-900">Rs. {order.amount.toLocaleString()}</p>
                          <span className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                            order.status === 'Shipped' ? 'bg-emerald-100 text-emerald-700' :
                            order.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                            'bg-rose-100 text-rose-700'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-stone-200 bg-stone-50 px-4 py-10 text-center text-sm text-stone-500">
                    <ShoppingBag className="mx-auto mb-3 h-8 w-8 text-stone-300" />
                    <p className="font-semibold text-stone-700">No recent orders yet.</p>
                    <p className="mt-1">Orders will appear here as soon as they come in.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="overflow-hidden rounded-[28px] border border-stone-200 bg-white shadow-sm">
            <div className="flex flex-col gap-4 border-b border-stone-100 bg-[#fcfaf8] p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">Inventory</p>
                <h2 className="text-xl font-semibold text-stone-900">Product catalog</h2>
              </div>
              <button
                onClick={() => setActiveTab('add-product')}
                className="inline-flex items-center gap-2 rounded-full bg-[#6b493d] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#5a3c32]"
              >
                <Plus className="h-4 w-4" />
                <span>Add product</span>
              </button>
            </div>

            {products.length > 0 ? (
              <>
                <div className="hidden overflow-x-auto lg:block">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-stone-50 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                        <th className="p-4">Product</th>
                        <th className="p-4">Category</th>
                        <th className="p-4">Discount</th>
                        <th className="p-4">Price</th>
                        <th className="p-4">Stock</th>
                        <th className="p-4">Status</th>
                        <th className="p-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-100">
                      {products.map((product) => (
                        <tr key={product._id} className="transition-colors hover:bg-stone-50/70">
                          <td className="p-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-stone-100">
                                {product.images && product.images.length > 0 ? (
                                  <img src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:3000${product.images[0]}`} alt={product.title} className="h-full w-full object-cover" />
                                ) : (
                                  <ImageIcon className="h-5 w-5 text-stone-400" />
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-stone-900">{product.title}</p>
                                <p className="text-sm text-stone-500">{product.category || 'Uncategorized'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-stone-500">{product.category || 'N/A'}</td>
                          <td className="p-4 text-sm text-stone-500">{product.discountPercentage || 0}%</td>
                          <td className="p-4">
                            {product.discountPercentage > 0 ? (
                              <div className="flex flex-col">
                                <span className="text-sm text-stone-400 line-through">Rs. {product.price.toLocaleString()}</span>
                                <span className="font-semibold text-stone-900">Rs. {(
                                  product.price -
                                  (product.price * product.discountPercentage) / 100
                                ).toLocaleString()}</span>
                              </div>
                            ) : (
                              <span className="font-semibold text-stone-900">Rs. {product.price.toLocaleString()}</span>
                            )}
                          </td>
                          <td className="p-4">
                            <span className={`text-sm font-semibold ${product.countInStock <= 5 ? 'text-rose-600' : 'text-stone-600'}`}>
                              {product.countInStock}
                            </span>
                          </td>
                          <td className="p-4">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${
                              product.status === 'hidden' ? 'bg-stone-100 text-stone-700' :
                              product.countInStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                            }`}>
                              {product.status === 'hidden' ? 'Hidden' : product.countInStock > 0 ? 'Active' : 'Out of Stock'}
                            </span>
                          </td>
                          <td className="p-4">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleToggleVisibility(product)}
                                className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                                  product.status === 'hidden'
                                    ? 'bg-[#6b493d]/10 text-[#6b493d] hover:bg-[#6b493d]/20'
                                    : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                }`}
                              >
                                {product.status === 'hidden' ? <><Play className="mr-1 h-3.5 w-3.5" /> Reactivate</> : <><Pause className="mr-1 h-3.5 w-3.5" /> Pause</>}
                              </button>
                              <button onClick={() => handleOpenEditModal(product)} className="rounded-full p-2 text-stone-400 transition-colors hover:bg-stone-100 hover:text-[#6b493d]" title="Edit Product">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => handleDeleteClick(product)} className="rounded-full p-2 text-stone-400 transition-colors hover:bg-rose-50 hover:text-rose-600" title="Delete Product">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="grid gap-3 p-4 lg:hidden">
                  {products.map((product) => (
                    <div key={product._id} className="rounded-[22px] border border-stone-200 bg-stone-50/70 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-white">
                            {product.images && product.images.length > 0 ? (
                              <img src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:3000${product.images[0]}`} alt={product.title} className="h-full w-full object-cover" />
                            ) : (
                              <ImageIcon className="h-5 w-5 text-stone-400" />
                            )}
                          </div>
                          <div>
                            <p className="font-semibold text-stone-900">{product.title}</p>
                            <p className="text-sm text-stone-500">{product.category || 'Uncategorized'}</p>
                          </div>
                        </div>
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                          product.status === 'hidden' ? 'bg-stone-100 text-stone-700' :
                          product.countInStock > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                        }`}>
                          {product.status === 'hidden' ? 'Hidden' : product.countInStock > 0 ? 'Active' : 'Out of Stock'}
                        </span>
                      </div>
                      <div className="mt-4 flex items-center justify-between text-sm text-stone-600">
                        <span>Rs. {product.price.toLocaleString()}</span>
                        <span className="font-semibold text-stone-700">Stock {product.countInStock}</span>
                      </div>
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => handleToggleVisibility(product)}
                          className={`inline-flex items-center rounded-full px-3 py-1.5 text-xs font-semibold ${
                            product.status === 'hidden' ? 'bg-[#6b493d]/10 text-[#6b493d]' : 'bg-stone-100 text-stone-700'
                          }`}
                        >
                          {product.status === 'hidden' ? 'Reactivate' : 'Pause'}
                        </button>
                        <button onClick={() => handleOpenEditModal(product)} className="rounded-full bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 shadow-sm">Edit</button>
                        <button onClick={() => handleDeleteClick(product)} className="rounded-full bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700">Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-6 py-16 text-center text-stone-500">
                <Package className="mx-auto mb-3 h-12 w-12 text-stone-300" />
                <p className="text-base font-semibold text-stone-700">No products yet</p>
                <p className="mt-1 text-sm">Your catalog will appear here once you add your first listing.</p>
                <button onClick={() => setActiveTab('add-product')} className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#6b493d] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#5a3c32]">
                  <Plus className="h-4 w-4" />
                  Create your first product
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6">
            {reviewsLoading ? (
              /* Loading skeleton */
              <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-2xl bg-[#6b493d]/10 p-3">
                      <Loader2 className="h-5 w-5 animate-spin text-[#6b493d]" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 w-40 rounded-full bg-stone-200 animate-pulse" />
                      <div className="h-3 w-56 rounded-full bg-stone-100 animate-pulse" />
                    </div>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {Array.from({ length: 4 }).map((_, index) => (
                      <div key={index} className="rounded-2xl border border-stone-200 p-4">
                        <div className="h-3 w-24 rounded-full bg-stone-200 animate-pulse" />
                        <div className="mt-3 h-8 w-20 rounded-full bg-stone-100 animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : reviewsError ? (
              /* Error state */
              <div className="rounded-[28px] border border-red-100 bg-[#fff8f7] p-6 shadow-sm">
                <div className="flex flex-col items-center justify-center rounded-[24px] border border-red-100 bg-white px-6 py-16 text-center shadow-sm">
                  <div className="mb-4 rounded-2xl bg-red-50 p-4">
                    <AlertCircle className="h-8 w-8 text-red-500" />
                  </div>
                  <h2 className="text-lg font-semibold text-stone-900">Could not load reviews</h2>
                  <p className="mt-2 max-w-md text-sm text-stone-500">{reviewsError}</p>
                  <button
                    onClick={fetchSellerReviews}
                    className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#6b493d] px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-[#5a3c32]"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Try again
                  </button>
                </div>
              </div>
            ) : reviews.length === 0 ? (
              /* Empty state */
              <div className="rounded-[28px] border border-stone-200 bg-white p-6 shadow-sm">
                <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                  <div className="mb-4 rounded-2xl bg-amber-50 p-4">
                    <MessageSquareText className="h-10 w-10 text-amber-400" />
                  </div>
                  <h2 className="text-lg font-semibold text-stone-900">You have no reviews yet</h2>
                  <p className="mt-2 max-w-md text-sm text-stone-500">
                    When customers review your products after delivery, their feedback will appear here.
                  </p>
                </div>
              </div>
            ) : (
              /* Reviews content */
              <>
                {/* Summary Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="inline-flex rounded-2xl bg-amber-50 p-3 text-amber-700">
                      <Star className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-stone-500">Average Rating</p>
                      <div className="mt-1 flex items-center gap-3">
                        <p className="text-2xl font-semibold text-stone-900">{reviewsStats.averageRating}</p>
                        <StarDisplay rating={reviewsStats.averageRating} numReviews={reviewsStats.totalReviews} size={16} />
                      </div>
                    </div>
                  </div>
                  <div className="rounded-[24px] border border-stone-200 bg-white p-5 shadow-sm">
                    <div className="inline-flex rounded-2xl bg-violet-50 p-3 text-violet-700">
                      <MessageSquareText className="h-5 w-5" />
                    </div>
                    <div className="mt-4">
                      <p className="text-sm font-medium text-stone-500">Total Reviews</p>
                      <p className="mt-1 text-2xl font-semibold text-stone-900">{reviewsStats.totalReviews}</p>
                    </div>
                  </div>
                </div>

                {/* Reviews List */}
                <div className="rounded-[28px] border border-stone-200 bg-white shadow-sm overflow-hidden">
                  <div className="flex items-center justify-between border-b border-stone-100 bg-[#fcfaf8] p-5">
                    <div>
                      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-stone-400">Feedback</p>
                      <h2 className="text-xl font-semibold text-stone-900">Customer Reviews</h2>
                    </div>
                    <button
                      onClick={fetchSellerReviews}
                      className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition hover:bg-stone-50 hover:text-[#6b493d]"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      Refresh
                    </button>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {reviews.map((review) => (
                      <div key={review._id} className="p-5 transition-colors hover:bg-stone-50/50">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          {/* Left: Product + Review */}
                          <div className="flex-1 space-y-3">
                            {/* Product info */}
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-stone-100">
                                {review.product?.images && review.product.images.length > 0 ? (
                                  <img
                                    src={review.product.images[0].startsWith('http') ? review.product.images[0] : `http://localhost:3000${review.product.images[0]}`}
                                    alt={review.product?.title}
                                    className="h-full w-full object-cover"
                                  />
                                ) : (
                                  <ImageIcon className="h-4 w-4 text-stone-400" />
                                )}
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-stone-900">{review.product?.title || 'Unknown Product'}</p>
                                <div className="mt-0.5">
                                  <StarDisplay rating={review.rating} showText={false} size={13} />
                                </div>
                              </div>
                            </div>

                            {/* Review text */}
                            <p className="text-sm leading-relaxed text-stone-600">{review.comment}</p>

                            {/* Review images */}
                            {review.images && review.images.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {review.images.map((img, idx) => (
                                  <img
                                    key={idx}
                                    src={img.startsWith('http') ? img : `http://localhost:3000${img}`}
                                    alt={`Review image ${idx + 1}`}
                                    className="h-16 w-16 rounded-lg object-cover border border-stone-200"
                                  />
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Right: Reviewer + Date */}
                          <div className="flex flex-row items-center gap-3 sm:flex-col sm:items-end sm:text-right">
                            <div className="flex items-center gap-2">
                              {review.user?.profileImage ? (
                                <img
                                  src={review.user.profileImage.startsWith('http') ? review.user.profileImage : `http://localhost:3000${review.user.profileImage}`}
                                  alt={review.user?.username}
                                  className="h-7 w-7 rounded-full object-cover border border-stone-200"
                                />
                              ) : (
                                <div className="h-7 w-7 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-500">
                                  {review.user?.username?.charAt(0)?.toUpperCase() || '?'}
                                </div>
                              )}
                              <span className="text-sm font-medium text-stone-700">{review.user?.username || 'Anonymous'}</span>
                            </div>
                            <span className="text-xs text-stone-400">
                              {new Date(review.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Product</h3>
            <p className="text-gray-500 mb-6">
              Are you sure you want to delete <span className="font-semibold text-gray-900">{productToDelete?.title}</span>? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 font-medium hover:bg-gray-200 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-2 bg-red-500 text-white font-medium hover:bg-red-600 rounded-lg transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerDashboard;

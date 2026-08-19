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
  BadgeCheck, Clock, Star
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
      <div className="flex flex-col items-center justify-center py-20 w-full">
        <Loader2 className="w-10 h-10 text-[#6b493d] animate-spin mb-4" />
        <p className="text-[#8c6b5d] font-medium animate-pulse">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-20 w-full">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={fetchDashboardData}
          className="mt-4 px-4 py-2 bg-[#6b493d] text-white rounded-lg hover:bg-[#8c6b5d] transition-colors"
        >
          Try Again
        </button>
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
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <h1 className="text-4xl font-bold text-[#6b493d] tracking-wide">
            {sellerProfile?.storeName || 'Store Dashboard'}
          </h1>

          {/* Verification Badge */}
          {sellerProfile && (
            sellerProfile.isVerified ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-green-50 text-green-700 border border-green-200 shadow-sm self-start sm:self-auto">
                <BadgeCheck className="w-4 h-4 text-green-600" />
                Verified Seller
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200 self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5 text-red-600" />
                Pending Review
              </span>
            )
          )}
        </div>
        <p className="text-gray-500 mt-2">Manage your marketplace presence and track performance.</p>
      </div>

      {/* Navigation */}
      <div className="flex space-x-1 border-b border-gray-200 mb-8 overflow-x-auto hide-scrollbar">
        {[
          { id: 'overview', label: 'Overview', icon: TrendingUp },
          { id: 'products', label: 'Products', icon: Package },
          { id: 'reviews', label: 'Reviews', icon: Star }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-6 py-4 text-sm font-semibold border-b-2 whitespace-nowrap transition-all duration-300 ${
              activeTab === tab.id
                ? 'border-[#6b493d] text-[#6b493d] bg-[#6b493d]/5 rounded-t-lg'
                : 'border-transparent text-gray-500 hover:text-gray-800 hover:border-gray-300'
            }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[400px]">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Revenue', value: `Rs. ${stats.totalRevenue.toLocaleString()}`, icon: Wallet, color: 'bg-green-50 text-green-600' },
                { label: 'Total Orders', value: stats.totalOrders.toString(), icon: ShoppingBag, color: 'bg-blue-50 text-blue-600', onClick: goToOrders, clickable: true },
                { label: 'Active Products', value: stats.activeProducts.toString(), icon: Package, color: 'bg-purple-50 text-purple-600', onClick: () => setActiveTab('products'), clickable: true },
                { label: 'Low Stock Alerts', value: stats.lowStock.toString(), icon: AlertCircle, color: 'bg-orange-50 text-orange-600' }
              ].map((stat, i) => (
                <div 
                  key={i} 
                  onClick={stat.onClick ? stat.onClick : undefined}
                  className={`bg-white rounded-2xl p-6 shadow-sm border border-gray-100 transition-all ${
                    stat.clickable ? 'cursor-pointer hover:shadow-md hover:-translate-y-0.5' : 'hover:shadow-md'
                  }`}
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className={`p-3 rounded-xl ${stat.color}`}>
                      <stat.icon className="w-6 h-6" />
                    </div>
                  </div>
                  <h3 className="text-gray-500 text-sm font-medium">{stat.label}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <h3 className="text-2xl font-bold text-[#6b493d] mb-6">Revenue Overview</h3>
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
                  <div className="flex items-center justify-center h-full text-gray-400">
                    Not enough data for chart
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Section: Top Products & Recent Orders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Top Products */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-[#6b493d]">Top Selling Products</h3>
                  <button onClick={() => setActiveTab('products')} className="text-[#6b493d] text-sm font-medium hover:underline">View All</button>
                </div>
                
                {stats.topProducts && stats.topProducts.length > 0 ? (
                  <div className="space-y-4">
                    {stats.topProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-4 border border-gray-50 rounded-xl hover:bg-gray-50 transition-colors">
                        <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0">
                            {product.image ? (
                              <img src={product.image.startsWith('http') ? product.image : `http://localhost:3000${product.image}`} alt={product.title} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-5 h-5 text-gray-400" /></div>
                            )}
                          </div>
                          <div>
                            <h4 className="font-medium text-gray-900">{product.title}</h4>
                            <p className="text-sm text-gray-500">{product.totalSold} sold Ã¢â‚¬Â¢ {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-[#6b493d]">Rs. {product.revenue.toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <Package className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium">No products sold yet.</p>
                    <p className="text-sm mt-1">Add products to see your top sellers here.</p>
                  </div>
                )}
              </div>

              {/* Recent Orders */}
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-bold text-[#6b493d]">Recent Orders</h3>
                  <button onClick={goToOrders} className="text-[#6b493d] text-sm font-medium hover:underline">View All</button>
                </div>
                
                {stats.recentOrders && stats.recentOrders.length > 0 ? (
                  <div className="space-y-4">
                    {stats.recentOrders.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border border-gray-50 rounded-xl hover:bg-gray-50 transition-colors">
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.id.substring(0, 8)}</p>
                          <p className="text-sm text-gray-500">{order.customer} Ã¢â‚¬Â¢ {order.items} item(s)</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">Rs. {order.amount.toLocaleString()}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium mt-1 ${
                            order.status === 'Shipped' ? 'bg-green-100 text-green-800' : 
                            order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-10 text-center text-gray-500 border border-dashed border-gray-200 rounded-xl bg-gray-50">
                    <ShoppingBag className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="font-medium">No recent orders yet.</p>
                    <p className="text-sm mt-1">When customers buy from you, orders will appear here.</p>
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-[#fcfaf8]">
              <h2 className="text-2xl font-bold text-[#6b493d]">Product Catalog</h2>
              <button
                onClick={() => setActiveTab('add-product')}
                className="flex items-center space-x-2 bg-[#6b493d] hover:bg-[#8c6b5d] text-white px-4 py-2 rounded-lg transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>Add Product</span>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              {products.length > 0 ? (
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider">
                      <th className="p-4 font-medium">Product</th>
                      <th className="p-4 font-medium">Category</th>
                      <th className="p-4 font-medium">Discount</th>
                      <th className="p-4 font-medium">Price</th>
                      <th className="p-4 font-medium">Stock</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {products.map((product) => (
                      <tr key={product._id} className={`transition-colors ${product.countInStock <= 0 ? 'bg-red-50/50 hover:bg-red-50' : 'hover:bg-gray-50/50'}`}>
                        <td className="p-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                              {product.images && product.images.length > 0 ? (
                                <img src={product.images[0].startsWith('http') ? product.images[0] : `http://localhost:3000${product.images[0]}`} alt={product.title} className="w-full h-full object-cover" />
                              ) : (
                                <ImageIcon className="w-5 h-5 text-gray-400" />
                              )}
                            </div>
                            <span className="font-medium text-gray-900">{product.title}</span>
                          </div>
                        </td>
                        <td className="p-4 text-gray-500 text-sm">{product.category || 'N/A'}</td>
                        <td className="p-4 text-gray-500 text-sm">{product.discountPercentage || 0}%</td>
                        <td className="p-4">
                          {product.discountPercentage > 0 ? (
                            <div className="flex flex-col">
                              <span className="text-sm text-gray-400 line-through">
                                Rs. {product.price.toLocaleString()}
                              </span>
                              <span className="font-semibold text-gray-900">
                                Rs. {(
                                  product.price -
                                  (product.price * product.discountPercentage) / 100
                                ).toLocaleString()}
                              </span>
                            </div>
                          ) : (
                            <span className="font-medium text-gray-900">
                              Rs. {product.price.toLocaleString()}
                            </span>
                          )}
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1.5 text-sm ${product.countInStock <= 0 ? 'text-red-600 font-bold' : product.countInStock <= 5 ? 'text-orange-500 font-medium' : 'text-gray-500'}`}>
                            {product.countInStock <= 0 && <AlertCircle className="w-4 h-4 text-red-500" />}
                            {product.countInStock}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            product.status === 'hidden' ? 'bg-gray-100 text-gray-800' :
                            product.countInStock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {product.status === 'hidden' ? 'Hidden' : product.countInStock > 0 ? 'Active' : 'Out of Stock'}
                          </span>
                        </td>
                        <td className="p-4 text-right flex items-center justify-end space-x-2">
                          <button 
                            onClick={() => handleToggleVisibility(product)} 
                            className={`flex items-center px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                              product.status === 'hidden' 
                                ? 'bg-[#6b493d]/10 text-[#6b493d] hover:bg-[#6b493d]/20' 
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            {product.status === 'hidden' ? (
                              <><Play className="w-3.5 h-3.5 mr-1" /> Reactivate</>
                            ) : (
                              <><Pause className="w-3.5 h-3.5 mr-1" /> Pause</>
                            )}
                          </button>
                          <button onClick={() => handleOpenEditModal(product)} className="text-gray-400 hover:text-[#6b493d] p-2 transition-colors" title="Edit Product">
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDeleteClick(product)} className="text-gray-400 hover:text-red-500 p-2 transition-colors ml-1" title="Delete Product">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="p-12 text-center text-gray-500">
                  <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p>You haven't added any products yet.</p>
                  <button onClick={() => setActiveTab('add-product')} className="text-[#6b493d] font-medium mt-2 hover:underline">
                    Add your first product
                  </button>
                </div>
              )}
            </div>
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

import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { API_BASE_URL } from '../config';

export default function ReportedItems() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedRows, setExpandedRows] = useState({});
  const [actionLoading, setActionLoading] = useState(null);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchReportedProducts();
  }, []);

  const fetchReportedProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const res = await fetch(`${API_BASE_URL}/reports/admin/products`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) {
        throw new Error('Failed to fetch reported products');
      }
      
      const data = await res.json();
      setProducts(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleReinstate = async (productId) => {
    try {
      setActionLoading(productId);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const res = await fetch(`${API_BASE_URL}/reports/admin/products/${productId}/reinstate`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!res.ok) throw new Error('Failed to reinstate product');
      
      showToast('Product reinstated successfully');
      setProducts(prev => prev.filter(p => p._id !== productId));
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 text-[#a07855]">
        <RefreshCw size={24} className="animate-spin mr-2" />
        <span className="font-semibold">Loading reported items...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl flex items-center">
        <XCircle size={20} className="mr-2" />
        {error}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#EAE2D8] p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#6b493d]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Moderation Queue
          </h1>
          <p className="text-sm text-[#856046] mt-1">Review products flagged by the community</p>
        </div>
        <div className="flex items-center text-sm font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200">
          <ShieldAlert size={16} className="mr-2" />
          {products.length} {products.length === 1 ? 'Item' : 'Items'} Pending
        </div>
      </div>

      {toast && (
        <div className={`mb-4 p-3 rounded-lg text-sm font-medium border flex items-center ${
          toast.type === 'error' ? 'bg-red-50 text-red-600 border-red-200' : 'bg-green-50 text-green-600 border-green-200'
        }`}>
          {toast.message}
        </div>
      )}

      {products.length === 0 ? (
        <div className="text-center py-12 bg-[#F8F4ED] rounded-xl border border-dashed border-[#c9a280]">
          <ShieldAlert size={40} className="mx-auto text-[#c9a280] mb-3 opacity-50" />
          <h3 className="text-[#6b493d] font-semibold text-lg">No Reported Items</h3>
          <p className="text-[#856046] text-sm mt-1">The marketplace is currently clear of flagged content.</p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#EAE2D8] text-sm text-[#856046]">
                <th className="pb-3 font-semibold px-4">Product</th>
                <th className="pb-3 font-semibold px-4">Seller</th>
                <th className="pb-3 font-semibold px-4 text-center">Reports</th>
                <th className="pb-3 font-semibold px-4 text-center">Status</th>
                <th className="pb-3 font-semibold px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EAE2D8]">
              {products.map(product => (
                <React.Fragment key={product._id}>
                  <tr className="hover:bg-[#F8F4ED] transition-colors group">
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-3">
                        {product.images && product.images[0] ? (
                          <img 
                            src={product.images[0].startsWith('http') ? product.images[0] : `${API_BASE_URL.replace('/api', '')}${product.images[0]}`} 
                            alt={product.title} 
                            className="w-12 h-12 rounded-lg object-cover border border-[#EAE2D8]"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-100 rounded-lg border border-[#EAE2D8]" />
                        )}
                        <div>
                          <p className="text-sm font-semibold text-[#6b493d] max-w-[200px] truncate">{product.title}</p>
                          <button 
                            onClick={() => toggleRow(product._id)}
                            className="text-xs text-[#0F766E] hover:text-[#115E59] font-medium flex items-center mt-0.5 transition-colors"
                          >
                            {expandedRows[product._id] ? 'Hide reasons' : 'View reasons'}
                            {expandedRows[product._id] ? <ChevronUp size={14} className="ml-0.5" /> : <ChevronDown size={14} className="ml-0.5" />}
                          </button>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-sm font-medium text-[#6b493d]">{product.sellerId?.storeName || 'Unknown Store'}</p>
                      <p className="text-xs text-[#856046]">{product.sellerId?.name || 'No Name'}</p>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full text-xs font-bold ${
                        product.reportCount >= 5 ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-600'
                      }`}>
                        {product.reportCount}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      {product.isHidden ? (
                        <span className="inline-block px-2.5 py-1 bg-red-50 text-red-600 text-xs font-semibold rounded-full border border-red-100">
                          Hidden
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-1 bg-green-50 text-green-600 text-xs font-semibold rounded-full border border-green-100">
                          Active
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => handleReinstate(product._id)}
                        disabled={actionLoading === product._id}
                        className="bg-[#0F766E] hover:bg-[#115E59] disabled:opacity-50 text-white text-xs font-medium px-4 py-2 rounded-lg transition-colors inline-flex items-center"
                      >
                        {actionLoading === product._id ? (
                          <RefreshCw size={14} className="animate-spin mr-1.5" />
                        ) : null}
                        Reinstate
                      </button>
                    </td>
                  </tr>
                  
                  {/* Expanded Row for Report Details */}
                  {expandedRows[product._id] && (
                    <tr className="bg-[#FAFAFA]">
                      <td colSpan="5" className="px-4 py-4">
                        <div className="pl-14 border-l-2 border-[#0F766E] ml-4 space-y-3">
                          <h4 className="text-xs font-bold text-[#6b493d] uppercase tracking-wider">Report Reasons submitted by buyers:</h4>
                          {product.reportsList && product.reportsList.length > 0 ? (
                            <ul className="space-y-2">
                              {product.reportsList.map(report => (
                                <li key={report._id} className="text-sm bg-white p-2.5 rounded-lg border border-[#EAE2D8] flex items-center justify-between">
                                  <span className="font-medium text-red-600">{report.reason}</span>
                                  <span className="text-xs text-gray-400">Reporter: {report.reporter?.name || 'Unknown'}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-sm text-gray-500 italic">No detailed reasons available.</p>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { getMySellerProfile, checkSellerStatus } from '../services/sellerService';

const SellerDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [seller, setSeller] = useState(null);
  const [userSellerInfo, setUserSellerInfo] = useState({});

  useEffect(() => {
    const fetchSellerProfile = async () => {
      const { isSeller } = checkSellerStatus();
      
      if (!isSeller) {
        navigate('/seller/register');
        return;
      }

      try {
        const data = await getMySellerProfile();
        setSeller(data.seller);
        setUserSellerInfo({
          sellerStatus: data.sellerStatus,
          isSeller: data.isSeller,
          canBuy: data.canBuy
        });
      } catch (err) {
        if (err.message.includes('not found')) {
          navigate('/seller/register');
        } else {
          setError(err.message);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSellerProfile();
  }, [navigate]);

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800',
      verified: 'bg-green-100 text-green-800',
      suspended: 'bg-red-100 text-red-800'
    };

    const labels = {
      pending: 'Pending Approval',
      verified: 'Verified',
      suspended: 'Suspended'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[status] || styles.pending}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">{seller?.name}</h1>
              <p className="text-gray-600">{seller?.email}</p>
            </div>
            <div className="mt-4 md:mt-0">
              {getStatusBadge(seller?.status)}
            </div>
          </div>
        </div>

        {/* Status Message */}
        {seller?.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-yellow-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-yellow-800">Application Under Review</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your seller application is being reviewed by our team. You'll be able to list products once approved.
                </p>
              </div>
            </div>
          </div>
        )}

        {seller?.status === 'suspended' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <svg className="w-5 h-5 text-red-400 mr-3 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="font-medium text-red-800">Account Suspended</h3>
                <p className="text-sm text-red-700 mt-1">
                  {seller?.notes || 'Your seller account has been suspended. Please contact support for more information.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Seller Details */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Seller Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">Business Name</label>
              <p className="font-medium text-gray-800">{seller?.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Email</label>
              <p className="font-medium text-gray-800">{seller?.email}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">CNIC</label>
              <p className="font-medium text-gray-800">{seller?.cnic}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Location</label>
              <p className="font-medium text-gray-800">{seller?.location}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Member Since</label>
              <p className="font-medium text-gray-800">
                {seller?.createdAt ? new Date(seller.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">Status</label>
              <p className="font-medium text-gray-800 capitalize">{seller?.status}</p>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        {seller?.status === 'verified' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/seller/products"
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">My Products</h3>
                  <p className="text-sm text-gray-500">Manage your product listings</p>
                </div>
              </Link>
              <Link
                to="/seller/products/new"
                className="flex items-center p-4 border rounded-lg hover:bg-gray-50 transition"
              >
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-gray-800">Add Product</h3>
                  <p className="text-sm text-gray-500">List a new product for sale</p>
                </div>
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;

import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../config';

const AdoptionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [effectiveUser, setEffectiveUser] = useState(null);

  useEffect(() => {
    // Get user from storage if context user is not available
    const userFromStorage = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
    setEffectiveUser(user || userFromStorage);
  }, [user]);

  useEffect(() => {
    if (!effectiveUser?.id) {
      setLoading(false);
      setError('Please log in to view your adoption history');
      return;
    }
    
    fetchHistory();
  }, [effectiveUser]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await axios.get(`${API_BASE_URL}/adoptions/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Transform data to ensure consistent format
      const formattedData = response.data.map(item => ({
        _id: item._id || item.id,
        petName: item.petName || 'Unknown Pet',
        petType: item.petType || 'Unknown Type',
        petImage: item.petImage || 'https://via.placeholder.com/40?text=Pet',
        status: item.status?.toLowerCase() || 'pending',
        requestDate: item.requestDate || item.createdAt,
        responseDate: item.responseDate || null,
        message: item.message || '-'
      }));

      setHistory(formattedData);
    } catch (err) {
      console.error('Error fetching adoption history:', err);
      
      if (err.response?.status === 401) {
        // Handle unauthorized access
        localStorage.removeItem('token');
        sessionStorage.removeItem('token');
        navigate('/signin');
        setError('Please log in again');
      } else {
        setError(err.response?.data?.message || err.message || 'Failed to load adoption history');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'accepted': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5A2B]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 text-red-700 p-4 rounded-lg">
        <p className="font-semibold">Error</p>
        <p>{error}</p>
        {!effectiveUser && (
          <button 
            onClick={() => navigate('/login')}
            className="mt-4 px-4 py-2 bg-[#8B5A2B] text-white rounded-md hover:bg-[#6B493D] transition-colors"
          >
            Log In
          </button>
        )}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-10">
        <h2 className="text-xl font-semibold text-gray-700">No Adoption History</h2>
        <p className="text-gray-500 mt-2">You haven't made any adoption requests yet.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h2 className="text-2xl font-bold text-[#4E3B31] mb-6">My Adoption History</h2>
      
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-lg overflow-hidden shadow-lg">
          <thead className="bg-[#8B5A2B] text-white">
            <tr>
              <th className="px-6 py-3 text-left">Pet</th>
              <th className="px-6 py-3 text-left">Type</th>
              <th className="px-6 py-3 text-left">Request Date</th>
              <th className="px-6 py-3 text-left">Status</th>
              <th className="px-6 py-3 text-left">Response Date</th>
              <th className="px-6 py-3 text-left">Message</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {history.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img 
                      src={item.petImage} 
                      alt={item.petName}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/40?text=Pet';
                      }}
                    />
                    <span className="font-medium text-gray-900">{item.petName}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">{item.petType}</td>
                <td className="px-6 py-4 text-gray-700">{formatDate(item.requestDate)}</td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {formatDate(item.responseDate)}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {item.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdoptionHistory;
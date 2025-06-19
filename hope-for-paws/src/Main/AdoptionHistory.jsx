import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

const AdoptionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();
  const [effectiveUser, setEffectiveUser] = useState(null);

  useEffect(() => {
    // Check for user in localStorage/sessionStorage if not in context
    if (!user) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
        console.log('Stored user found:', storedUser);
        if (storedUser) {
          setEffectiveUser(storedUser);
        }
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    } else {
      setEffectiveUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (!effectiveUser) {
      setLoading(false);
      setError('Please log in to view your adoption history');
      return;
    }
    
    fetchHistory();
  }, [effectiveUser]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      if (!token) {
        throw new Error('No token found. Please log in again.');
      }

      console.log('Fetching adoption history with token:', token.substring(0, 10) + '...');
      
      const response = await fetch(`${API_BASE_URL}/adoptions/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });

      console.log('Response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          console.error('Error response data:', errorData);
          errorMessage = errorData.message || errorData.error || errorMessage;
          if (errorData.details) {
            console.error('Error details:', errorData.details);
          }
        } catch (e) {
          console.error('Error parsing error response:', e);
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log('Adoption history data:', data);
      setHistory(data);
    } catch (err) {
      console.error('Error fetching adoption history:', err);
      setError(err.message || 'Failed to fetch adoption history');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'accepted':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5A2B]"></div>
      </div>
    );
  }

  if (error && (!history || history.length === 0)) {
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
        <p>
          hello
        </p>
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
                  {item.responseDate ? formatDate(item.responseDate) : '-'}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {item.message || '-'}
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
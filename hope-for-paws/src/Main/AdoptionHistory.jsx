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

  useEffect(() => {
    if (!user) {
      navigate('/signin');
      return;
    }
    fetchHistory();
  }, [user, navigate]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      
      if (!token) {
        throw new Error('Authentication required');
      }

      const response = await fetch(`${API_BASE_URL}/adoptions/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to fetch adoption history');
      }

      const data = await response.json();
      console.log('Received history data:', data);
      
      // Handle paginated response
      if (data.data) {
        setHistory(data.data);
      } else {
        setHistory(data);
      }
    } catch (err) {
      console.error('Error fetching adoption history:', err);
      setError(err.message || 'Failed to fetch adoption history');
     
    } finally {
      setLoading(false);
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
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {history.map((item) => (
              <tr key={item._id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="flex items-center">
                    <img 
                      src={item.petImage || 'https://via.placeholder.com/40?text=Pet'} 
                      alt={item.petName || 'Pet'}
                      className="h-10 w-10 rounded-full object-cover mr-3"
                    />
                    <span className="font-medium text-gray-900">
                      {item.petName || 'Unknown Pet'}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {item.petType || 'Unknown'}
                </td>
                <td className="px-6 py-4 text-gray-700">
                  {new Date(item.requestDate).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'accepted' ? 'bg-green-100 text-green-800' :
                    item.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {item.status || 'pending'}
                  </span>
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
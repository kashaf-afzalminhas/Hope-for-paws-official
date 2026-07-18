import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL } from '../config';
import AdoptionHistoryCard from '../components/adoption/AdoptionHistoryCard';
import { adoptionGridClass } from '../components/adoption/adoptionTheme';
import { useRequireAuth } from '../Components/AuthGuard';

const AdoptionHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const requireAuth = useRequireAuth();
  const [effectiveUser, setEffectiveUser] = useState(null);

  useEffect(() => {
    if (!user) {
      try {
        const storedUser = JSON.parse(localStorage.getItem('user')) || JSON.parse(sessionStorage.getItem('user'));
        if (storedUser) setEffectiveUser(storedUser);
      } catch (e) {
        console.error('Error parsing stored user:', e);
      }
    } else {
      setEffectiveUser(user);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      setError('Please log in to view your adoption history');
      return;
    }
    fetchHistory();
  }, [user]);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) throw new Error('No token found. Please log in again.');

      const response = await fetch(`${API_BASE_URL}/adoptions/history`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache',
        },
      });

      if (!response.ok) {
        let errorMessage = `Server error: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorData.error || errorMessage;
        } catch {
          /* ignore */
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching adoption history:', err);
      setError(err.message || 'Failed to fetch adoption history');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-[#a07855] border-t-transparent" />
      </div>
    );
  }

  if (error && (!history || history.length === 0)) {
    return (
      <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-rose-800">
        <p className="font-semibold">Error</p>
        <p className="mt-1 text-sm">{error}</p>
        {!effectiveUser && (
          <button
            type="button"
            onClick={() => requireAuth('view your adoption history')}
            className="mt-4 rounded-xl bg-[#6b493d] px-4 py-2 text-sm font-medium text-white transition hover:bg-[#5a3d32]"
          >
            Log in
          </button>
        )}
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="rounded-2xl border-2 border-dashed border-[#e8dcc8] bg-[#faf6f0] py-14 text-center">
        <h2 className="text-xl font-semibold text-[#4E3B31]">No adoption history</h2>
        <p className="mt-2 text-[#6F4C3E]/70">You haven&apos;t made any adoption requests yet.</p>
      </div>
    );
  }

  return (
    <div className="w-full py-2 sm:py-4">
      <h2 className="mb-2 text-2xl font-bold text-[#4E3B31] sm:text-3xl">My adoption history</h2>
      <div className={adoptionGridClass}>
        {history.map((item) => (
          <AdoptionHistoryCard key={item.id || item._id} item={item} />
        ))}
      </div>
    </div>
  );
};

export default AdoptionHistory;

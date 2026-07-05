import React, { useState } from 'react';
import { X, Flag, AlertTriangle, Loader2 } from 'lucide-react';
import { API_BASE_URL } from '../config';
import { useAuth } from '../context/AuthContext';

const REASON_OPTIONS = [
  "Suspicious or Scam",
  "Counterfeit Item",
  "Inappropriate Content",
  "Incorrect Category",
  "Other"
];

export default function ReportModal({ productId, isOpen, onClose }) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedReason) {
      setError("Please select a reason for reporting.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      
      const res = await fetch(`${API_BASE_URL}/reports/product`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          targetProduct: productId,
          reason: selectedReason
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to submit report');
      }

      setSuccess(true);
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setSelectedReason("");
      }, 2000);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#EAE2D8]">
          <div className="flex items-center gap-2 text-[#6b493d]">
            <AlertTriangle size={20} className="text-red-500" />
            <h2 className="text-lg font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
              Report Product
            </h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
            disabled={isSubmitting || success}
          >
            <X size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Flag size={32} />
              </div>
              <h3 className="text-xl font-bold text-[#6b493d] mb-2">Report Submitted</h3>
              <p className="text-[#856046] text-sm">
                Thank you for helping keep our community safe. Our team will review this listing shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-sm text-[#856046] mb-5">
                Why are you reporting this product? Please select the most accurate reason below.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-start gap-2">
                  <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-3 mb-6">
                {REASON_OPTIONS.map((reason) => (
                  <label 
                    key={reason} 
                    className={`flex items-center p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                      selectedReason === reason 
                        ? 'border-red-500 bg-red-50' 
                        : 'border-[#EAE2D8] hover:border-[#c9a280] hover:bg-[#F8F4ED]'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center mr-3 ${
                      selectedReason === reason ? 'border-red-500' : 'border-gray-300'
                    }`}>
                      {selectedReason === reason && <div className="w-2 h-2 rounded-full bg-red-500" />}
                    </div>
                    <span className={`text-sm font-medium ${selectedReason === reason ? 'text-red-700' : 'text-[#6b493d]'}`}>
                      {reason}
                    </span>
                    <input 
                      type="radio" 
                      name="reportReason" 
                      value={reason}
                      checked={selectedReason === reason}
                      onChange={(e) => setSelectedReason(e.target.value)}
                      className="hidden"
                    />
                  </label>
                ))}
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isSubmitting}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-[#856046] bg-[#F8F4ED] hover:bg-[#EAE2D8] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || !selectedReason}
                  className="flex-1 py-2.5 px-4 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {isSubmitting ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    'Submit Report'
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

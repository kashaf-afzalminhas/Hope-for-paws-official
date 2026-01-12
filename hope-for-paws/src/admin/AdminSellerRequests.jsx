import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { sellerRequests } from './sellerData';

const AdminSellerRequests = () => {
  const [requests] = useState(sellerRequests);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Verified': return 'bg-green-100 text-green-800 border-green-200';
      case 'Rejected': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 md:p-8 bg-[#fdfbf7] min-h-screen">
      
      {/* 1. Header Section (Stacks on Mobile) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#4a342e]">Seller Applications</h1>
          <p className="text-sm md:text-base text-[#8d6e63] mt-1">Manage and review new shop requests.</p>
        </div>
        
        {/* Stats Cards */}
        <div className="flex w-full md:w-auto gap-3">
          <div className="flex-1 md:flex-none bg-white px-4 py-2 rounded-lg shadow-sm border border-[#e5e0d8] text-center">
            <span className="block text-xl font-bold text-[#4a342e]">{requests.filter(r => r.status === 'Pending').length}</span>
            <span className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Pending</span>
          </div>
          <div className="flex-1 md:flex-none bg-white px-4 py-2 rounded-lg shadow-sm border border-[#e5e0d8] text-center">
            <span className="block text-xl font-bold text-green-700">{requests.filter(r => r.status === 'Verified').length}</span>
            <span className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Active</span>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------ */}
      {/* VIEW 1: DESKTOP TABLE (Hidden on Mobile)               */}
      {/* ------------------------------------------------------ */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-[#e5e0d8] overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#f8f5f0] border-b border-[#e5e0d8]">
            <tr>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide">Seller</th>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide">Shop Type</th>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide">Date Applied</th>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide">Status</th>
              <th className="p-5 text-sm font-bold text-[#5d4037] uppercase tracking-wide text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0ebe0]">
            {requests.map((req) => (
              <tr key={req.id} className="hover:bg-[#faf9f6] transition-colors">
                <td className="p-5">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[#a07855] text-white flex items-center justify-center font-bold shadow-sm">
                      {req.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-[#4a342e]">{req.name}</p>
                      <p className="text-xs text-[#8d6e63]">{req.shopName}</p>
                    </div>
                  </div>
                </td>
                <td className="p-5 text-[#5d4037] font-medium">{req.type}</td>
                <td className="p-5 text-gray-500 text-sm">{req.dateApplied}</td>
                <td className="p-5">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border ${getStatusStyle(req.status)}`}>
                    {req.status}
                  </span>
                </td>
                <td className="p-5 text-right">
                  <Link to={`/admin-dashboard/seller-request/${req.id}`} className="inline-block px-4 py-2 bg-white border border-[#a07855] text-[#a07855] font-bold text-sm rounded-lg hover:bg-[#a07855] hover:text-white transition-all shadow-sm">
                    View Details
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ------------------------------------------------------ */}
      {/* VIEW 2: MOBILE CARDS (Visible ONLY on Mobile)          */}
      {/* ------------------------------------------------------ */}
      <div className="md:hidden space-y-4">
        {requests.map((req) => (
          <div key={req.id} className="bg-white p-4 rounded-xl shadow-sm border border-[#e5e0d8]">
            
            {/* Top Row: Avatar, Name, Status */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#a07855] text-white flex items-center justify-center font-bold shadow-sm">
                  {req.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-[#4a342e]">{req.name}</p>
                  <p className="text-xs text-[#8d6e63]">{req.shopName}</p>
                </div>
              </div>
              <span className={`px-2 py-1 rounded text-[10px] font-bold border ${getStatusStyle(req.status)}`}>
                {req.status}
              </span>
            </div>

            {/* Middle Row: Info */}
            <div className="grid grid-cols-2 gap-2 text-sm text-[#5d4037] mb-4 bg-[#fdfbf7] p-3 rounded-lg">
              <div>
                <span className="block text-[10px] text-[#8d6e63] uppercase font-bold">Type</span>
                {req.type}
              </div>
              <div>
                <span className="block text-[10px] text-[#8d6e63] uppercase font-bold">Date</span>
                {req.dateApplied}
              </div>
            </div>

            {/* Bottom Row: Button */}
            <Link 
              to={`/admin-dashboard/seller-request/${req.id}`}
              className="block w-full text-center py-2 bg-[#a07855] text-white font-bold text-sm rounded-lg hover:bg-[#8d6e63] transition-colors shadow-sm"
            >
              View Application
            </Link>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {requests.length === 0 && (
        <div className="p-10 text-center text-[#8d6e63]">
          No requests found.
        </div>
      )}
    </div>
  );
};

export default AdminSellerRequests;
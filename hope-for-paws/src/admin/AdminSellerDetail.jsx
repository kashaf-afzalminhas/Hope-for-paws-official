import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { sellerRequests } from './sellerData';

const AdminSellerDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [seller, setSeller] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  useEffect(() => {
    const found = sellerRequests.find(s => s.id === parseInt(id));
    if (found) setSeller(found);
  }, [id]);

  const handleApprove = () => {
    if (window.confirm(`Are you sure you want to verify ${seller.shopName}?`)) {
      const targetIndex = sellerRequests.findIndex(s => s.id === seller.id);
      if (targetIndex !== -1) {
        sellerRequests[targetIndex].status = "Verified";
      }
      alert("✅ Seller Approved Successfully!");
      navigate('/admin-dashboard/seller-requests');
    }
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    const targetIndex = sellerRequests.findIndex(s => s.id === seller.id);
    if (targetIndex !== -1) {
      sellerRequests[targetIndex].status = "Rejected";
    }
    alert(`❌ Seller Rejected. Reason: ${rejectReason}`);
    setShowRejectModal(false);
    navigate('/admin-dashboard/seller-requests');
  };

  if (!seller) return <div className="p-10 text-center">Loading...</div>;

  return (
    <div className="p-4 md:p-8 bg-[#fdfbf7] min-h-screen">
      
      {/* 1. Header (Responsive: Stacks on mobile) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 md:mb-8 gap-4">
        <div className="flex items-center gap-4">
          <Link to="/admin-dashboard/seller-requests" className="text-[#a07855] font-bold hover:underline shrink-0">
            &larr; Back
          </Link>
          <h1 className="text-xl md:text-2xl font-bold text-[#4a342e]">Review Application</h1>
        </div>
        
        {/* Status Badge (Self-adjusting width) */}
        <span className={`self-start md:self-auto px-4 py-1 rounded-full text-sm font-bold uppercase tracking-wide bg-yellow-100 text-yellow-800 border border-yellow-200`}>
          {seller.status}
        </span>
      </div>

      {/* 2. Main Grid (Stacks on mobile, 3 cols on Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        
        {/* LEFT COLUMN: Main Information */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Card 1: Basic Info */}
          <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-[#e5e0d8]">
            <h2 className="text-lg font-bold text-[#5d4037] mb-4 border-b border-[#f0ebe0] pb-2">
              📋 Basic Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Seller Name</label>
                <p className="font-medium text-[#4a342e] text-base md:text-lg">{seller.name}</p>
              </div>
              <div>
                <label className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Shop Name</label>
                <p className="font-medium text-[#4a342e] text-base md:text-lg">{seller.shopName}</p>
              </div>
              <div className="overflow-hidden">
                <label className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Email</label>
                <p className="font-medium text-[#4a342e] truncate">{seller.email}</p>
              </div>
              <div>
                <label className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Phone</label>
                <p className="font-medium text-[#4a342e]">{seller.phone}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">About Shop</label>
                <p className="text-[#5d4037] mt-1 leading-relaxed text-sm md:text-base">{seller.description}</p>
              </div>
            </div>
          </div>

          {/* Card 2: Address */}
          <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-[#e5e0d8]">
            <h2 className="text-lg font-bold text-[#5d4037] mb-4 border-b border-[#f0ebe0] pb-2">
              📍 Location Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">City</label>
                <p className="font-medium text-[#4a342e]">{seller.city}</p>
              </div>
              <div>
                <label className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Type</label>
                <p className="font-medium text-[#4a342e]">{seller.type}</p>
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] md:text-xs text-[#8d6e63] uppercase font-bold">Full Address</label>
                <p className="font-medium text-[#4a342e]">{seller.address}</p>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Documents & Actions */}
        <div className="space-y-6">
          
          {/* Card 3: Documents */}
          <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-[#e5e0d8]">
            <h2 className="text-lg font-bold text-[#5d4037] mb-4 border-b border-[#f0ebe0] pb-2">
              📂 Documents
            </h2>
            
            <div className="mb-4">
              <p className="text-sm font-bold text-[#4a342e] mb-2">CNIC (Front)</p>
              <div className="bg-[#f8f5f0] h-32 md:h-32 rounded-lg border-2 border-dashed border-[#d7ccc8] flex items-center justify-center overflow-hidden">
                {seller.cnicImage ? (
                  <img src={seller.cnicImage} alt="CNIC" className="w-full h-full object-cover" onClick={() => window.open(seller.cnicImage, '_blank')} />
                ) : (
                  <span className="text-xs text-[#8d6e63]">No Image</span>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-[#4a342e] mb-2">License</p>
              <div className="bg-[#f8f5f0] h-32 md:h-32 rounded-lg border-2 border-dashed border-[#d7ccc8] flex items-center justify-center overflow-hidden">
                {seller.licenseImage ? (
                  <img src={seller.licenseImage} alt="License" className="w-full h-full object-cover" onClick={() => window.open(seller.licenseImage, '_blank')} />
                ) : (
                  <span className="text-xs text-[#8d6e63]">Not Provided</span>
                )}
              </div>
            </div>
          </div>

          {/* Card 4: Action Buttons */}
          {seller.status === 'Pending' && (
            <div className="bg-white p-5 md:p-6 rounded-xl shadow-sm border border-[#e5e0d8] sticky top-6">
              <h2 className="text-lg font-bold text-[#5d4037] mb-4">Actions</h2>
              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleApprove}
                  className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg shadow-md transition-all active:scale-95"
                >
                  ✅ Approve
                </button>
                <button 
                  onClick={() => setShowRejectModal(true)}
                  className="w-full py-3 bg-white border-2 border-red-100 text-red-500 font-bold rounded-lg hover:bg-red-50 transition-colors"
                >
                  ❌ Reject
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* REJECT MODAL */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-[#4a342e] mb-2">Reject Application</h3>
            <p className="text-[#8d6e63] text-sm mb-4">Reason for rejection:</p>
            <form onSubmit={handleRejectSubmit}>
              <textarea 
                className="w-full border border-[#d7ccc8] rounded-lg p-3 text-sm focus:ring-2 focus:ring-[#a07855] outline-none mb-4 min-h-[100px]"
                placeholder="e.g., CNIC is blurry..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                required
              />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowRejectModal(false)} className="px-4 py-2 text-[#5d4037] font-bold">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-red-500 text-white font-bold rounded-lg">Confirm</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default AdminSellerDetail;
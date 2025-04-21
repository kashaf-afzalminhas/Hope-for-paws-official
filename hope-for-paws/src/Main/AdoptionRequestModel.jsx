// import React, { useState } from 'react';
// import axios from 'axios';

// const AdoptionRequestModal = ({ adId, onClose, onSuccess }) => {
//   const [formData, setFormData] = useState({
//     name: '',
//     email: '',
//     phone: '',
//     message: ''
//   });

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       const token = localStorage.getItem('token') || sessionStorage.getItem('token');
//       await axios.post('http://localhost:3000/api/requests', {
//         adId,
//         ...formData
//       }, {
//         headers: {
//           Authorization: `Bearer ${token}`
//         }
//       });
//       onSuccess();
//       onClose();
//     } catch (error) {
//       console.error('Error submitting request:', error);
//       alert('Failed to submit adoption request');
//     }
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
//       <div className="bg-white rounded-lg p-6 w-full max-w-md">
//         <div className="flex justify-between items-center mb-4">
//           <h3 className="text-xl font-bold text-[#6b493d]">Adoption Request</h3>
//           <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
//             ✕
//           </button>
//         </div>
//         <form onSubmit={handleSubmit} className="space-y-4">
//           <div>
//             <label className="block text-sm font-medium text-[#6b493d] mb-1">Your Name</label>
//             <input
//               type="text"
//               value={formData.name}
//               onChange={(e) => setFormData({...formData, name: e.target.value})}
//               className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-[#6b493d] mb-1">Email</label>
//             <input
//               type="email"
//               value={formData.email}
//               onChange={(e) => setFormData({...formData, email: e.target.value})}
//               className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-[#6b493d] mb-1">Phone</label>
//             <input
//               type="tel"
//               value={formData.phone}
//               onChange={(e) => setFormData({...formData, phone: e.target.value})}
//               className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
//               required
//             />
//           </div>
//           <div>
//             <label className="block text-sm font-medium text-[#6b493d] mb-1">Message</label>
//             <textarea
//               value={formData.message}
//               onChange={(e) => setFormData({...formData, message: e.target.value})}
//               className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
//               rows={3}
//               required
//             />
//           </div>
//           <div className="flex justify-end space-x-3">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 text-[#6b493d] border border-[#6b493d] rounded hover:bg-[#6b493d]/10"
//             >
//               Cancel
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-[#6b493d] text-white rounded hover:bg-[#5a3d32]"
//             >
//               Submit Request
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default AdoptionRequestModal;


import React, { useState } from 'react';

const AdoptionRequestModel = ({ petName, onClose, onSubmit, loading }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: ''
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-xl font-bold text-[#6b493d]">Adoption Request</h3>
            <p className="text-sm text-[#6b493d]">For: {petName}</p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-500 hover:text-gray-700"
            disabled={loading}
          >
            ✕
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#6b493d] mb-1">Your Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
              className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6b493d] mb-1">Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6b493d] mb-1">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({...formData, phone: e.target.value})}
              className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
              required
              disabled={loading}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6b493d] mb-1">Message</label>
            <textarea
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full p-2 border border-[#c9a280] rounded focus:ring-[#6b493d] focus:border-[#6b493d]"
              rows={3}
              required
              disabled={loading}
            />
          </div>
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-[#6b493d] border border-[#6b493d] rounded hover:bg-[#6b493d]/10"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#6b493d] text-white rounded hover:bg-[#5a3d32] flex items-center justify-center"
              disabled={loading}
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                </>
              ) : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AdoptionRequestModel;
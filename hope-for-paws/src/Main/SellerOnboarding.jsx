import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { onboardSeller, updateLocalUserAsSeller } from '../services/sellerService';
import { useAuth } from '../context/AuthContext';
import { User, Store, Mail, Phone, MapPin, UploadCloud, CheckCircle, PawPrint } from 'lucide-react';
import PhoneNumberInput, { getFullPhoneNumber, parsePhoneNumber, validatePhone } from '../Components/PhoneNumberInput';

const SellerOnboarding = () => {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    fullName: '',
    storeName: '',
    email: '',
    phone: '',
    countryCode: '+92',
    address: '',
  });

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        fullName: user.username || user.fullName || prev.fullName,
        email: user.email || '',
        ...parsePhoneNumber(user.phone)
      }));
    }
  }, [user]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (formData.fullName.length < 2 || formData.fullName.length > 100) {
      newErrors.fullName = 'Full name must be 2-100 characters';
    }

    if (!formData.storeName.trim()) {
      newErrors.storeName = 'Store name is required';
    } else if (formData.storeName.length < 2 || formData.storeName.length > 100) {
      newErrors.storeName = 'Store name must be 2-100 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Valid email is required';
    }

    const phoneError = validatePhone(formData.phone, formData.countryCode);
    if (phoneError) newErrors.phone = phoneError;

    if (!formData.address.trim()) {
      newErrors.address = 'Address is required';
    } else if (formData.address.length < 2 || formData.address.length > 200) {
      newErrors.address = 'Address must be 2-200 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        setError('Please upload a valid image file');
        return;
      }
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; 
    setError('');

    if (!validateForm()) {
      // Scroll to top to see validation errors
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);

    try {
      const submitData = new FormData();
      submitData.append('fullName', formData.fullName);
      submitData.append('storeName', formData.storeName);
      submitData.append('email', formData.email);
      submitData.append('phone', getFullPhoneNumber(formData.phone, formData.countryCode));
      submitData.append('address', formData.address);
      if (profileImage) {
        submitData.append('profileImage', profileImage);
      }

      await onboardSeller(submitData);
      
      const updatedUser = updateLocalUserAsSeller('pending');
      if (updatedUser) {
        updatedUser.phone = getFullPhoneNumber(formData.phone, formData.countryCode);
        updatedUser.phoneVerified = true;
        const userStorage = localStorage.getItem('user') ? localStorage : sessionStorage;
        userStorage.setItem('user', JSON.stringify(updatedUser));
        updateUser(updatedUser);
      }
      
      setSuccess(true);
      
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError(err.message || 'Failed to complete onboarding');
      setLoading(false); 
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const pageVariants = {
    initial: { opacity: 0, y: 30 },
    in: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
    out: { opacity: 0, y: -30 }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } }
  };

  return (
    <div className="min-h-screen bg-[#F8F4ED] flex flex-col font-sans relative overflow-x-hidden">
      {/* Dynamic Background Elements */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#a07855] opacity-[0.08] rounded-full blur-3xl pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-[#6b493d] opacity-[0.06] rounded-full blur-3xl pointer-events-none"></div>



      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 sm:px-6 z-10">
        <div className="w-full max-w-[800px] text-center mb-8">
          <h1 className="text-4xl sm:text-5xl font-extrabold text-[#3d2a24] tracking-tight mb-4 font-serif">
            Start Selling Today
          </h1>
          <p className="text-[#6b493d] text-lg max-w-2xl mx-auto font-medium">
            Join thousands of pet lovers. Complete your profile to unlock your dedicated Store Dashboard and start reaching customers nationwide.
          </p>
        </div>

        <motion.div 
          initial="initial" animate="in" exit="out" variants={pageVariants}
          className="w-full max-w-[800px] bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_30px_60px_rgba(107,73,61,0.06)] rounded-3xl overflow-hidden"
        >
          {success ? (
            <div className="text-center py-20 px-8">
              <motion.div 
                initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", bounce: 0.5 }}
                className="w-28 h-28 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-green-100 shadow-inner"
              >
                <CheckCircle className="w-14 h-14 text-green-500" />
              </motion.div>
              <h2 className="text-4xl font-extrabold text-[#3d2a24] tracking-tight mb-4">You're All Set!</h2>
              <p className="text-[#a07f77] text-xl mb-10 max-w-md mx-auto">Your store profile has been successfully created. We are redirecting you to your dashboard.</p>
              <div className="w-full max-w-sm mx-auto bg-gray-100 rounded-full h-2 overflow-hidden shadow-inner">
                 <motion.div initial={{ width: "0%" }} animate={{ width: "100%" }} transition={{ duration: 2, ease: "linear" }} className="bg-gradient-to-r from-[#a07855] to-[#6b493d] h-2 rounded-full"></motion.div>
              </div>
            </div>
          ) : (
            <>
              {/* Form Header inside card */}
              <div className="bg-[#fcfaf8] border-b border-[#e8dfd5] px-8 sm:px-12 py-8 flex items-center gap-4">
                <div className="w-12 h-12 bg-[#f5f0eb] rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-6 h-6 text-[#a07855]" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-[#3d2a24] tracking-tight">Business Profile</h2>
                  <p className="text-[#a07f77] text-sm">Please provide accurate details for your store.</p>
                </div>
              </div>

              <div className="p-8 sm:px-12 sm:pb-12 pt-6">
            <AnimatePresence>
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }} 
                  animate={{ opacity: 1, height: 'auto', marginBottom: 32 }} 
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-r-lg shadow-sm"
                >
                  <div className="flex items-center">
                    <svg className="w-5 h-5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <p className="font-semibold">{error}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <form onSubmit={handleSubmit}>
              <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-8">
                
                {/* Image Upload Section */}
                <motion.div variants={itemVariants} className="flex flex-col items-center mb-12">
                  <div className="relative group cursor-pointer" onClick={() => fileInputRef.current.click()}>
                    <div className={`w-36 h-36 rounded-full overflow-hidden border-4 border-dashed transition-all duration-300 flex items-center justify-center shadow-sm
                      ${imagePreview ? 'border-[#a07855] shadow-md' : 'border-gray-300 bg-gray-50 group-hover:border-[#a07855] group-hover:bg-[#F8F4ED]'}`}>
                      {imagePreview ? (
                        <img src={imagePreview} alt="Store Profile" className="w-full h-full object-cover" />
                      ) : (
                        <div className="flex flex-col items-center text-gray-400 group-hover:text-[#a07855] transition-colors">
                          <UploadCloud className="w-10 h-10 mb-2" />
                          <span className="text-xs font-bold uppercase tracking-wider">Upload Logo</span>
                        </div>
                      )}
                    </div>
                    {imagePreview && (
                      <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <span className="text-white text-sm font-bold uppercase tracking-wider">Change</span>
                      </div>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden"
                  />
                  <p className="mt-4 text-sm text-gray-500 font-semibold tracking-wide">STORE LOGO (OPTIONAL)</p>
                </motion.div>

                {/* Form Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  
                  {/* Full Name */}
                  <motion.div variants={itemVariants} className="md:col-span-2">
                    <label htmlFor="fullName" className="block text-xs font-bold text-[#8d6e63] mb-2 uppercase tracking-widest">
                      Full Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <User className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        placeholder="e.g., Ali Khan"
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-[#a07855] focus:border-transparent outline-none transition-all duration-200 text-[#4E3B31] font-medium ${
                          errors.fullName ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.fullName && <p className="mt-2 text-sm text-red-500 font-medium flex items-center"><span className="mr-1">⚠️</span>{errors.fullName}</p>}
                  </motion.div>

                  {/* Store Name */}
                  <motion.div variants={itemVariants} className="md:col-span-2">
                    <label htmlFor="storeName" className="block text-xs font-bold text-[#8d6e63] mb-2 uppercase tracking-widest">
                      Store Name *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Store className="h-5 w-5" />
                      </div>
                      <input
                        type="text"
                        id="storeName"
                        name="storeName"
                        value={formData.storeName}
                        onChange={handleChange}
                        placeholder="e.g., Karachi Pet Haven"
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-[#a07855] focus:border-transparent outline-none transition-all duration-200 text-[#4E3B31] font-medium ${
                          errors.storeName ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.storeName && <p className="mt-2 text-sm text-red-500 font-medium flex items-center"><span className="mr-1">⚠️</span>{errors.storeName}</p>}
                  </motion.div>

                  {/* Email Address */}
                  <motion.div variants={itemVariants}>
                    <label htmlFor="email" className="block text-xs font-bold text-[#8d6e63] mb-2 uppercase tracking-widest">
                      Email Address *
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
                        <Mail className="h-5 w-5" />
                      </div>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        placeholder="store@example.pk"
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-[#a07855] focus:border-transparent outline-none transition-all duration-200 text-[#4E3B31] font-medium ${
                          errors.email ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      />
                    </div>
                    {errors.email && <p className="mt-2 text-sm text-red-500 font-medium flex items-center"><span className="mr-1">⚠️</span>{errors.email}</p>}
                  </motion.div>

                  {/* Phone Number */}
                  <motion.div variants={itemVariants}>
                    <PhoneNumberInput
                      phone={formData.phone}
                      countryCode={formData.countryCode}
                      required
                      label="Phone Number"
                      touched={Boolean(errors.phone)}
                      error={errors.phone}
                      disabled={loading}
                      onChange={({ phone, countryCode, error }) => {
                        setFormData((prev) => ({ ...prev, phone, countryCode }));
                        setErrors((prev) => ({ ...prev, phone: error || '' }));
                      }}
                      className="[&>div>select]:!rounded-xl [&>div>select]:!border-gray-200 [&>div>select]:!bg-gray-50 [&>div>select]:!py-3.5 [&>div>input]:!rounded-xl [&>div>input]:!border-gray-200 [&>div>input]:!bg-gray-50 [&>div>input]:!py-3.5"
                    />
                  </motion.div>

                  {/* Address */}
                  <motion.div variants={itemVariants} className="md:col-span-2">
                    <label htmlFor="address" className="block text-xs font-bold text-[#8d6e63] mb-2 uppercase tracking-widest">
                      Business Address *
                    </label>
                    <div className="relative">
                      <div className="absolute top-3.5 left-0 pl-4 flex items-start pointer-events-none text-gray-400">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <textarea
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleChange}
                        placeholder="e.g., Shop #12, Pet Market, DHA Phase 5, Lahore"
                        rows="3"
                        className={`w-full pl-12 pr-4 py-3.5 bg-gray-50 border rounded-xl focus:bg-white focus:ring-2 focus:ring-[#a07855] focus:border-transparent outline-none transition-all duration-200 resize-none text-[#4E3B31] font-medium leading-relaxed ${
                          errors.address ? 'border-red-500 ring-1 ring-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                        }`}
                      ></textarea>
                    </div>
                    {errors.address && <p className="mt-2 text-sm text-red-500 font-medium flex items-center"><span className="mr-1">⚠️</span>{errors.address}</p>}
                  </motion.div>

                    <motion.div variants={itemVariants} className="md:col-span-2 mt-8 rounded-2xl border-2 border-[#ede6e1] bg-[#faf7f5] p-5">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-bold text-[#4E3B31]">Bank details / payout information</h3>
                        <span className="inline-flex items-center rounded-full border border-[#c9a280]/60 bg-[#f3e7dc] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6b493d]">
                          Coming soon
                        </span>
                      </div>
                      <p className="mt-2 text-sm font-medium text-[#a07f77]">Online payments are not available yet, so you do not need to add bank information.</p>
                    </motion.div>

                </div>

                {/* Submit Button */}
                <motion.div variants={itemVariants} className="pt-8 mt-8 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full py-4 px-6 rounded-xl font-bold text-lg text-white shadow-[0_10px_20px_rgba(160,120,85,0.3)] transition-all duration-300 flex items-center justify-center overflow-hidden relative group
                      ${loading
                        ? 'bg-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gradient-to-r from-[#a07855] to-[#8a6352] hover:from-[#8a6352] hover:to-[#6b493d] hover:-translate-y-1'
                      }`}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Creating Profile...
                      </>
                    ) : (
                      <>
                        <span className="relative z-10">Complete Setup & Access Dashboard</span>
                        <div className="absolute inset-0 h-full w-full bg-white/20 transform -skew-x-12 -translate-x-full group-hover:animate-[shine_1.5s_ease-in-out_infinite] z-0"></div>
                      </>
                    )}
                  </button>
                </motion.div>

              </motion.div>
            </form>
              </div>
            </>
          )}
        </motion.div>


      </div>
    </div>
  );
};

export default SellerOnboarding;

import React, { useState, useEffect } from 'react';
import { 
  X, Zap, Trash2, Edit2, Tag, Calendar, AlertCircle, RefreshCw, Plus 
} from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from '../config';

import { PRODUCT_CATEGORIES } from '../utils/constants';

const STORE_CATEGORIES = PRODUCT_CATEGORIES;

const PromoModal = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('create'); // 'create' | 'manage'
  const [promos, setPromos] = useState([]);
  const [fetchLoading, setFetchLoading] = useState(false);
  const [loading, setLoading] = useState(false);
  const [editingPromoId, setEditingPromoId] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Custom Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [promoToDelete, setPromoToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const todayStr = getLocalDateString();

  const defaultFormState = {
    code: '',
    scope: 'WHOLE_STORE',
    selectedCategories: [],
    mechanism: 'PERCENTAGE',
    discountValue: '',
    hasMaxDiscountCap: false,
    maxDiscountCap: '',
    customRewardText: '',
    minSpend: '',
    startDate: todayStr,
    endDate: '',
    totalUsageLimit: '',
    perBuyerLimit: 1
  };

  const [formData, setFormData] = useState(defaultFormState);

  const getAuthHeader = () => {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const fetchSellerPromos = async () => {
    try {
      setFetchLoading(true);
      const res = await axios.get(`${API_BASE_URL}/promos/seller`, getAuthHeader());
      setPromos(res.data || []);
    } catch (err) {
      console.error('Error fetching promos:', err);
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSellerPromos();
      setErrorMsg('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const blockInvalidNumberKeys = (e) => {
    if (['-', '+', 'e', 'E'].includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleGenerateCode = () => {
    const prefix = 'PAW';
    const rand = Math.floor(1000 + Math.random() * 9000);
    setFormData((prev) => ({ ...prev, code: `${prefix}${rand}` }));
  };

  const handleCategoryToggle = (cat) => {
    setFormData((prev) => {
      const exists = prev.selectedCategories.includes(cat);
      const nextCategories = exists
        ? prev.selectedCategories.filter((c) => c !== cat)
        : [...prev.selectedCategories, cat];

      // Auto-clear the error if user selected at least one category
      if (nextCategories.length > 0 && errorMsg.includes('qualifying category')) {
        setErrorMsg('');
      }

      return {
        ...prev,
        selectedCategories: nextCategories
      };
    });
  };

  const handleStartEdit = (promo) => {
    setEditingPromoId(promo._id);
    setFormData({
      code: promo.code,
      scope: promo.scope || 'WHOLE_STORE',
      selectedCategories: promo.applicableCategories || [],
      mechanism: promo.discountMechanism || 'PERCENTAGE',
      discountValue: promo.discountValue !== undefined && promo.discountValue !== null ? String(promo.discountValue) : '',
      hasMaxDiscountCap: Boolean(promo.maxDiscountCap),
      maxDiscountCap: promo.maxDiscountCap ? String(promo.maxDiscountCap) : '',
      customRewardText: promo.customRewardText || '',
      minSpend: promo.minSpend !== undefined && promo.minSpend !== null && promo.minSpend > 0 ? String(promo.minSpend) : '',
      startDate: promo.startDatetime ? getLocalDateString(new Date(promo.startDatetime)) : todayStr,
      endDate: promo.endDatetime ? getLocalDateString(new Date(promo.endDatetime)) : '',
      totalUsageLimit: promo.totalUsageLimit ? String(promo.totalUsageLimit) : '',
      perBuyerLimit: promo.perBuyerLimit || 1
    });
    setActiveTab('create');
  };

  const handleDeleteClick = (promo) => {
    setPromoToDelete(promo);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!promoToDelete) return;
    setIsDeleting(true);
    try {
      await axios.delete(`${API_BASE_URL}/promos/${promoToDelete._id}`, getAuthHeader());
      setPromos((prev) => prev.filter((p) => p._id !== promoToDelete._id));
      setIsDeleteModalOpen(false);
      setPromoToDelete(null);
      setSuccessMsg('Promo code deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3500);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete promo code');
    } finally {
      setIsDeleting(false);
    }
  };

  // Field-level validation flags
  const isPercentageInvalid =
    formData.mechanism === 'PERCENTAGE' &&
    (formData.discountValue !== '' &&
      (Number(formData.discountValue) < 1 || Number(formData.discountValue) > 100));

  const isFixedAmountInvalid =
    formData.mechanism === 'FIXED_AMOUNT' &&
    (formData.discountValue !== '' && Number(formData.discountValue) <= 0);

  const isMinSpendInvalid =
    formData.minSpend !== '' && Number(formData.minSpend) < 0;

  const isCapInvalid =
    formData.hasMaxDiscountCap &&
    formData.maxDiscountCap !== '' &&
    Number(formData.maxDiscountCap) <= 0;

  const isPerBuyerLimitInvalid =
    formData.perBuyerLimit !== '' && Number(formData.perBuyerLimit) < 1;
  
  const isCategorySelectionInvalid =
    formData.scope === 'SPECIFIC_CATEGORY' && formData.selectedCategories.length === 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!formData.code || formData.code.length < 4 || formData.code.length > 16) {
      setErrorMsg('Promo code must be 4–16 alphanumeric characters.');
      return;
    }

    if (formData.scope === 'SPECIFIC_CATEGORY' && formData.selectedCategories.length === 0) {
      setErrorMsg('Please select at least one qualifying category.');
      return;
    }

    if (formData.mechanism === 'PERCENTAGE') {
      const val = Number(formData.discountValue);
      if (!formData.discountValue || val < 1 || val > 100) {
        setErrorMsg('Discount percentage must be between 1% and 100%.');
        return;
      }
    } else if (formData.mechanism === 'FIXED_AMOUNT') {
      const val = Number(formData.discountValue);
      if (!formData.discountValue || val <= 0) {
        setErrorMsg('Discount amount must be greater than Rs. 0.');
        return;
      }
    } else if (formData.mechanism === 'CUSTOM_REWARD') {
      if (!formData.customRewardText || !formData.customRewardText.trim()) {
        setErrorMsg('Please enter a custom reward description.');
        return;
      }
    }

    if (isMinSpendInvalid) {
      setErrorMsg('Minimum spend must be 0 or greater.');
      return;
    }

    if (formData.hasMaxDiscountCap && (!formData.maxDiscountCap || Number(formData.maxDiscountCap) <= 0)) {
      setErrorMsg('Please enter a valid maximum discount ceiling greater than Rs. 0.');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      setErrorMsg('Please specify validity dates.');
      return;
    }

    if (formData.endDate < formData.startDate) {
      setErrorMsg('End expiry date cannot be earlier than start date.');
      return;
    }

    if (isPerBuyerLimitInvalid) {
      setErrorMsg('Per-buyer usage limit must be at least 1.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: formData.code.trim().toUpperCase(),
        scope: formData.scope,
        selectedCategories: formData.scope === 'SPECIFIC_CATEGORY' ? formData.selectedCategories : [],
        mechanism: formData.mechanism,
        discountValue: ['FREE_SHIPPING', 'CUSTOM_REWARD'].includes(formData.mechanism) ? 0 : Number(formData.discountValue),
        customRewardText: formData.mechanism === 'CUSTOM_REWARD' ? formData.customRewardText.trim() : null,
        hasMaxDiscountCap: formData.hasMaxDiscountCap,
        maxDiscountCap: formData.hasMaxDiscountCap && formData.maxDiscountCap ? Number(formData.maxDiscountCap) : null,
        minSpend: formData.minSpend !== '' ? Number(formData.minSpend) : 0,
        startDate: formData.startDate,
        endDate: formData.endDate,
        totalUsageLimit: formData.totalUsageLimit ? Number(formData.totalUsageLimit) : null,
        perBuyerLimit: formData.perBuyerLimit ? Number(formData.perBuyerLimit) : 1
      };

      if (editingPromoId) {
        await axios.put(`${API_BASE_URL}/promos/${editingPromoId}`, payload, getAuthHeader());
        setSuccessMsg(`Promo code "${payload.code}" updated successfully!`);
      } else {
        await axios.post(`${API_BASE_URL}/promos/create`, payload, getAuthHeader());
        setSuccessMsg(`Promo code "${payload.code}" published successfully!`);
      }

      // Automatically dismiss the success message after 3.5 seconds
      setTimeout(() => {
        setSuccessMsg('');
      }, 3500);

      setEditingPromoId(null);
      setFormData(defaultFormState);
      fetchSellerPromos();
      setActiveTab('manage');
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Failed to save promo code.');
    } finally {
      setLoading(false);
    }
  };

  const getPreviewDiscountText = () => {
    if (formData.mechanism === 'PERCENTAGE') {
      return `${formData.discountValue || 0}% OFF`;
    }
    if (formData.mechanism === 'FIXED_AMOUNT') {
      return `Rs. ${formData.discountValue || 0} OFF`;
    }
    if (formData.mechanism === 'FREE_SHIPPING') {
      return 'FREE SHIPPING';
    }
    return formData.customRewardText || 'SPECIAL REWARD';
  };

  const isManage = activeTab === 'manage';

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-3 sm:p-5 backdrop-blur-sm font-sans">
        <div 
          className={`relative flex max-h-[94vh] w-full ${
            isManage ? 'max-w-3xl' : 'max-w-5xl'
          } overflow-hidden rounded-[26px] bg-[#fbf9f6] text-[#3d2a24] shadow-2xl border border-[#ebe3d7] transition-all duration-300`}
        >
          
          {/* Main Column */}
          <div className="flex flex-1 flex-col overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#eee7dc] bg-[#faf6f0] px-6 sm:px-8 pt-6 pb-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a07855]">
                  {isManage 
                    ? 'PROMOTION CAMPAIGNS' 
                    : editingPromoId 
                    ? 'UPDATE CAMPAIGN' 
                    : 'NEW CAMPAIGN'}
                </p>
                <h2 className="text-xl sm:text-2xl font-black text-[#4E3B31] tracking-tight">
                  {isManage 
                    ? 'Store Promo Codes' 
                    : editingPromoId 
                    ? 'Edit Promo Code' 
                    : 'Create Promo Code'}
                </h2>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 rounded-xl bg-[#ede5db] p-1 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPromoId(null);
                      setFormData(defaultFormState);
                      setActiveTab('create');
                    }}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      !isManage
                        ? 'bg-white text-[#4E3B31] shadow-sm'
                        : 'text-[#7a6554] hover:text-[#4E3B31]'
                    }`}
                  >
                    Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('manage')}
                    className={`rounded-lg px-3 py-1.5 transition ${
                      isManage
                        ? 'bg-white text-[#4E3B31] shadow-sm'
                        : 'text-[#7a6554] hover:text-[#4E3B31]'
                    }`}
                  >
                    Manage ({promos.length})
                  </button>
                </div>

                {isManage && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200/50 hover:text-stone-700 transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Body Content */}
            <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 space-y-6">
              {errorMsg && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-600 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}
              {successMsg && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-3 text-xs font-semibold text-green-700 flex items-center justify-between">
                  <span>{successMsg}</span>
                  <button onClick={() => setSuccessMsg('')} className="text-green-800 hover:text-green-950">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {isManage ? (
                /* ================= MANAGE EXISTING PROMOS VIEW ================= */
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-[#a07855]">
                      Active & Previous Codes ({promos.length})
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPromoId(null);
                        setFormData(defaultFormState);
                        setActiveTab('create');
                      }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#6b493d] hover:text-[#4E3B31] transition"
                    >
                      <Plus className="w-3.5 h-3.5" /> New Code
                    </button>
                  </div>

                  {fetchLoading ? (
                    <div className="py-16 text-center text-[#8c6b5d]">
                      <RefreshCw className="mx-auto h-6 w-6 animate-spin mb-2" />
                      <p className="text-sm font-medium">Loading promotions...</p>
                    </div>
                  ) : promos.length === 0 ? (
                    <div className="py-16 text-center border-2 border-dashed border-[#e8dfd3] rounded-2xl bg-white p-6">
                      <Tag className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                      <p className="text-sm font-bold text-[#4E3B31]">No promo codes created yet</p>
                      <p className="text-xs text-[#a07855] mt-1 mb-4">Launch campaigns to reward your loyal shoppers.</p>
                      <button
                        type="button"
                        onClick={() => setActiveTab('create')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-[#6b493d] px-4 py-2 text-xs font-bold text-white shadow hover:bg-[#57392f] transition"
                      >
                        <Plus className="w-3.5 h-3.5" /> Create First Code
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {promos.map((p) => {
                        const isExpired = new Date(p.endDatetime || p.endDate) < new Date();
                        return (
                          <div
                            key={p._id}
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-[#e8dfd3] bg-white shadow-sm hover:shadow transition-shadow gap-4"
                          >
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-mono font-bold text-[#6b493d] text-base tracking-wider">
                                  {p.code}
                                </span>
                                <span
                                  className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    isExpired ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  }`}
                                >
                                  {isExpired ? 'Expired' : 'Active'}
                                </span>
                                <span className="text-[10px] font-bold uppercase tracking-wider bg-[#f8f4ed] text-[#a07855] px-2 py-0.5 rounded-full border border-[#ede5db]">
                                  {p.scope === 'WHOLE_STORE' ? 'Storewide' : 'Category'}
                                </span>
                              </div>

                              <p className="text-sm font-semibold text-[#4E3B31] mt-1.5">
                                {p.discountMechanism === 'PERCENTAGE'
                                  ? `${p.discountValue}% OFF`
                                  : p.discountMechanism === 'FIXED_AMOUNT'
                                  ? `Rs. ${p.discountValue} OFF`
                                  : p.discountMechanism === 'FREE_SHIPPING'
                                  ? 'Free Shipping'
                                  : p.customRewardText}
                                {p.minSpend > 0 && (
                                  <span className="text-xs font-normal text-[#7a6554]">
                                    {' '}• Min Spend Rs. {p.minSpend.toLocaleString()}
                                  </span>
                                )}
                                {p.maxDiscountCap && (
                                  <span className="text-xs font-normal text-[#7a6554]">
                                    {' '}• Max Cap Rs. {p.maxDiscountCap.toLocaleString()}
                                  </span>
                                )}
                              </p>

                              <p className="text-[11px] text-[#a07855] mt-1">
                                Validity: {new Date(p.startDatetime || p.startDate).toLocaleDateString()} – {new Date(p.endDatetime || p.endDate).toLocaleDateString()}
                                {' '}• Redemptions: <span className="font-bold text-[#4E3B31]">{p.totalRedemptions || 0}</span>{p.totalUsageLimit ? ` / ${p.totalUsageLimit}` : ''}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => handleStartEdit(p)}
                                className="p-2 border border-[#ded5c7] rounded-xl hover:bg-[#faf6f0] text-[#6b493d] transition"
                                title="Edit Code"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteClick(p)}
                                className="p-2 border border-red-200 bg-red-50 rounded-xl hover:bg-red-100 text-red-600 transition"
                                title="Delete Code"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              ) : (
                /* ================= CREATE / EDIT FORM VIEW ================= */
                <form id="promoForm" onSubmit={handleSubmit} className="space-y-6">
                  
                  {/* 1. Code Name & Generator */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a07855] mb-1.5">
                      Promo Code Name <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        required
                        maxLength={16}
                        placeholder="E.G. SUMMER20"
                        value={formData.code}
                        disabled={Boolean(editingPromoId)}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            code: e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
                          })
                        }
                        className="flex-1 rounded-xl border border-[#ded5c8] bg-white px-3.5 py-2.5 text-sm font-semibold tracking-wide text-[#3d2a24] placeholder-[#d4c5c1] focus:border-[#6b493d] focus:outline-none disabled:bg-gray-100"
                      />
                      {!editingPromoId && (
                        <button
                          type="button"
                          onClick={handleGenerateCode}
                          className="flex items-center gap-1.5 rounded-xl border border-[#ded5c8] bg-[#f8f4ed] px-4 py-2.5 text-xs font-bold text-[#6b493d] hover:bg-[#efe4d8] transition"
                        >
                          <Zap className="h-3.5 w-3.5 fill-current" /> Auto
                        </button>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#8d7565]">
                      Must be 4–16 alphanumeric characters without spaces.
                    </p>
                  </div>

                  <hr className="border-[#eee5d8]" />

                  {/* 2. Scope */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a07855] mb-2">
                      Applicability Scope
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => setFormData({ ...formData, scope: 'WHOLE_STORE' })}
                        className={`cursor-pointer rounded-2xl border p-4 flex items-center gap-3.5 transition bg-white ${
                          formData.scope === 'WHOLE_STORE'
                            ? 'border-[#6b493d] ring-1 ring-[#6b493d]'
                            : 'border-[#ded5c8] hover:border-[#bdafa0]'
                        }`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300">
                          {formData.scope === 'WHOLE_STORE' && (
                            <div className="h-3 w-3 rounded-full bg-[#6b493d]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#4E3B31]">Entire Store Catalog</p>
                          <p className="text-xs text-[#a07855]">Applicable to all products in your store</p>
                        </div>
                      </div>

                      <div
                        onClick={() => setFormData({ ...formData, scope: 'SPECIFIC_CATEGORY' })}
                        className={`cursor-pointer rounded-2xl border p-4 flex items-center gap-3.5 transition bg-white ${
                          formData.scope === 'SPECIFIC_CATEGORY'
                            ? 'border-[#6b493d] ring-1 ring-[#6b493d]'
                            : 'border-[#ded5c8] hover:border-[#bdafa0]'
                        }`}
                      >
                        <div className="flex h-5 w-5 items-center justify-center rounded-full border border-gray-300">
                          {formData.scope === 'SPECIFIC_CATEGORY' && (
                            <div className="h-3 w-3 rounded-full bg-[#6b493d]" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-[#4E3B31]">Specific Categories</p>
                          <p className="text-xs text-[#a07855]">Apply only to selected category items</p>
                        </div>
                      </div>
                    </div>

                    {formData.scope === 'SPECIFIC_CATEGORY' && (
                      <div className="mt-3 rounded-2xl border border-[#ded5c8] bg-[#f8f4ed] p-4">
                        <p className="text-[11px] font-bold uppercase tracking-wider text-[#a07855] mb-3">
                          Choose Qualifying Categories <span className="text-red-500">*</span>
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {STORE_CATEGORIES.map((cat) => {
                            const isChecked = formData.selectedCategories.includes(cat);
                            return (
                              <label
                                key={cat}
                                className="flex items-center gap-2.5 rounded-xl border border-[#ded5c8] bg-white px-3.5 py-2 text-xs font-semibold text-[#4E3B31] cursor-pointer hover:bg-stone-50"
                              >
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={() => handleCategoryToggle(cat)}
                                  className="h-4 w-4 rounded border-gray-300 text-[#6b493d] focus:ring-0"
                                />
                                <span>{cat}</span>
                              </label>
                            );
                          })}
                        </div>
                        {formData.selectedCategories.length === 0 && (
                          <p className="mt-2 text-xs font-semibold text-red-600">
                            Please select at least one qualifying category.
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  <hr className="border-[#eee5d8]" />

                  {/* 3. Discount Mechanism */}
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a07855] mb-2">
                      Discount Mechanism
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        { id: 'PERCENTAGE', label: 'Percentage', symbol: '%' },
                        { id: 'FIXED_AMOUNT', label: 'Fixed Amt', symbol: 'Rs.' },
                        { id: 'FREE_SHIPPING', label: 'Free Ship', icon: '🚚' },
                        { id: 'CUSTOM_REWARD', label: 'Reward', icon: '🎁' }
                      ].map((item) => {
                        const selected = formData.mechanism === item.id;
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => setFormData({ ...formData, mechanism: item.id })}
                            className={`flex flex-col items-center justify-center rounded-xl border py-2.5 text-center transition ${
                              selected
                                ? 'border-[#6b493d] bg-[#6b493d] text-white shadow-sm'
                                : 'border-[#ded5c8] bg-white text-[#4E3B31] hover:border-[#bdafa0]'
                            }`}
                          >
                            <span className="text-sm font-bold">
                              {item.symbol || item.icon}
                            </span>
                            <span className="text-[11px] font-bold">{item.label}</span>
                          </button>
                        );
                      })}
                    </div>

                    {formData.mechanism === 'CUSTOM_REWARD' ? (
                      <div className="mt-4 rounded-2xl border border-[#ede6e1] bg-[#faf7f5] p-6 text-center space-y-3">
                        <div className="w-12 h-12 mx-auto rounded-full bg-[#f3e7dc] border border-[#c9a280]/40 flex items-center justify-center text-[#6b493d] text-xl">
                          🎁
                        </div>
                        <div>
                          <span className="inline-flex items-center rounded-full border border-[#c9a280]/60 bg-[#f3e7dc] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#6b493d] mb-2">
                            Coming Soon
                          </span>
                          <h4 className="text-sm font-bold text-[#4E3B31]">Custom Gifts & Freebies</h4>
                          <p className="text-xs leading-relaxed text-[#a07855] max-w-sm mx-auto mt-1">
                            Rewarding shoppers with free merchandise, samples, and treats is currently in development and will be available soon!
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {/* Discount Value Input */}
                          <div>
                            <label className="block text-xs font-bold text-[#4E3B31] mb-1">
                              {formData.mechanism === 'PERCENTAGE'
                                ? 'Discount Percentage (%)'
                                : formData.mechanism === 'FIXED_AMOUNT'
                                ? 'Discount Amount (Rs.)'
                                : 'Shipping Benefit'}
                              <span className="text-red-500"> *</span>
                            </label>

                            {formData.mechanism === 'PERCENTAGE' && (
                              <div className="relative">
                                <input
                                  type="number"
                                  required
                                  min="1"
                                  max="100"
                                  onKeyDown={blockInvalidNumberKeys}
                                  placeholder="e.g. 15"
                                  value={formData.discountValue}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      discountValue: e.target.value
                                    })
                                  }
                                  className={`w-full rounded-xl border bg-white px-3.5 py-2.5 pr-8 text-sm focus:outline-none ${
                                    isPercentageInvalid
                                      ? 'border-red-400 focus:border-red-500'
                                      : 'border-[#ded5c8] focus:border-[#6b493d]'
                                  }`}
                                />
                                <span className="absolute right-3 top-2.5 text-sm text-gray-400 font-bold">%</span>
                              </div>
                            )}

                            {formData.mechanism === 'FIXED_AMOUNT' && (
                              <input
                                type="number"
                                required
                                min="1"
                                onKeyDown={blockInvalidNumberKeys}
                                placeholder="e.g. 250"
                                value={formData.discountValue}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    discountValue: e.target.value
                                  })
                                }
                                className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:outline-none ${
                                  isFixedAmountInvalid
                                    ? 'border-red-400 focus:border-red-500'
                                    : 'border-[#ded5c8] focus:border-[#6b493d]'
                                }`}
                              />
                            )}

                            {formData.mechanism === 'FREE_SHIPPING' && (
                              <input
                                type="text"
                                disabled
                                value="100% Free Shipping"
                                className="w-full rounded-xl border border-[#ded5c8] bg-gray-100 px-3.5 py-2.5 text-sm text-gray-600 font-semibold"
                              />
                            )}

                            {formData.mechanism === 'PERCENTAGE' && (
                              <p className={`mt-1 text-[11px] ${isPercentageInvalid ? 'font-semibold text-red-600' : 'text-[#8d7565]'}`}>
                                {isPercentageInvalid
                                  ? 'Discount percentage must be between 1% and 100%.'
                                  : 'Percentage discount must be between 1% and 100%.'}
                              </p>
                            )}

                            {formData.mechanism === 'FIXED_AMOUNT' && (
                              <p className={`mt-1 text-[11px] ${isFixedAmountInvalid ? 'font-semibold text-red-600' : 'text-[#8d7565]'}`}>
                                {isFixedAmountInvalid
                                  ? 'Discount amount must be greater than Rs. 0.'
                                  : 'Enter flat amount deducted in Rs. (must be greater than 0).'}
                              </p>
                            )}

                            {formData.mechanism === 'FREE_SHIPPING' && (
                              <p className="mt-1 text-[11px] text-[#8d7565]">
                                Fully waives shipping fees for orders containing your products.
                              </p>
                            )}
                          </div>

                          {/* Minimum Spend Req Input */}
                          <div>
                            <label className="block text-xs font-bold text-[#4E3B31] mb-1">
                              Minimum Spend Req. (Rs.)
                            </label>
                            <input
                              type="number"
                              min="0"
                              onKeyDown={blockInvalidNumberKeys}
                              placeholder="Optional (e.g. 500)"
                              value={formData.minSpend}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  minSpend: e.target.value
                                })
                              }
                              className={`w-full rounded-xl border bg-white px-3.5 py-2.5 text-sm focus:outline-none ${
                                isMinSpendInvalid
                                  ? 'border-red-400 focus:border-red-500'
                                  : 'border-[#ded5c8] focus:border-[#6b493d]'
                              }`}
                            />
                            <p className={`mt-1 text-[11px] ${isMinSpendInvalid ? 'font-semibold text-red-600' : 'text-[#8d7565]'}`}>
                              {isMinSpendInvalid
                                ? 'Minimum spend cannot be negative.'
                                : 'Order subtotal required to unlock this code (leave blank for no minimum).'}
                            </p>
                          </div>
                        </div>

                        {/* Ceiling Cap Checkbox for Percentage */}
                        {formData.mechanism === 'PERCENTAGE' && (
                          <div className="mt-4 pt-3 border-t border-[#f0e9df]">
                            <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-[#4E3B31]">
                              <input
                                type="checkbox"
                                checked={formData.hasMaxDiscountCap}
                                onChange={(e) =>
                                  setFormData({ ...formData, hasMaxDiscountCap: e.target.checked })
                                }
                                className="h-4 w-4 rounded border-gray-300 text-[#6b493d] focus:ring-0"
                              />
                              <span>Apply Maximum Discount Ceiling Cap</span>
                            </label>

                            {formData.hasMaxDiscountCap && (
                              <div className="mt-2 w-full sm:w-1/2">
                                <input
                                  type="number"
                                  min="1"
                                  onKeyDown={blockInvalidNumberKeys}
                                  placeholder="e.g. 1000"
                                  value={formData.maxDiscountCap}
                                  onChange={(e) =>
                                    setFormData({
                                      ...formData,
                                      maxDiscountCap: e.target.value
                                    })
                                  }
                                  className={`w-full rounded-xl border bg-white px-3.5 py-2 text-sm focus:outline-none ${
                                    isCapInvalid
                                      ? 'border-red-400 focus:border-red-500'
                                      : 'border-[#ded5c8] focus:border-[#6b493d]'
                                  }`}
                                />
                                <p className={`mt-1 text-[11px] ${isCapInvalid ? 'font-semibold text-red-600' : 'text-[#8d7565]'}`}>
                                  {isCapInvalid
                                    ? 'Ceiling cap must be greater than Rs. 0.'
                                    : 'Caps total percentage discount up to this maximum amount in Rs.'}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  <hr className="border-[#eee5d8]" />

                  {/* 4. Validity Dates */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a07855] mb-1">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={todayStr}
                        value={formData.startDate}
                        onChange={(e) => {
                          const newStart = e.target.value;
                          setFormData((prev) => ({
                            ...prev,
                            startDate: newStart,
                            endDate: prev.endDate && prev.endDate < newStart ? newStart : prev.endDate
                          }));
                        }}
                        className="w-full rounded-xl border border-[#ded5c8] bg-white px-3 py-2 text-sm text-[#4E3B31] focus:border-[#6b493d] focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-[#8d7565]">
                        Campaign begins at 00:00:00 on this date.
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a07855] mb-1">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        required
                        min={formData.startDate || todayStr}
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        className="w-full rounded-xl border border-[#ded5c8] bg-white px-3 py-2 text-sm text-[#4E3B31] focus:border-[#6b493d] focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-[#8d7565]">
                        Campaign ends at 23:59:59 on this date.
                      </p>
                    </div>
                  </div>

                  <hr className="border-[#eee5d8]" />

                  {/* 5. Limits */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a07855] mb-1">
                        Total Campaign Limit
                      </label>
                      <input
                        type="number"
                        min="1"
                        onKeyDown={blockInvalidNumberKeys}
                        placeholder="Leave blank for unlimited"
                        value={formData.totalUsageLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            totalUsageLimit: e.target.value
                          })
                        }
                        className="w-full rounded-xl border border-[#ded5c8] bg-white px-3 py-2 text-sm text-[#4E3B31] focus:border-[#6b493d] focus:outline-none"
                      />
                      <p className="mt-1 text-[11px] text-[#8d7565]">
                        Max overall uses across all buyers (blank = unlimited).
                      </p>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-[#a07855] mb-1">
                        Per-Buyer Usage Limit <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        required
                        min="1"
                        onKeyDown={blockInvalidNumberKeys}
                        value={formData.perBuyerLimit}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            perBuyerLimit: e.target.value
                          })
                        }
                        className={`w-full rounded-xl border bg-white px-3 py-2 text-sm text-[#4E3B31] focus:outline-none ${
                          isPerBuyerLimitInvalid
                            ? 'border-red-400 focus:border-red-500'
                            : 'border-[#ded5c8] focus:border-[#6b493d]'
                        }`}
                      />
                      <p className={`mt-1 text-[11px] ${isPerBuyerLimitInvalid ? 'font-semibold text-red-600' : 'text-[#8d7565]'}`}>
                        {isPerBuyerLimitInvalid
                          ? 'Must allow at least 1 redemption per customer.'
                          : 'How many times each buyer account can redeem this code.'}
                      </p>
                    </div>
                  </div>
                </form>
              )}
            </div>
          </div>

          {/* Right Column: Live Preview Card (ONLY in Create/Edit mode) */}
        {!isManage && (
          <div className="w-[330px] shrink-0 bg-[#f7f2ea] border-l border-[#eee7dc] p-6 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-5">
                <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#a07855]">
                  Live Voucher Preview
                </span>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-full p-1.5 text-stone-400 hover:bg-stone-200/50 hover:text-stone-700 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Styled Ticket Voucher */}
              <div className="relative overflow-hidden rounded-[24px] bg-gradient-to-b from-[#6b493d] to-[#54382e] p-6 text-white shadow-xl border border-[#4a3127]">
                {/* Decorative Ticket Cutouts */}
                <div className="absolute -left-3.5 top-[60%] h-7 w-7 rounded-full bg-[#f7f2ea] shadow-inner" />
                <div className="absolute -right-3.5 top-[60%] h-7 w-7 rounded-full bg-[#f7f2ea] shadow-inner" />

                {/* Voucher Header */}
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#e6d0c4]">
                    🐾 Hope For Paws
                  </span>
                  <span className="rounded-full bg-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#f5eae2] backdrop-blur-sm border border-white/10">
                    {formData.scope === 'WHOLE_STORE' ? 'Storewide' : 'Category'}
                  </span>
                </div>

                {/* Main Discount Display */}
                <div className="my-7 text-center">
                  <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#d4b9ab] mb-1">
                    Special Offer
                  </p>
                  <h3 className="text-3xl sm:text-[34px] font-black tracking-tight text-white leading-none break-words drop-shadow-sm">
                    {getPreviewDiscountText()}
                  </h3>
                  {formData.hasMaxDiscountCap && formData.maxDiscountCap && formData.mechanism === 'PERCENTAGE' && (
                    <p className="mt-2 text-[10px] font-medium text-[#e3cebe]">
                      Capped up to Rs. {Number(formData.maxDiscountCap).toLocaleString()}
                    </p>
                  )}
                </div>

                {/* Perforated Divider */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full border-b-2 border-dashed border-white/25" />
                </div>

                {/* Code Box */}
                <div className="mt-5 text-center">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#d8c2b4] mb-1.5">
                    Use Code At Checkout
                  </p>
                  <div className="rounded-xl border border-white/20 bg-black/20 px-3 py-2.5 font-mono text-base font-extrabold tracking-[0.2em] text-[#faf6f0] shadow-inner backdrop-blur-xs select-all">
                    {formData.code || 'YOURCODE'}
                  </div>
                </div>

                {/* Dynamic Conditions Line */}
                <div className="mt-4 pt-3 border-t border-white/10 text-center space-y-0.5">
                  <p className="text-[10px] text-[#dac3b5]">
                    {formData.minSpend && Number(formData.minSpend) > 0
                      ? `Min. spend Rs. ${Number(formData.minSpend).toLocaleString()}`
                      : 'No minimum order required'}
                  </p>
                  <p className="text-[10px] text-[#bda79b]">
                    Valid through {formData.endDate ? new Date(formData.endDate + 'T00:00:00').toLocaleDateString() : 'Limited Time'}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 mt-6">
              <button
                type="submit"
                form="promoForm"
                disabled={formData.mechanism === 'CUSTOM_REWARD' || loading || isCategorySelectionInvalid || isPercentageInvalid || isFixedAmountInvalid || isMinSpendInvalid || isCapInvalid || isPerBuyerLimitInvalid}
                className="w-full rounded-xl bg-[#6b493d] py-3 text-center text-sm font-bold text-white shadow hover:bg-[#57392f] transition disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              >
                {formData.mechanism === 'CUSTOM_REWARD'
                  ? 'Feature Coming Soon'
                  : loading
                  ? 'Processing...'
                  : editingPromoId
                  ? 'Update Promo Code'
                  : 'Publish Promo Code'}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full rounded-xl border border-[#ded5c7] bg-white py-3 text-center text-sm font-bold text-[#6b493d] hover:bg-[#fcfaf8] transition cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        </div>
      </div>

      {/* Custom Hope for Paws Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4 font-sans">
          <div className="bg-white rounded-[24px] w-full max-w-sm p-6 shadow-2xl text-center border border-[#e8dcc8] animate-in fade-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100">
              <Trash2 className="w-7 h-7 text-red-600" />
            </div>
            
            <h3 className="text-xl font-bold text-[#4E3B31] mb-2 tracking-tight">Delete Promo Code</h3>
            
            <p className="text-sm text-[#7a6554] mb-6 leading-relaxed">
              Are you sure you want to delete promo code{' '}
              <span className="font-mono font-bold text-[#6b493d]">{promoToDelete?.code}</span>? 
              This campaign will be permanently removed.
            </p>
            
            <div className="flex gap-3">
              <button 
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setPromoToDelete(null);
                }}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#ded5c8] bg-white text-sm font-semibold text-[#6b493d] hover:bg-[#fcfaf8] transition-colors"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={confirmDelete}
                disabled={isDeleting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 shadow transition-colors disabled:opacity-50"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PromoModal;
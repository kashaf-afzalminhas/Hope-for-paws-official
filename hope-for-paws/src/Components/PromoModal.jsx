import React, { useState, useMemo } from 'react';
import { X, Percent, DollarSign, Truck, Gift, Zap } from 'lucide-react';
import axios from 'axios';
import { API_BASE_URL } from "../config";

const STORE_CATEGORIES = [
  'Grooming',
  'Food & Treats',
  'Beds & Furniture',
  'Toys',
  'Health & Wellness',
];

export default function PromoModal({ isOpen, onClose, onCreated }) {
  const [code, setCode] = useState('');
  const [scope, setScope] = useState('WHOLE_STORE');
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [mechanism, setMechanism] = useState('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [customRewardText, setCustomRewardText] = useState('');
  const [hasMaxDiscountCap, setHasMaxDiscountCap] = useState(false);
  const [maxDiscountCap, setMaxDiscountCap] = useState('');
  const [minSpend, setMinSpend] = useState('0');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [totalUsageLimit, setTotalUsageLimit] = useState('');
  const [perBuyerLimit, setPerBuyerLimit] = useState('1');
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const handleAutoGenerate = () => {
    const prefixes = ['PAW', 'BARK', 'MIAW', 'LOVE', 'SAVE'];
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomNum = Math.floor(10 + Math.random() * 90);
    setCode(`${randomPrefix}${randomNum}`);
  };

  const toggleCategory = (cat) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]
    );
  };

  const errors = useMemo(() => {
    const errs = {};
    const codeRegex = /^[A-Z0-9]{4,16}$/;
    if (!code) errs.code = 'Promo code is required.';
    else if (!codeRegex.test(code)) errs.code = 'Must be 4–16 uppercase alphanumeric characters.';

    if (scope === 'SPECIFIC_CATEGORY' && selectedCategories.length === 0) {
      errs.scope = 'Select at least one qualifying category.';
    }

    if (mechanism === 'PERCENTAGE') {
      const val = parseFloat(discountValue);
      if (isNaN(val) || val <= 0 || val > 100) errs.discountValue = 'Percentage must be between 1% and 100%.';
      if (hasMaxDiscountCap) {
        const cap = parseFloat(maxDiscountCap);
        if (isNaN(cap) || cap <= 0) errs.maxDiscountCap = 'Cap must be greater than 0.';
      }
    } else if (mechanism === 'FIXED_AMOUNT') {
      const val = parseFloat(discountValue);
      if (isNaN(val) || val <= 0) errs.discountValue = 'Fixed discount must be greater than 0.';
    } else if (mechanism === 'CUSTOM_REWARD') {
      if (!customRewardText.trim()) errs.customRewardText = 'Please enter a description.';
    }

    const min = parseFloat(minSpend);
    if (isNaN(min) || min < 0) errs.minSpend = 'Minimum spend must be 0 or greater.';

    if (!startDate) errs.startDate = 'Required';
    if (!endDate) errs.endDate = 'Required';
    if (startDate && endDate && new Date(endDate) <= new Date(startDate)) {
      errs.endDate = 'Must be after Start Date.';
    }

    return errs;
  }, [code, scope, selectedCategories, mechanism, discountValue, hasMaxDiscountCap, maxDiscountCap, minSpend, startDate, endDate, customRewardText]);

  const isValid = Object.keys(errors).length === 0;

  const handlePublish = async () => {
    if (!isValid) return;
    setLoading(true);
    setApiError('');

    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/promos/create`,
        {
          code,
          scope,
          selectedCategories,
          mechanism,
          discountValue,
          customRewardText,
          hasMaxDiscountCap,
          maxDiscountCap,
          minSpend,
          startDate,
          endDate,
          totalUsageLimit,
          perBuyerLimit,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (onCreated) onCreated();
      onClose();
    } catch (err) {
      setApiError(err.response?.data?.message || 'Failed to publish promo code.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center px-4 py-8">
      <div className="fixed inset-0 bg-[#3a2c25]/40 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-[#FAF8F5] w-full max-w-4xl rounded-2xl shadow-2xl border border-[#E8DFD8] overflow-hidden grid grid-cols-1 md:grid-cols-3 z-10">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5c3d2e]/70 hover:text-[#5c3d2e] bg-[#F5EFEB] hover:bg-[#E8DFD8] p-1.5 rounded-full transition z-20"
        >
          <X size={16} />
        </button>

        <div className="md:col-span-2 p-6 md:p-8 space-y-5 max-h-[85vh] overflow-y-auto">
          <div>
            <span className="text-[#8B7A72] text-[10px] uppercase font-bold tracking-wider">New Promotion</span>
            <h2 className="text-xl font-bold tracking-tight text-[#5c3d2e]">Create Promo Code</h2>
          </div>

          {apiError && <div className="p-3 bg-red-100 text-red-700 text-xs rounded-lg">{apiError}</div>}

          <div className="space-y-1">
            <label className="block text-xs font-extrabold uppercase tracking-wide text-[#5c3d2e]/80">Promo Code Name</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
                maxLength={16}
                placeholder="e.g. SUMMER20"
                className="flex-1 px-3 py-2 border rounded-lg text-sm uppercase tracking-wider focus:outline-none focus:ring-1 focus:ring-[#5c3d2e] bg-white border-[#E8DFD8]"
              />
              <button
                type="button"
                onClick={handleAutoGenerate}
                className="bg-[#F5EFEB] border border-[#E8DFD8] text-xs font-bold px-3 py-2 rounded-lg flex items-center gap-1.5 transition text-[#5c3d2e]"
              >
                <Zap size={13} /> Generate
              </button>
            </div>
            {errors.code && <p className="text-[10px] text-red-600 font-semibold">{errors.code}</p>}
          </div>

          <div className="space-y-2 border-t border-[#E8DFD8]/40 pt-4">
            <label className="block text-xs font-extrabold uppercase tracking-wide text-[#5c3d2e]/80">Applicability Scope</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <label className="flex-1 flex items-center gap-2 p-3 border border-[#E8DFD8] rounded-lg bg-white cursor-pointer text-xs font-medium">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'WHOLE_STORE'}
                  onChange={() => setScope('WHOLE_STORE')}
                  className="accent-[#5c3d2e]"
                />
                <div>
                  <p className="font-bold">Entire Store Catalog</p>
                  <p className="text-[10px] text-[#8B7A72]">Applicable store-wide</p>
                </div>
              </label>
              <label className="flex-1 flex items-center gap-2 p-3 border border-[#E8DFD8] rounded-lg bg-white cursor-pointer text-xs font-medium">
                <input
                  type="radio"
                  name="scope"
                  checked={scope === 'SPECIFIC_CATEGORY'}
                  onChange={() => setScope('SPECIFIC_CATEGORY')}
                  className="accent-[#5c3d2e]"
                />
                <div>
                  <p className="font-bold">Specific Categories</p>
                  <p className="text-[10px] text-[#8B7A72]">Apply to items in selected categories</p>
                </div>
              </label>
            </div>

            {scope === 'SPECIFIC_CATEGORY' && (
              <div className="bg-[#F5EFEB]/50 border border-[#E8DFD8] rounded-lg p-3 space-y-2">
                <p className="text-[10px] font-extrabold uppercase text-[#8B7A72] tracking-wider">Product Categories Mapping</p>
                <div className="grid grid-cols-2 gap-2">
                  {STORE_CATEGORIES.map((cat) => (
                    <label key={cat} className="flex items-center gap-2 bg-white px-2 py-1.5 rounded-md text-xs border border-[#E8DFD8]/60 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedCategories.includes(cat)}
                        onChange={() => toggleCategory(cat)}
                        className="rounded accent-[#5c3d2e]"
                      />
                      <span>{cat}</span>
                    </label>
                  ))}
                </div>
                {errors.scope && <p className="text-[10px] text-red-600 font-semibold mt-1">{errors.scope}</p>}
              </div>
            )}
          </div>

          <div className="space-y-2 border-t border-[#E8DFD8]/40 pt-4">
            <label className="block text-xs font-extrabold uppercase tracking-wide text-[#5c3d2e]/80">Discount Mechanism</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { key: 'PERCENTAGE', label: 'Percentage', Icon: Percent },
                { key: 'FIXED_AMOUNT', label: 'Fixed Amt', Icon: DollarSign },
                { key: 'FREE_SHIPPING', label: 'Free Ship', Icon: Truck },
                { key: 'CUSTOM_REWARD', label: 'Reward', Icon: Gift },
              ].map(({ key, label, Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMechanism(key)}
                  className={`py-2 px-1 rounded-lg border text-center transition ${
                    mechanism === key
                      ? 'bg-[#5c3d2e] text-white border-[#5c3d2e] font-bold'
                      : 'bg-white border-[#E8DFD8] text-[#5c3d2e]/80 hover:bg-[#F5EFEB]'
                  }`}
                >
                  <Icon size={14} className="mx-auto mb-1" />
                  <p className="text-[10px]">{label}</p>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              {mechanism === 'PERCENTAGE' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#5c3d2e]/70">Discount Percentage</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      placeholder="e.g. 15"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full px-3 py-1.5 border border-[#E8DFD8] rounded-lg text-xs bg-white focus:outline-none"
                    />
                    <span className="absolute inset-y-0 right-3 flex items-center text-[#8B7A72] text-xs font-bold">%</span>
                  </div>
                  {errors.discountValue && <p className="text-[10px] text-red-600 font-semibold mt-1">{errors.discountValue}</p>}
                </div>
              )}

              {mechanism === 'FIXED_AMOUNT' && (
                <div>
                  <label className="block text-[11px] font-bold text-[#5c3d2e]/70">Fixed Discount (Rs.)</label>
                  <div className="relative mt-1">
                    <input
                      type="number"
                      placeholder="e.g. 500"
                      value={discountValue}
                      onChange={(e) => setDiscountValue(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 border border-[#E8DFD8] rounded-lg text-xs bg-white focus:outline-none"
                    />
                    <span className="absolute inset-y-0 left-3 flex items-center text-[#8B7A72] text-[10px] font-bold">Rs.</span>
                  </div>
                  {errors.discountValue && <p className="text-[10px] text-red-600 font-semibold mt-1">{errors.discountValue}</p>}
                </div>
              )}

              {mechanism === 'CUSTOM_REWARD' && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-[#5c3d2e]/70">Describe Custom Reward</label>
                  <input
                    type="text"
                    placeholder="e.g. Free branded toy on adoption of older dog"
                    value={customRewardText}
                    onChange={(e) => setCustomRewardText(e.target.value)}
                    className="w-full mt-1 px-3 py-1.5 border border-[#E8DFD8] rounded-lg text-xs bg-white focus:outline-none"
                  />
                  {errors.customRewardText && <p className="text-[10px] text-red-600 font-semibold mt-1">{errors.customRewardText}</p>}
                </div>
              )}

              {mechanism === 'FREE_SHIPPING' && (
                <div className="sm:col-span-2 bg-emerald-50 border border-emerald-200 p-3 rounded-lg flex items-center gap-2">
                  <span className="text-emerald-700 text-xs font-medium">🐾 Delivery charges attributed to your items will be automatically waived.</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-bold text-[#5c3d2e]/70">Minimum Spend Req. (Rs.)</label>
                <div className="relative mt-1">
                  <input
                    type="number"
                    value={minSpend}
                    onChange={(e) => setMinSpend(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-[#E8DFD8] rounded-lg text-xs bg-white focus:outline-none"
                  />
                  <span className="absolute inset-y-0 left-3 flex items-center text-[#8B7A72] text-[10px] font-bold">Rs.</span>
                </div>
                {errors.minSpend && <p className="text-[10px] text-red-600 font-semibold mt-1">{errors.minSpend}</p>}
              </div>

              {mechanism === 'PERCENTAGE' && (
                <div className="sm:col-span-2 border-t border-[#E8DFD8]/20 pt-3">
                  <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-semibold">
                    <input
                      type="checkbox"
                      checked={hasMaxDiscountCap}
                      onChange={(e) => setHasMaxDiscountCap(e.target.checked)}
                      className="accent-[#5c3d2e]"
                    />
                    Apply Max Discount Ceiling CAP
                  </label>
                  {hasMaxDiscountCap && (
                    <div className="mt-2 relative max-w-[200px]">
                      <input
                        type="number"
                        placeholder="e.g. 1000"
                        value={maxDiscountCap}
                        onChange={(e) => setMaxDiscountCap(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 border border-[#E8DFD8] rounded-lg text-xs bg-white focus:outline-none"
                      />
                      <span className="absolute inset-y-0 left-3 flex items-center text-[#8B7A72] text-xs">Rs.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-[#E8DFD8]/40 pt-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#5c3d2e]/80">Start Validity</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="mt-1 w-full border border-[#E8DFD8] bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#5c3d2e]/80">End Expiry Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="mt-1 w-full border border-[#E8DFD8] bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
              />
              {errors.endDate && <p className="text-[10px] text-red-600 font-semibold mt-1">{errors.endDate}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-[#E8DFD8]/40 pt-4">
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#5c3d2e]/80">Total Campaign Limit</label>
              <input
                type="number"
                placeholder="e.g. Unlimited"
                value={totalUsageLimit}
                onChange={(e) => setTotalUsageLimit(e.target.value)}
                className="mt-1 w-full border border-[#E8DFD8] bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-extrabold uppercase tracking-wide text-[#5c3d2e]/80">Per-buyer usage</label>
              <input
                type="number"
                value={perBuyerLimit}
                onChange={(e) => setPerBuyerLimit(e.target.value)}
                className="mt-1 w-full border border-[#E8DFD8] bg-white rounded-lg px-3 py-1.5 text-xs focus:outline-none"
              />
            </div>
          </div>
        </div>

        <div className="bg-[#F5EFEB] border-t md:border-t-0 md:border-l border-[#E8DFD8] p-6 md:p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#8B7A72] block">Live Preview Card</span>
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-[#8c6753] to-[#5c3d2e] p-6 text-[#FAF6F0] border border-[#5c3d2e] shadow-xl">
              <div className="flex items-center justify-between border-b border-white/20 pb-4">
                <span className="text-xs tracking-wider uppercase font-extrabold">🐾 Promotion</span>
                <span className="text-[10px] bg-white/25 px-2 py-0.5 rounded font-medium">
                  {scope === 'WHOLE_STORE' ? 'Storewide' : `${selectedCategories.length} Categories`}
                </span>
              </div>
              <div className="my-6 space-y-2 text-center">
                <h4 className="text-3xl font-extrabold tracking-tight">
                  {mechanism === 'PERCENTAGE' && `${discountValue || 0}% OFF`}
                  {mechanism === 'FIXED_AMOUNT' && `Rs. ${discountValue || 0} OFF`}
                  {mechanism === 'FREE_SHIPPING' && 'FREE SHIPPING'}
                  {mechanism === 'CUSTOM_REWARD' && (customRewardText || 'Custom Gift')}
                </h4>
                {hasMaxDiscountCap && parseFloat(maxDiscountCap) > 0 && (
                  <p className="text-[11px] text-[#dec2b3] italic">Cap up to Rs. {maxDiscountCap}</p>
                )}
                {parseFloat(minSpend) > 0 && (
                  <p className="text-[11px] font-bold text-[#F8ECE3]">Min spend: Rs. {minSpend}</p>
                )}
              </div>
              <div className="rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 p-2.5 text-center font-mono font-bold text-sm uppercase">
                {code || 'YOURCODE'}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <button
              type="button"
              disabled={!isValid || loading}
              onClick={handlePublish}
              className={`w-full font-extrabold text-xs py-3 rounded-lg shadow-md transition text-white ${
                isValid && !loading ? 'bg-[#5c3d2e] hover:bg-opacity-95' : 'bg-[#8B7A72] cursor-not-allowed'
              }`}
            >
              {loading ? 'Publishing...' : 'Publish Promo Code'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full border border-[#E8DFD8] hover:bg-[#E8DFD8]/40 font-bold text-xs py-2 rounded-lg transition text-[#5c3d2e]"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
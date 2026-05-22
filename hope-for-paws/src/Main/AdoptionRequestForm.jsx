import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useAdoption } from '../context/AdoptionContext';
import { useAuth } from '../context/AuthContext';

const E164_PHONE_REGEX = /^\+[1-9]\d{1,14}$/;
const COUNTRY_PHONE_LENGTH_RULES = {
  '+92': { min: 10, max: 10, label: 'Pakistan' },
  '+1': { min: 10, max: 10, label: 'US/Canada' },
  '+44': { min: 10, max: 10, label: 'United Kingdom' },
  '+91': { min: 10, max: 10, label: 'India' },
};

function validateInternationalPhone(phone) {
  const trimmed = String(phone || '').trim();
  if (!trimmed) return 'Phone number is required';
  if (!E164_PHONE_REGEX.test(trimmed)) {
    return 'Enter a valid number with country code (e.g. +923001234567).';
  }
  const matchedCode = Object.keys(COUNTRY_PHONE_LENGTH_RULES)
    .sort((a, b) => b.length - a.length)
    .find((code) => trimmed.startsWith(code));
  if (!matchedCode) return null;

  const nationalNumber = trimmed.slice(matchedCode.length);
  const rule = COUNTRY_PHONE_LENGTH_RULES[matchedCode];
  if (nationalNumber.length < rule.min || nationalNumber.length > rule.max) {
    return rule.min === rule.max
      ? `Use ${rule.min} digits after ${matchedCode} for ${rule.label}.`
      : `Use ${rule.min}–${rule.max} digits after ${matchedCode} for ${rule.label}.`;
  }
  return null;
}

const inputClass =
  'w-full rounded-xl border border-[#e8dcc8] bg-white px-3 py-2.5 text-[#4E3B31] shadow-sm transition focus:border-[#a07855] focus:outline-none focus:ring-2 focus:ring-[#a07855]/25';
const inputErrorClass =
  'w-full rounded-xl border border-rose-300 bg-white px-3 py-2.5 text-[#4E3B31] shadow-sm focus:border-rose-500 focus:outline-none focus:ring-2 focus:ring-rose-200';

const AdoptionRequestForm = ({ postId, onClose }) => {
  const { requestAdoption } = useAdoption();
  const { user } = useAuth();
  const [effectiveUser, setEffectiveUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
  });
  const [phoneTouched, setPhoneTouched] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [petHistoryImage, setPetHistoryImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const applyUser = (u) => {
      if (!u) return;
      setEffectiveUser(u);
      const displayName = (u.username || u.name || '').trim();
      const phone = u.phone != null ? String(u.phone).trim() : '';
      setFormData((prev) => ({
        ...prev,
        name: displayName || prev.name,
        email: u.email || prev.email,
        phone: phone || prev.phone,
      }));
    };

    if (user) {
      applyUser(user);
      return;
    }
    try {
      const storedUser =
        JSON.parse(localStorage.getItem('user') || 'null') ||
        JSON.parse(sessionStorage.getItem('user') || 'null');
      applyUser(storedUser);
    } catch (e) {
      console.error('Error parsing stored user:', e);
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (name === 'phone') {
      setPhoneError(validateInternationalPhone(value));
    }
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    setPhoneError(validateInternationalPhone(formData.phone));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image size should be less than 5MB');
      return;
    }

    setPetHistoryImage(file);
    setError('');
    const reader = new FileReader();
    reader.onload = (ev) => setImagePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = () => {
    setPetHistoryImage(null);
    setImagePreview(null);
    const fileInput = document.querySelector('#adoption-pet-history-input');
    if (fileInput) fileInput.value = '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPhoneTouched(true);

    try {
      if (!effectiveUser) {
        throw new Error('You must be logged in to request adoption');
      }
      if (!formData.name?.trim() || !formData.email?.trim() || !formData.phone?.trim() || !formData.message?.trim()) {
        throw new Error('All fields are required');
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        throw new Error('Please enter a valid email address');
      }

      const phoneErr = validateInternationalPhone(formData.phone);
      if (phoneErr) {
        setPhoneError(phoneErr);
        throw new Error(phoneErr);
      }

      const submitData = new FormData();
      submitData.append('name', formData.name.trim());
      submitData.append('email', formData.email.trim());
      submitData.append('phone', formData.phone.trim());
      submitData.append('message', formData.message.trim());
      if (petHistoryImage) {
        submitData.append('petHistoryImage', petHistoryImage);
      }

      await requestAdoption(postId, submitData);
      setSubmitted(true);
      setTimeout(() => onClose(), 1600);
    } catch (err) {
      setError(err.message || 'Failed to submit adoption request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-2xl border border-[#e8dcc8] bg-white shadow-xl"
        role="dialog"
        aria-labelledby="adoption-request-title"
      >
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#e8dcc8] bg-white px-5 py-4">
          <h2 id="adoption-request-title" className="text-xl font-bold text-[#6b493d]">
            Request adoption
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-[#6F4C3E]/60 transition hover:bg-[#f5ebe0] hover:text-[#6b493d]"
            aria-label="Close"
          >
            <span className="text-2xl leading-none">&times;</span>
          </button>
        </div>

        {submitted ? (
          <div className="px-6 py-10 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="text-lg font-semibold text-[#4E3B31]">Request sent</p>
            <p className="mt-2 text-sm text-[#6F4C3E]/70">
              The pet owner will review your request and get back to you.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 px-5 py-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Name</label>
              <input
                type="text"
                name="name"
                required
                autoComplete="name"
                value={formData.name}
                onChange={handleChange}
                className={inputClass}
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Email</label>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                value={formData.email}
                onChange={handleChange}
                className={inputClass}
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Phone</label>
              <input
                type="tel"
                name="phone"
                required
                autoComplete="tel"
                inputMode="tel"
                value={formData.phone}
                onChange={handleChange}
                onBlur={handlePhoneBlur}
                className={phoneTouched && phoneError ? inputErrorClass : inputClass}
                placeholder="+923001234567"
                aria-invalid={phoneTouched && phoneError ? 'true' : 'false'}
                aria-describedby={phoneTouched && phoneError ? 'phone-error' : undefined}
              />
              {phoneTouched && phoneError && (
                <p id="phone-error" className="mt-1.5 text-xs text-rose-600">
                  {phoneError}
                </p>
              )}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#4E3B31]">Message</label>
              <textarea
                name="message"
                required
                value={formData.message}
                onChange={handleChange}
                rows={4}
                className={inputClass}
                placeholder="Tell the owner about your experience with pets and why you'd like to adopt…"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-[#4E3B31]">
                Pet history proof <span className="font-normal text-[#6F4C3E]/50">(optional)</span>
              </label>
              <input
                id="adoption-pet-history-input"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full text-sm text-[#6F4C3E] file:mr-3 file:cursor-pointer file:rounded-lg file:border-0 file:bg-[#6b493d] file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-[#5a3d32]"
              />
              {imagePreview && (
                <div className="relative mt-3 inline-block">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="h-28 w-28 rounded-xl border border-[#e8dcc8] object-cover"
                  />
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-rose-600 text-sm font-bold text-white hover:bg-rose-700"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2.5 text-sm text-rose-800">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-2 border-t border-[#e8dcc8] pt-4">
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[#e8dcc8] bg-[#faf6f0] px-4 py-2 text-sm font-medium text-[#6F4C3E] transition hover:bg-[#f5ebe0]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-[#6b493d] px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5a3d32] disabled:opacity-50"
              >
                {loading ? 'Submitting…' : 'Submit request'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

AdoptionRequestForm.propTypes = {
  postId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default AdoptionRequestForm;

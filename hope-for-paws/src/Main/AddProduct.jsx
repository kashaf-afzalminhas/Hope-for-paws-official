import React, { useState } from 'react';
import axios from 'axios';
import { Package, Image as ImageIcon, CheckCircle, Tag, Settings, List, Info, ArrowLeft, Loader2, UploadCloud, X, AlertCircle, Trash2, Plus, ChevronDown } from 'lucide-react';

const API_URL = 'http://localhost:3000/api/sellers';

const getAxiosConfig = () => {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` }
  };
};

import { PRODUCT_CATEGORIES as CATEGORIES } from '../utils/constants';

const AddProduct = ({ productId, onCancel, onSuccess }) => {
  const isEditMode = !!productId;
  const [activeSection, setActiveSection] = useState('basic');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [error, setError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const categoryMenuRef = React.useRef(null);
  const [customCategories, setCustomCategories] = useState([]);

  const [existingImages, setExistingImages] = useState([]);
  const [imagesToDelete, setImagesToDelete] = useState([]);

  const [formData, setFormData] = useState({
    title: '',
    brand: '',
    category: '',
    description: '',
    price: '',
    discountPercentage: '',
    countInStock: '',
    lowStockThreshold: 5,
    sku: ''
  });
  const [customCategory, setCustomCategory] = useState('');

  const [skuWarning, setSkuWarning] = useState('');

  const [customFields, setCustomFields] = useState([{ heading: '', description: '' }]);
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaPreviews, setMediaPreviews] = useState([]);

  const addCustomField = () => {
    setCustomFields(prev => [...prev, { heading: '', description: '' }]);
  };

  const handleFieldChange = (index, field, value) => {
    const updatedFields = [...customFields];
    updatedFields[index][field] = value;
    setCustomFields(updatedFields);
  };

  const removeCustomField = (index) => {
    setCustomFields(prev => prev.filter((_, i) => i !== index));
  };

  React.useEffect(() => {
    if (isEditMode) {
      const fetchProductData = async () => {
        setIsFetchingData(true);
        try {
          const { data } = await axios.get(`${API_URL}/products/${productId}`, getAxiosConfig());
          const category = data.category || '';
          const isPredefinedCategory = CATEGORIES.includes(category);
          setFormData({
            title: data.title || '',
            brand: data.brand || '',
            category: isPredefinedCategory ? category : 'Other',
            description: data.description || '',
            price: data.price !== undefined ? data.price : '',
            discountPercentage: data.discountPercentage !== undefined ? data.discountPercentage : '',
            countInStock: data.countInStock !== undefined ? data.countInStock : '',
            lowStockThreshold: data.lowStockThreshold ?? 5,
            sku: data.sku || ''
          });
          setCustomCategory(isPredefinedCategory ? '' : category);
          if (data.additionalInfo && data.additionalInfo.length > 0) {
            setCustomFields(data.additionalInfo);
          }
          if (data.images) {
            setExistingImages(data.images);
          }
        } catch (err) {
          setError('Failed to fetch product details.');
        } finally {
          setIsFetchingData(false);
        }
      };
      fetchProductData();
    }
  }, [productId, isEditMode]);

  React.useEffect(() => {
    const fetchCustomCategories = async () => {
      try {
        const { data } = await axios.get(`${API_URL}/product-categories`, getAxiosConfig());
        setCustomCategories(
          Array.isArray(data)
            ? data.filter(category => !CATEGORIES.includes(category) && category !== 'Other')
            : []
        );
      } catch {
        setCustomCategories([]);
      }
    };

    fetchCustomCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleCategoryChange = (e) => {
    const { value } = e.target;
    setFormData(prev => ({ ...prev, category: value }));
    if (value !== 'Other') {
      setCustomCategory('');
    }
  };

  const selectCategory = (value) => {
    handleCategoryChange({ target: { value } });
    setIsCategoryOpen(false);
  };

  React.useEffect(() => {
    const closeCategoryMenu = (event) => {
      if (categoryMenuRef.current && !categoryMenuRef.current.contains(event.target)) {
        setIsCategoryOpen(false);
      }
    };

    document.addEventListener('mousedown', closeCategoryMenu);
    return () => document.removeEventListener('mousedown', closeCategoryMenu);
  }, []);

  const handleMediaChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + mediaFiles.length + existingImages.length > 5) {
      setUploadError("You can only upload a maximum of 5 images.");
      e.target.value = '';
      return;
    }
    
    setUploadError('');
    setMediaFiles(prev => [...prev, ...files]);
    
    const previews = files.map(file => URL.createObjectURL(file));
    setMediaPreviews(prev => [...prev, ...previews]);
    e.target.value = '';
  };

  const removeMedia = (index) => {
    setMediaFiles(prev => prev.filter((_, i) => i !== index));
    setMediaPreviews(prev => prev.filter((_, i) => i !== index));
    setUploadError('');
  };

  const removeExistingMedia = (index) => {
    const urlToRemove = existingImages[index];
    setImagesToDelete(prev => [...prev, urlToRemove]);
    setExistingImages(prev => prev.filter((_, i) => i !== index));
    setUploadError('');
  };

  const generateSKU = () => {
    if (!formData.title || !formData.category) {
      setSkuWarning("Please enter a title and category first to auto-generate a SKU.");
      setTimeout(() => setSkuWarning(''), 4000);
      return;
    }
    setSkuWarning('');
    const prefix = formData.category.substring(0, 3).toUpperCase();
    const namePart = formData.title.substring(0, 3).toUpperCase();
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    setFormData(prev => ({ ...prev, sku: `${prefix}-${namePart}-${randomNum}` }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    const category = formData.category === 'Other'
      ? customCategory.trim()
      : formData.category;

    if (!category) {
      setError('Please enter a custom category.');
      setIsSubmitting(false);
      return;
    }

    // Frontend Validations
    if (Number(formData.price) < 0) {
      setError("Price cannot be negative.");
      setIsSubmitting(false);
      return;
    }
    if (
      formData.discountPercentage &&
      (Number(formData.discountPercentage) < 0 ||
        Number(formData.discountPercentage) > 100)
    ) {
      setError("Discount percentage must be between 0 and 100.");
      setIsSubmitting(false);
      return;
    }
    if (Number(formData.countInStock) < 0) {
      setError("Stock count cannot be negative.");
      setIsSubmitting(false);
      return;
    }
    if (formData.lowStockThreshold !== '' && Number(formData.lowStockThreshold) < 0) {
      setError("Low stock threshold cannot be negative.");
      setIsSubmitting(false);
      return;
    }
    if (mediaFiles.length === 0 && existingImages.length === 0) {
      setError("Please have at least one product image.");
      setIsSubmitting(false);
      return;
    }

    try {
      const submitData = new FormData();
      Object.keys(formData).forEach(key => {
        if (key === 'category') {
          submitData.append(key, category);
        } else if (formData[key] !== '') {
          submitData.append(key, formData[key]);
        }
      });
      
      // Attach the custom fields as a JSON string
      const validFields = customFields.filter(f => f.heading.trim() !== '' && f.description.trim() !== '');
      if (validFields.length > 0) {
        submitData.append('additionalInfo', JSON.stringify(validFields));
      }
      
      mediaFiles.forEach(file => {
        submitData.append('media', file);
      });

      if (imagesToDelete.length > 0) {
        submitData.append('imagesToDelete', JSON.stringify(imagesToDelete));
      }

      if (isEditMode) {
        await axios.put(`${API_URL}/products/${productId}`, submitData, getAxiosConfig());
      } else {
        await axios.post(`${API_URL}/products`, submitData, getAxiosConfig());
      }
      if (!CATEGORIES.includes(category) && category !== 'Other') {
        setCustomCategories(prev => [...new Set([...prev, category])].sort((first, second) => first.localeCompare(second)));
      }
      onSuccess(); // Triggers refresh and goes back to dashboard
    } catch (err) {
      setError(err.response?.data?.message || 'An error occurred while publishing the product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetchingData) {
    return (
      <div className="w-full min-h-screen bg-[#fcfaf8] flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 text-[#6b493d] animate-spin mb-4" />
        <p className="text-[#8c6b5d] font-medium animate-pulse">Loading product details...</p>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-[#fcfaf8]">
      {/* Sticky Header with Glassmorphism */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-stone-200 px-8 py-4 flex justify-between items-center transition-all duration-300">
        <div className="flex items-center space-x-4">
          <button onClick={onCancel} className="p-2 hover:bg-stone-100 rounded-full transition-colors text-stone-600">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-[#6b493d] tracking-wide">
            {isEditMode ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            type="button" 
            onClick={onCancel}
            className="px-6 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button 
            type="submit"
            form="add-product-form"
            disabled={isSubmitting}
            className="px-6 py-2 bg-[#6b493d] text-white font-medium hover:bg-[#8c6b5d] rounded-lg transition-colors flex items-center shadow-md disabled:opacity-70"
          >
            {isSubmitting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
            ) : (
              <><CheckCircle className="w-4 h-4 mr-2" /> {isEditMode ? 'Save Changes' : 'Publish Immediately'}</>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="mx-8 mt-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          {error}
        </div>
      )}

      <div className="max-w-7xl mx-auto px-8 py-10 flex items-start space-x-10">
        
        {/* Left Column: 25% Navigation */}
        <div className="w-[25%] sticky top-28 bg-transparent">
          <nav className="space-y-2">
            {[
              { id: 'basic', icon: Info, label: '1. Basic Details' },
              { id: 'pricing', icon: Tag, label: '2. Pricing & Inventory' },
              { id: 'media', icon: ImageIcon, label: '3. Product Media' },
              { id: 'additional', icon: List, label: '4. Additional Info' }
            ].map(nav => (
              <a 
                key={nav.id}
                href={`#${nav.id}`}
                onClick={(e) => { e.preventDefault(); setActiveSection(nav.id); document.getElementById(nav.id)?.scrollIntoView({ behavior: 'smooth' }); }}
                className={`flex items-center space-x-3 px-5 py-3 rounded-xl font-medium transition-all duration-200 ${
                  activeSection === nav.id 
                    ? 'bg-[#6b493d]/10 text-[#6b493d] shadow-sm' 
                    : 'text-stone-500 hover:bg-stone-100 hover:text-stone-800'
                }`}
              >
                <nav.icon className="w-5 h-5" />
                <span>{nav.label}</span>
              </a>
            ))}
          </nav>
        </div>

        {/* Right Column: 75% Form Content */}
        <form id="add-product-form" onSubmit={handleSubmit} className="w-[75%] space-y-8 pb-32">
          
          {/* Card 1: Basic Details */}
          <div id="basic" className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 border border-stone-100 rounded-2xl p-8" onMouseEnter={() => setActiveSection('basic')}>
            <h2 className="text-2xl font-bold text-[#6b493d] mb-6 tracking-wide">Basic Details</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Product Name *</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange} required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-4 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-stone-50 focus:bg-white"
                  placeholder="e.g. Premium Grain-Free Dog Food" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Brand *</label>
                  <input type="text" name="brand" value={formData.brand} onChange={handleInputChange} required
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-4 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-stone-50 focus:bg-white"
                    placeholder="e.g. Royal Canin" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Category *</label>
                  <div ref={categoryMenuRef} className="relative">
                    <button
                      type="button"
                      onClick={() => setIsCategoryOpen(prev => !prev)}
                      aria-haspopup="listbox"
                      aria-expanded={isCategoryOpen}
                      className="block w-full px-3 py-3 border border-[#a07855] text-left text-[#4E3B31] rounded-md focus:outline-none focus:ring-1 focus:ring-[#6b493d] focus:border-[#6b493d] bg-white transition-colors"
                    >
                      <span className="flex items-center justify-between">
                        <span>{formData.category || 'Select a category'}</span>
                        <ChevronDown className={`h-4 w-4 transition-transform ${isCategoryOpen ? 'rotate-180' : ''}`} />
                      </span>
                    </button>
                    {isCategoryOpen && (
                      <div
                        role="listbox"
                        aria-label="Product category"
                        className="absolute left-0 right-0 top-full z-50 mt-1 max-h-60 overflow-y-auto rounded-md border border-[#a07855] bg-white py-1 text-[#4E3B31] shadow-lg"
                      >
                        <button
                          type="button"
                          role="option"
                          aria-selected={!formData.category}
                          onClick={() => selectCategory('')}
                          className="block w-full px-3 py-2 text-left text-sm hover:bg-[#F8F4ED]"
                        >
                          Select a category
                        </button>
                        {CATEGORIES.map(categoryOption => (
                          <button
                            type="button"
                            role="option"
                            aria-selected={formData.category === categoryOption}
                            key={categoryOption}
                            onClick={() => selectCategory(categoryOption)}
                            className="block w-full px-3 py-2 text-left text-sm hover:bg-[#F8F4ED]"
                          >
                            {categoryOption}
                          </button>
                        ))}
                        {customCategories.length > 0 && (
                          <>
                            <div className="border-t border-[#a07855]/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#6b493d]">
                              Your custom categories
                            </div>
                            {customCategories.map(categoryOption => (
                              <button
                                type="button"
                                role="option"
                                aria-selected={formData.category === categoryOption}
                                key={`custom-${categoryOption}`}
                                onClick={() => selectCategory(categoryOption)}
                                className="block w-full px-3 py-2 text-left text-sm hover:bg-[#F8F4ED]"
                              >
                                {categoryOption}
                              </button>
                            ))}
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
              {formData.category === 'Other' && (
                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-2">Custom Category *</label>
                  <input
                    type="text"
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    required
                    className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-4 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-stone-50 focus:bg-white"
                    placeholder="e.g. Reptile Supplies"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Description *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows={5} required
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-4 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-stone-50 focus:bg-white resize-none"
                  placeholder="Provide a detailed description of the product..." />
              </div>
            </div>
          </div>

          {/* Card 2: Pricing & Inventory */}
          <div id="pricing" className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 border border-stone-100 rounded-2xl p-8" onMouseEnter={() => setActiveSection('pricing')}>
            <h2 className="text-2xl font-bold text-[#6b493d] mb-6 tracking-wide">Pricing & Inventory</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Regular Price (Rs.) *</label>
                <input type="number" name="price" value={formData.price} onChange={handleInputChange} required min="0"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-4 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-stone-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Discount Percentage (%)</label>
                <input type="number" name="discountPercentage" value={formData.discountPercentage} onChange={handleInputChange} min="0"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-4 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-stone-50 focus:bg-white"
                  placeholder="Optional" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Stock Count *</label>
                <input type="number" name="countInStock" value={formData.countInStock} onChange={handleInputChange} required min="0"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-4 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-stone-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-stone-700 mb-2">Low Stock Alert Threshold</label>
                <input 
                  type="number" 
                  name="lowStockThreshold" 
                  value={formData.lowStockThreshold} 
                  onChange={handleInputChange} 
                  min="0"
                  className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:ring-4 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-stone-50 focus:bg-white" 
                  placeholder="e.g. 5" 
                />
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium text-stone-700 mb-2">SKU (Stock Keeping Unit) *</label>
                <div className="relative">
                  <input type="text" name="sku" value={formData.sku} onChange={handleInputChange} required
                    className="w-full pl-4 pr-28 py-3 rounded-xl border border-stone-200 focus:ring-4 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-stone-50 focus:bg-white uppercase"
                    placeholder="e.g. RC-DOG-001" />
                  <button 
                    type="button" 
                    onClick={generateSKU} 
                    className="absolute right-2 top-2 bottom-2 px-3 bg-[#6b493d]/10 hover:bg-[#6b493d] hover:text-white text-[#6b493d] rounded-lg text-xs font-semibold transition-all duration-200"
                  >
                    Auto Generate
                  </button>
                </div>
                {skuWarning && (
                  <p className="flex items-center gap-1.5 text-xs text-amber-700 font-medium mt-2">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0 text-amber-600" />
                    {skuWarning}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Product Media */}
          <div id="media" className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 border border-stone-100 rounded-2xl p-8" onMouseEnter={() => setActiveSection('media')}>
            <h2 className="text-2xl font-bold text-[#6b493d] mb-6 tracking-wide">Product Media</h2>
            <div className="relative border-2 border-dashed border-stone-300 rounded-2xl p-12 bg-stone-50 flex flex-col items-center justify-center hover:bg-[#6b493d]/5 hover:border-[#6b493d]/30 transition-all duration-300 group cursor-pointer">
              <UploadCloud className="w-14 h-14 text-stone-400 mb-4 group-hover:text-[#6b493d] transition-colors duration-300 group-hover:scale-110 transform" />
              <p className="text-stone-800 font-semibold mb-2">Drag & drop your images here</p>
              <p className="text-stone-500 text-sm mb-6">or click to browse from your computer (Max 5 images)</p>
              <input 
                type="file" 
                multiple 
                accept="image/*" 
                onChange={handleMediaChange}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <button type="button" className="px-6 py-2.5 bg-white border border-stone-200 text-stone-700 rounded-xl shadow-sm font-medium pointer-events-none group-hover:border-[#6b493d]/30 group-hover:text-[#6b493d] transition-colors">
                Browse Files
              </button>
            </div>
            
            {uploadError && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center text-sm">
                <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
                {uploadError}
              </div>
            )}
            
            {/* Image Previews */}
            {(existingImages.length > 0 || mediaPreviews.length > 0) && (
              <div className="mt-8 flex flex-wrap gap-5">
                {existingImages.map((src, idx) => (
                  <div key={`existing-${idx}`} className="relative w-28 h-28 rounded-xl overflow-hidden border border-stone-200 shadow-sm group">
                    <img src={src.startsWith('http') ? src : `http://localhost:3000${src}`} alt="preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <button 
                      type="button" 
                      onClick={() => removeExistingMedia(idx)}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
                {mediaPreviews.map((src, idx) => (
                  <div key={`new-${idx}`} className="relative w-28 h-28 rounded-xl overflow-hidden border border-stone-200 shadow-sm group">
                    <img src={src} alt="preview" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <button 
                      type="button" 
                      onClick={() => removeMedia(idx)}
                      className="absolute top-2 right-2 bg-white/90 backdrop-blur text-red-500 rounded-full p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Card 4: Additional Info */}
          <div id="additional" className="bg-white shadow-sm hover:shadow-md transition-shadow duration-300 border border-stone-100 rounded-2xl p-8" onMouseEnter={() => setActiveSection('additional')}>
            <h2 className="text-2xl font-bold text-[#6b493d] mb-2 tracking-wide">Additional Info</h2>
            <p className="text-sm text-[#856046] mb-6">Add dynamic custom fields like Material, Dimensions, Expiry Date, or Instructions.</p>
            
            <div className="space-y-4 mb-6">
              {customFields.map((field, index) => (
                <div key={index} className="flex gap-4 items-start p-4 bg-stone-50 border border-stone-200 rounded-xl relative group">
                  <div className="flex-1 space-y-3">
                    <input 
                      type="text" 
                      value={field.heading} 
                      onChange={(e) => handleFieldChange(index, 'heading', e.target.value)}
                      placeholder="e.g., Material, Dimensions, Expiry"
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-white text-sm font-semibold text-stone-800"
                    />
                    <textarea 
                      value={field.description} 
                      onChange={(e) => handleFieldChange(index, 'description', e.target.value)}
                      placeholder="Enter details..."
                      rows={2}
                      className="w-full px-4 py-2.5 rounded-lg border border-stone-200 focus:ring-2 focus:ring-[#6b493d]/20 focus:border-[#6b493d] outline-none transition-all bg-white text-sm text-stone-700 resize-none"
                    />
                  </div>
                  <button 
                    type="button" 
                    onClick={() => removeCustomField(index)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Remove Field"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="space-y-2">
              <button
                type="button"
                onClick={addCustomField}
                disabled={customFields.length >= 5}
                className={`w-full py-3 border-2 border-dashed rounded-xl font-medium flex items-center justify-center transition-colors ${
                  customFields.length >= 5 
                    ? 'border-gray-200 text-gray-400 opacity-50 cursor-not-allowed bg-gray-50'
                    : 'border-[#c9a280] text-[#856046] hover:bg-[#F8F4ED] hover:border-[#6b493d] hover:text-[#6b493d]'
                }`}
              >
                <Plus size={18} className="mr-2" />
                Add Custom Detail
              </button>
              {customFields.length >= 5 && (
                <p className="text-center text-xs text-gray-400 mt-2">
                  Maximum of 5 custom fields reached.
                </p>
              )}
            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default AddProduct;

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useRequireAuth } from '../Components/AuthGuard';
import { API_BASE_URL } from '../config';

const PAKISTAN_CITIES = [
  'Abbottabad', 'Attock', 'Bahawalpur', 'Bahawalnagar', 'Bannu', 'Battagram',
  'Bhakkar', 'Chakwal', 'Chaman', 'Chiniot', 'Chishtian', 'Dadu', 'Dera Ghazi Khan',
  'Dera Ismail Khan', 'Faisalabad', 'Ghotki', 'Gilgit', 'Gojra', 'Gujranwala',
  'Gujrat', 'Hafizabad', 'Haripur', 'Hyderabad', 'Islamabad', 'Jacobabad',
  'Jhelum', 'Kamalia', 'Karachi', 'Kasur', 'Khanewal', 'Khushab', 'Khuzdar',
  'Kohat', 'Kot Addu', 'Lahore', 'Larkana', 'Layyah', 'Lodhran', 'Mansehra',
  'Mardan', 'Mirpur', 'Mirpur Khas', 'Multan', 'Muzaffarabad', 'Muzaffargarh',
  'Narowal', 'Nawabshah', 'Nowshera', 'Okara', 'Pakpattan', 'Peshawar',
  'Quetta', 'Rahim Yar Khan', 'Rawalpindi', 'Sadiqabad', 'Sahiwal', 'Sargodha',
  'Sheikhupura', 'Sialkot', 'Sibi', 'Sukkur', 'Swabi', 'Swat', 'Tando Adam',
  'Taxila', 'Turbat', 'Vehari', 'Wah Cantonment', 'Zhob',
];

// Image validation constants
const MAX_FILE_SIZE_MB = 2; // 2MB per image
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 10;
const MAX_TOTAL_SIZE_MB = 20; // Total combined size across all selected images
const MAX_TOTAL_SIZE_BYTES = MAX_TOTAL_SIZE_MB * 1024 * 1024;

const AdoptionForm = () => {
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [petType, setPetType] = useState('');
  const [breed, setBreed] = useState('');
  const [vaccinated, setVaccinated] = useState('');
  const [neuteredSpayed, setNeuteredSpayed] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [images, setImages] = useState([]); // Array of File objects
  const [imagePreviews, setImagePreviews] = useState([]); // Array of data URLs
  const [imageErrors, setImageErrors] = useState([]); // Array of error messages for each image
  const [error, setError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const locationRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);

  const filteredCities = locationQuery.length > 0
    ? PAKISTAN_CITIES.filter(c =>
        c.toLowerCase().includes(locationQuery.toLowerCase())
      )
    : PAKISTAN_CITIES;
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const requireAuth = useRequireAuth();

  /**
   * Validate a single image file
   * Returns { valid: boolean, error?: string }
   */
  const validateImageFile = (file) => {
    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    // Check file type
    if (!ALLOWED_FORMATS.includes(file.type)) {
      return {
        valid: false,
        error: `${file.name}: Invalid format. Only JPEG, PNG, and WebP are allowed.`
      };
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE_BYTES) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
      return {
        valid: false,
        error: `${file.name}: File size ${sizeMB}MB exceeds maximum of ${MAX_FILE_SIZE_MB}MB.`
      };
    }

    return { valid: true };
  };

  /**
   * Handle image selection from file input
   * Supports adding multiple images in a single selection or multiple selections
   */
  const handleImageChange = useCallback((e) => {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    // Check if adding these files would exceed the max limit
    if (images.length + selectedFiles.length > MAX_IMAGES) {
      setError(`Cannot add more than ${MAX_IMAGES} images total. You currently have ${images.length} image(s).`);
      return;
    }

    // Check if adding these files would exceed the total combined size limit
    const currentTotalSize = images.reduce((sum, img) => sum + img.size, 0);
    const newFilesTotalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (currentTotalSize + newFilesTotalSize > MAX_TOTAL_SIZE_BYTES) {
      const currentMB = (currentTotalSize / (1024 * 1024)).toFixed(1);
      const wouldBeMB = ((currentTotalSize + newFilesTotalSize) / (1024 * 1024)).toFixed(1);
      setError(
        `Adding these images would bring your total to ${wouldBeMB}MB, exceeding the ${MAX_TOTAL_SIZE_MB}MB combined limit. You currently have ${currentMB}MB used. Try selecting fewer or smaller images.`
      );
      return;
    }

    const newImages = [];
    const newErrors = [...imageErrors];
    let hasError = false;

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i];
      const validation = validateImageFile(file);

      if (!validation.valid) {
        newErrors.push(validation.error);
        hasError = true;
        continue; // Skip this file, don't add to images/previews
      }

      // Check for duplicates by comparing file name and size
      const isDuplicate = images.some(
        img => img.name === file.name && img.size === file.size
      );

      if (isDuplicate) {
        newErrors.push(`${file.name}: This file is already selected.`);
        hasError = true;
        continue;
      }

      newImages.push(file);

      // Create preview for valid image
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    }

    // Update state
    if (newImages.length > 0) {
      setImages(prev => [...prev, ...newImages]);
      setError(''); // Clear general error if we successfully added images
    }

    if (hasError) {
      setImageErrors(newErrors);
    } else {
      setImageErrors([]);
    }

    // Reset file input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [images, imageErrors]);

  /**
   * Remove a single image by index
   */
  const handleRemoveImage = (indexToRemove) => {
    setImages(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setImagePreviews(prev => prev.filter((_, idx) => idx !== indexToRemove));
    // Also remove any errors for this image
    setImageErrors(prev => prev.filter((_, idx) => idx !== indexToRemove));
    setError('');
  };

  /**
   * Remove all images
   */
  const handleRemoveAllImages = () => {
    setImages([]);
    setImagePreviews([]);
    setImageErrors([]);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    // Guard: block submission if age is invalid
    if (!age || parseFloat(age) <= 0 || isNaN(parseFloat(age))) {
      setAgeError('Pet age must be greater than 0');
      setIsSubmitting(false);
      return;
    }

    // Guard: block submission if location is not selected
    if (!location || location.trim() === '') {
      setLocationError('Please select a valid city from the list');
      setIsSubmitting(false);
      return;
    }

    // Guard: require at least one image
    if (images.length === 0) {
      setError('Please select at least one image');
      setIsSubmitting(false);
      return;
    }

    // Guard: check for image validation errors
    if (imageErrors.length > 0) {
      setError(`Please fix image errors: ${imageErrors.join(' ')}`);
      setIsSubmitting(false);
      return;
    }

    // Guard: re-check total combined image size before submitting
    const totalImageSize = images.reduce((sum, img) => sum + img.size, 0);
    if (totalImageSize > MAX_TOTAL_SIZE_BYTES) {
      const totalMB = (totalImageSize / (1024 * 1024)).toFixed(1);
      setError(`Total image size (${totalMB}MB) exceeds the ${MAX_TOTAL_SIZE_MB}MB limit. Please remove some images.`);
      setIsSubmitting(false);
      return;
    }

    if (!requireAuth('create an adoption post')) {
      setIsSubmitting(false);
      return;
    }

    const token = localStorage.getItem('token') || sessionStorage.getItem('token');

    const formData = new FormData();
    formData.append('name', name);
    formData.append('age', age);
    formData.append('petType', petType);
    formData.append('breed', breed);
    formData.append('vaccinated', vaccinated);
    formData.append('neuteredSpayed', neuteredSpayed);
    formData.append('description', description);
    formData.append('location', location);

    // Append all images
    for (const image of images) {
      formData.append('images', image);
    }

    // Debug: Log what's being sent
    console.log('Form data being sent:');
    console.log('name:', name);
    console.log('age:', age);
    console.log('petType:', petType);
    console.log('breed:', breed);
    console.log('vaccinated:', vaccinated);
    console.log('neuteredSpayed:', neuteredSpayed);
    console.log('description:', description);
    console.log('location:', location);
    console.log('number of images:', images.length);
    console.log('images:', images.map(img => img.name));

    try {
      const response = await fetch(`${API_BASE_URL}/adoptions`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create adoption post');
      }

      const data = await response.json();
      console.log('Adoption post created:', data);

      // Auto-redirect to My Adoptions page after successful submission
      navigate('/my-adoptions', {
        state: {
          message: 'Adoption post created successfully!',
          showSuccess: true
        }
      });
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message || 'Failed to submit form');
      setIsSubmitting(false);
    }
  };

  // Show loading state while auth is initializing
  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#8B5A2B]"></div>
      </div>
    );
  }

  // Show login prompt if not authenticated
  if (!isAuthenticated || !user) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg text-center">
        <p className="mb-2">You need to be logged in to create an adoption post.</p>
        <p className="text-sm mb-4">Please log in and try again.</p>

        {/* Debug information */}
        <div className="text-xs text-gray-600 mt-4 p-2 bg-gray-100 rounded">
          <p><strong>Debug Info:</strong></p>
          <p>isAuthenticated: {isAuthenticated ? 'true' : 'false'}</p>
          <p>user: {user ? 'present' : 'null'}</p>
          <p>localStorage token: {localStorage.getItem('token') || sessionStorage.getItem('token') ? 'present' : 'missing'}</p>
          <p>localStorage user: {localStorage.getItem('user') || sessionStorage.getItem('user') ? 'present' : 'missing'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Pet Name
            </label>
            <input
              type="text"
              placeholder="e.g., Buddy"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Age (years)
            </label>
            <input
              type="number"
              placeholder="e.g., 2"
              value={age}
              min="0.1"
              step="0.1"
              onChange={(e) => {
                const val = e.target.value;
                setAge(val);
                if (val === '' || val === null) {
                  setAgeError('');
                } else if (parseFloat(val) <= 0) {
                  setAgeError('Pet age must be greater than 0');
                } else if (isNaN(parseFloat(val))) {
                  setAgeError('Please enter a valid number');
                } else {
                  setAgeError('');
                }
              }}
              onKeyDown={(e) => {
                // Block minus sign from being typed
                if (e.key === '-') e.preventDefault();
              }}
              required
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent ${
                ageError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {ageError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <span>⚠️</span> {ageError}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Breed
            </label>
            <input
              type="text"
              placeholder="e.g., Labrador, Persian Cat, German Shepherd"
              value={breed}
              onChange={(e) => setBreed(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Pet Type
            </label>
            <select
              value={petType}
              onChange={(e) => setPetType(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent bg-white"
            >
              <option value="">Select pet type</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Hamster">Hamster</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Vaccinated
            </label>
            <select
              value={vaccinated}
              onChange={(e) => setVaccinated(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent bg-white"
            >
              <option value="">Select vaccination status</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Neutered/Spayed
            </label>
            <select
              value={neuteredSpayed}
              onChange={(e) => setNeuteredSpayed(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent bg-white"
            >
              <option value="">Select neutering status</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
          </div>
        </div>

        <div className="space-y-2" ref={locationRef}>
          <label className="block text-sm font-medium text-[#4E3B31]">
            Location <span className="text-xs text-[#8d6e63] font-normal">(Pakistan only)</span>
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="Search city, e.g. Lahore"
              value={locationQuery}
              onChange={(e) => {
                const val = e.target.value;
                setLocationQuery(val);
                setLocation('');
                setShowCitySuggestions(true);
                if (val.trim() === '') {
                  setLocationError('');
                } else {
                  setLocationError('Please select a city from the list');
                }
              }}
              onFocus={() => setShowCitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
              required
              autoComplete="off"
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent ${
                locationError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />

            {/* Dropdown suggestions */}
            {showCitySuggestions && filteredCities.length > 0 && (
              <ul className="absolute z-50 w-full mt-1 bg-white border border-[#bca18a] rounded-md shadow-lg max-h-52 overflow-y-auto">
                {filteredCities.map((city) => (
                  <li
                    key={city}
                    onMouseDown={() => {
                      setLocation(city);
                      setLocationQuery(city);
                      setLocationError('');
                      setShowCitySuggestions(false);
                    }}
                    className="px-4 py-2 text-sm text-[#4E3B31] hover:bg-[#f3ede7] cursor-pointer transition-colors"
                  >
                    {city}
                  </li>
                ))}
              </ul>
            )}
            {showCitySuggestions && locationQuery.length > 0 && filteredCities.length === 0 && (
              <div className="absolute z-50 w-full mt-1 bg-white border border-red-200 rounded-md shadow-lg px-4 py-3 text-sm text-red-600">
                No Pakistani city found matching "{locationQuery}"
              </div>
            )}
          </div>
          {locationError && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <span>⚠️</span> {locationError}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#4E3B31]">
            Description
          </label>
          <textarea
            placeholder="Tell us about your pet's personality, habits, and needs..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent resize-y"
          />
        </div>

        {/* Image Upload Section - Multiple Images */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Pet Photos ({images.length}/{MAX_IMAGES})
            </label>
            {images.length > 0 && (
              <button
                type="button"
                onClick={handleRemoveAllImages}
                className="text-xs text-red-600 hover:text-red-700 font-medium"
              >
                Remove all
              </button>
            )}
          </div>

          {/* Image Upload Area */}
          <div className="flex flex-col items-center justify-center border-2 border-dashed border-[#bca18a] rounded-lg p-6 bg-[#f7f4f0] relative hover:bg-[#f3ede7] transition-colors min-h-[200px]">
            {imagePreviews.length > 0 ? (
              <div className="w-full">
                {/* Image previews grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
                  {imagePreviews.map((preview, idx) => (
                    <div key={idx} className="relative group">
                      <div className="relative overflow-hidden rounded-lg bg-gray-200 aspect-square">
                        <img
                          src={preview}
                          alt={`Preview ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRemoveImage(idx);
                        }}
                        className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 hover:scale-110 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold transition-all z-10 shadow-md"
                        title="Remove image"
                      >
                        ✕
                      </button>
                      <span className="absolute bottom-1 left-1 right-1 text-xs bg-black/60 text-white px-1 py-0.5 rounded truncate">
                        {idx + 1}/{images.length}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Add more button if not at max */}
                {images.length < MAX_IMAGES && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full py-2 px-4 text-sm border border-[#bca18a] text-[#6b493d] rounded-md hover:bg-[#f3ede7] transition-colors font-medium"
                  >
                    + Add more photos ({images.length}/{MAX_IMAGES})
                  </button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center pt-5 pb-6 w-full">
                <svg className="w-10 h-10 mb-3 text-[#6b493d]" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"></path>
                </svg>
                <p className="mb-2 text-sm text-[#6b493d]"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                <p className="text-xs text-[#6b493d]">PNG, JPG or JPEG (MAX. {MAX_FILE_SIZE_MB}MB per image, up to {MAX_IMAGES} images, {MAX_TOTAL_SIZE_MB}MB total)</p>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              id="adoption-images"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              onChange={handleImageChange}
              accept="image/*"
              multiple
              disabled={isSubmitting}
            />
          </div>

          {/* Image Validation Errors */}
          {imageErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs font-semibold text-red-700 mb-1">Image errors:</p>
              <ul className="text-xs text-red-600 space-y-1">
                {imageErrors.map((err, idx) => (
                  <li key={idx} className="flex items-start gap-1">
                    <span className="mt-0.5">•</span>
                    <span>{err}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || images.length === 0}
            className="w-full py-3 px-4 bg-[#8B5A2B] hover:bg-[#6F4C3E] text-white font-medium rounded-md shadow-sm transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#8B5A2B] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Creating Post...
              </span>
            ) : (
              "Create Adoption Post"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AdoptionForm;
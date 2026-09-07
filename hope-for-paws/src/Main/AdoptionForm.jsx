import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useRequireAuth } from '../Components/AuthGuard';
import { API_BASE_URL } from '../config';



// Image validation constants
const MAX_FILE_SIZE_MB = 2; // 2MB per image
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_IMAGES = 5;
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
  const [nameError, setNameError] = useState('');
  const [ageError, setAgeError] = useState('');
  const [petTypeError, setPetTypeError] = useState('');
  const [breedError, setBreedError] = useState('');
  const [vaccinatedError, setVaccinatedError] = useState('');
  const [neuteredSpayedError, setNeuteredSpayedError] = useState('');
  const [descriptionError, setDescriptionError] = useState('');
  const [locationError, setLocationError] = useState('');
  const [imagesError, setImagesError] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [showCitySuggestions, setShowCitySuggestions] = useState(false);
  const locationRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const [cities, setCities] = useState([]);
  const [citiesLoading, setCitiesLoading] = useState(true);

  // Fetch cities dynamically from the backend on mount
  useEffect(() => {
    const fetchCities = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/adoptions/cities`);
        if (!response.ok) throw new Error('Failed to fetch cities');
        const data = await response.json();
        setCities(data);
      } catch (err) {
        console.error('Error fetching cities:', err);
      } finally {
        setCitiesLoading(false);
      }
    };
    fetchCities();
  }, []);

  const filteredCities = locationQuery.length > 0
    ? cities.filter(c =>
        c.toLowerCase().includes(locationQuery.toLowerCase())
      )
    : cities;
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
   * Validate the Breed field.
   * Catches edge cases the old "just check it's non-empty" logic missed:
   * single letters ("f"), digits-only entries, symbol spam, and
   * repeated-character junk (e.g. "aaaa").
   * Returns an error message, or '' if the value is valid.
   */
  const validateBreedValue = (value) => {
    const trimmed = value.trim();

    if (trimmed === '') {
      return 'Breed is required';
    }
    if (trimmed.length < 3) {
      return 'Breed must be at least 3 characters';
    }
    if (trimmed.length > 50) {
      return 'Breed must be under 50 characters';
    }
    // Letters, spaces, hyphens, and apostrophes only — covers names like
    // "German Shepherd", "Shih-Tzu", and "Mixed / Don't know".
    if (!/^[A-Za-z\s'-]+$/.test(trimmed)) {
      return 'Breed can only contain letters, spaces, and hyphens';
    }
    // Must contain at least 2 distinct letters so "fff" or "xx" can't pass.
    const distinctLetters = new Set(trimmed.toLowerCase().replace(/[^a-z]/g, ''));
    if (distinctLetters.size < 2) {
      return 'Please enter a valid breed name';
    }

    return '';
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
      setError('You can only upload a maximum of 5 images.');
      return;
    }

    // Check if adding these files would exceed the total combined size limit
    const currentTotalSize = images.reduce((sum, img) => sum + img.size, 0);
    const newFilesTotalSize = selectedFiles.reduce((sum, file) => sum + file.size, 0);
    if (currentTotalSize + newFilesTotalSize > MAX_TOTAL_SIZE_BYTES) {
      const currentMB = (currentTotalSize / (1024 * 1024)).toFixed(1);
      const wouldBeMB = ((currentTotalSize + newFilesTotalSize) / (1024 * 1024)).toFixed(1);
      setError(
        `Adding these photos would bring your total to ${wouldBeMB}MB, which exceeds the ${MAX_TOTAL_SIZE_MB}MB combined limit. You currently have ${currentMB}MB used — try selecting fewer or smaller images.`
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
        newErrors.push(`${file.name}: This photo has already been added.`);
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
      setImagesError(''); // Clear "at least one image required" error once images are added
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

    // Run every field's validation up front (instead of returning on the
    // first failure) so all mandatory-field errors surface in one go.
    let hasValidationError = false;

    // Pet Name
    if (!name || name.trim() === '') {
      setNameError('Pet name is required');
      hasValidationError = true;
    } else {
      setNameError('');
    }

    // Age
    if (!age || parseFloat(age) <= 0 || isNaN(parseFloat(age))) {
      setAgeError('Pet age must be greater than 0');
      hasValidationError = true;
    } else {
      setAgeError('');
    }

    // Breed
    const breedValidationMessage = validateBreedValue(breed);
    if (breedValidationMessage) {
      setBreedError(breedValidationMessage);
      hasValidationError = true;
    } else {
      setBreedError('');
    }

    // Pet Type
    if (!petType || petType.trim() === '') {
      setPetTypeError('Please select a pet type');
      hasValidationError = true;
    } else {
      setPetTypeError('');
    }

    // Vaccinated
    if (!vaccinated || vaccinated.trim() === '') {
      setVaccinatedError('Please select vaccination status');
      hasValidationError = true;
    } else {
      setVaccinatedError('');
    }

    // Neutered/Spayed
    if (!neuteredSpayed || neuteredSpayed.trim() === '') {
      setNeuteredSpayedError('Please select neutering status');
      hasValidationError = true;
    } else {
      setNeuteredSpayedError('');
    }

    // Description
    if (!description || description.trim() === '') {
      setDescriptionError('Description is required');
      hasValidationError = true;
    } else {
      setDescriptionError('');
    }

    // Location
    if (!location || location.trim() === '') {
      setLocationError('Please select a valid city from the list');
      hasValidationError = true;
    } else {
      setLocationError('');
    }

    // Images: require at least one, and re-check total combined size
    if (images.length === 0) {
      setImagesError('Please select at least one image');
      hasValidationError = true;
    } else {
      const totalImageSize = images.reduce((sum, img) => sum + img.size, 0);
      if (totalImageSize > MAX_TOTAL_SIZE_BYTES) {
        const totalMB = (totalImageSize / (1024 * 1024)).toFixed(1);
        setImagesError(`Total image size (${totalMB}MB) exceeds the ${MAX_TOTAL_SIZE_MB}MB limit. Please remove some images.`);
        hasValidationError = true;
      } else {
        setImagesError('');
      }
    }

    // Existing per-image validation errors (format/size/duplicate issues)
    if (imageErrors.length > 0) {
      hasValidationError = true;
    }

    if (hasValidationError) {
      setError('Some required information is missing or invalid. Please review the fields marked below and try again.');
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

      const createdPost = await response.json();

      // Auto-redirect to My Adoptions page after successful submission
      navigate('/my-adoptions', {
        state: {
          message: 'Adoption post created successfully!',
          showSuccess: true,
          createdPost,
        }
      });
    } catch (error) {
      setError(error.message || 'We were unable to submit your post. Please check your connection and try again.');
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
        <p className="mb-2 font-medium">Please sign in to create an adoption post.</p>
        <p className="text-sm">You'll need an account so pet owners can reach you about your listing.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg">

      {error && (
        <div
          role="alert"
          className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
        >
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Pet Name
            </label>
            <input
              type="text"
              placeholder="e.g., Buddy"
              value={name}
              onChange={(e) => {
                const val = e.target.value;
                setName(val);
                setNameError(val.trim() === '' ? nameError : '');
              }}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent ${
                nameError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {nameError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <span>⚠️</span> {nameError}
              </p>
            )}
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
                  setAgeError('Pet age must be greater than 0');
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
              onChange={(e) => {
                const val = e.target.value;
                setBreed(val);
                setBreedError(validateBreedValue(val));
              }}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent ${
                breedError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            />
            {breedError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <span>⚠️</span> {breedError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Pet Type
            </label>
            <select
              value={petType}
              onChange={(e) => {
                const val = e.target.value;
                setPetType(val);
                if (val.trim() !== '') setPetTypeError('');
              }}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent bg-white ${
                petTypeError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select pet type</option>
              <option value="Dog">Dog</option>
              <option value="Cat">Cat</option>
              <option value="Bird">Bird</option>
              <option value="Rabbit">Rabbit</option>
              <option value="Hamster">Hamster</option>
              <option value="Other">Other</option>
            </select>
            {petTypeError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <span>⚠️</span> {petTypeError}
              </p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Vaccinated
            </label>
            <select
              value={vaccinated}
              onChange={(e) => {
                const val = e.target.value;
                setVaccinated(val);
                if (val.trim() !== '') setVaccinatedError('');
              }}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent bg-white ${
                vaccinatedError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select vaccination status</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {vaccinatedError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <span>⚠️</span> {vaccinatedError}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#4E3B31]">
              Neutered/Spayed
            </label>
            <select
              value={neuteredSpayed}
              onChange={(e) => {
                const val = e.target.value;
                setNeuteredSpayed(val);
                if (val.trim() !== '') setNeuteredSpayedError('');
              }}
              className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent bg-white ${
                neuteredSpayedError ? 'border-red-400 bg-red-50' : 'border-gray-300'
              }`}
            >
              <option value="">Select neutering status</option>
              <option value="Yes">Yes</option>
              <option value="No">No</option>
            </select>
            {neuteredSpayedError && (
              <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                <span>⚠️</span> {neuteredSpayedError}
              </p>
            )}
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
                  setLocationError('Please select a valid city from the list');
                } else {
                  setLocationError('Please select a city from the list');
                }
              }}
              onFocus={() => setShowCitySuggestions(true)}
              onBlur={() => setTimeout(() => setShowCitySuggestions(false), 150)}
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
            onChange={(e) => {
              const val = e.target.value;
              setDescription(val);
              if (val.trim() !== '') setDescriptionError('');
            }}
            rows="4"
            className={`w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#8B5A2B] focus:border-transparent resize-y ${
              descriptionError ? 'border-red-400 bg-red-50' : 'border-gray-300'
            }`}
          />
          {descriptionError && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <span>⚠️</span> {descriptionError}
            </p>
          )}
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
          <div className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-6 bg-[#f7f4f0] relative hover:bg-[#f3ede7] transition-colors min-h-[200px] ${
            imagesError ? 'border-red-400' : 'border-[#bca18a]'
          }`}>
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

          {/* "At least one image required" / total size error */}
          {imagesError && (
            <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
              <span>⚠️</span> {imagesError}
            </p>
          )}

          {/* Image Validation Errors */}
          {imageErrors.length > 0 && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-xs font-semibold text-red-700 mb-1">Please fix the following:</p>
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
            disabled={isSubmitting}
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
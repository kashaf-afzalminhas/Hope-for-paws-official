import React, { useState } from 'react';
import { API_BASE_URL } from '../config';

function AdoptionUploadForm({ onAddAnimal, onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [age, setAge] = useState('');
  const [color, setColor] = useState('');
  const [image, setImage] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', description);
    formData.append('age', age);
    formData.append('color', color);
    if (image) {
      formData.append('animalImage', image); // Make sure the key matches what multer expects
    }
  
    const response = await fetch(`${API_BASE_URL}/animal`, {
      method: 'POST',
      body: formData,
    });
  
    if (response.ok) {
      const newAnimal = await response.json();
      onAddAnimal(newAnimal);
      onClose(); // Close the form after submission
    } else {
      console.error('Failed to submit form');
      const errorData = await response.json();
      console.error('Error details:', errorData);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file); // Save the file object
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F8F4ED] px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-lg bg-white p-6 rounded-lg shadow-lg">
        <h3 className="font-bold mb-6 text-lg text-[#6b493d]">
          Please complete this form to add your pet for adoption.
        </h3>

        <div className="mb-4">
          <label className="block text-[#6b493d] text-xs font-bold mb-2" htmlFor="animal-name">
            Name
          </label>
          <input
            type="text"
            id="animal-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded"
          />
        </div>

        

        <div className="mb-4">
          <label className="block text-[#6b493d] text-xs font-bold mb-2" htmlFor="animal-age">
            Age
          </label>
          <input
            type="text"
            id="animal-age"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[#6b493d] text-xs font-bold mb-2" htmlFor="animal-color">
            Color (Optional)
          </label>
          <input
            type="text"
            id="animal-color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[#6b493d] text-xs font-bold mb-2" htmlFor="animal-description">
            Description
          </label>
          <textarea
            id="animal-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full px-4 py-2 border border-gray-300 rounded"
          />
        </div>

        <div className="mb-4">
          <label className="block text-[#6b493d] text-xs font-bold mb-2" htmlFor="animal-image">
            Upload Image
          </label>
          <input
            type="file"
            id="animal-image"
            onChange={handleImageUpload}
            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring focus:ring-[#6b493d] focus:border-[#6b493d]"
            accept="image/*"
            name="animalImage"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-[#6b493d] text-white font-bold py-2 px-4 rounded hover:bg-[#573a2f] transition-colors"
        >
          Submit
        </button>
      </form>
    </div>
  );
}

export default AdoptionUploadForm;
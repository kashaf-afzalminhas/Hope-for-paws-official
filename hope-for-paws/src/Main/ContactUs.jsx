import React, { useState } from 'react';
import ContactCat from '../assets/CAT-CU.png'; // Update with the correct path to the cat image
import { API_BASE_URL } from '../config';

const ContactUs = () => {
  // Form states
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({ email: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Handle input change
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Validate email format
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Reset errors
    setErrors({});

    // Email validation
    if (!validateEmail(formData.email)) {
      setErrors((prev) => ({
        ...prev,
        email: 'Please enter a valid email address.',
      }));
      return;
    }

    try {
      // Make POST request to your backend (example endpoint)
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true); // Set submitted state
        alert('Form submitted successfully');
      } else {
        alert('Failed to submit form');
      }
    } catch (error) {
      console.error('Error submitting the form:', error);
    }
  };

  return (
    <section className="py-8 sm:py-10 bg-[#000000] text-white relative">
  <h2 className="text-2xl sm:text-3xl font-bold text-center mb-6 sm:mb-10">Contact Us</h2>

  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-10 items-center px-6 sm:px-8">
    <div className="space-y-4 text-center md:text-left mb-14 md:mb-28">
      <p className="text-base sm:text-lg font-semibold">📍 Lahore, Pakistan</p>
      <p className="text-base sm:text-lg font-semibold">📞 000-241-333</p>
    </div>

    {/* Contact Form */}
    <div className="bg-white text-black p-4 sm:p-6 rounded-lg shadow-lg w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 sm:p-3 rounded bg-[#f5f3ed] text-[#6b493d] outline-none"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 sm:p-3 rounded bg-[#f5f3ed] text-[#6b493d] outline-none"
          required
        />
        {errors.email && <p className="text-red-500">{errors.email}</p>}
        <textarea
          name="message"
          placeholder="Message"
          value={formData.message}
          onChange={handleChange}
          className="w-full p-2 sm:p-3 rounded bg-[#f5f3ed] text-[#6b493d] outline-none"
          rows="4"
          required
        />
        <button
          type="submit"
          className="w-full bg-black text-white p-2 sm:p-3 rounded-md hover:bg-[#6b493d] transition-colors duration-300 ease-in-out text-center"
        >
          Submit
        </button>
      </form>
      {isSubmitted && <p className="text-green-500 mt-4 text-center">Thank you! Your message has been sent.</p>}
    </div>
  </div>

  {/* <div className="absolute -bottom-20 sm:-bottom-28 left-0 max-w-sm sm:max-w-xl">
    <img src={ContactCat} alt="Cat" className="w-full h-auto object-cover ml-1" />
  </div> */}
  
  {/* Image for full-screen & small screens */}
  <div className="flex justify-center sm:absolute sm:-bottom-28 sm:left-0 sm:max-w-xl">
    <img src={ContactCat} alt="Cat" className="w-full h-auto object-cover ml-1" />
  </div>

</section>
  );
};

export default ContactUs;

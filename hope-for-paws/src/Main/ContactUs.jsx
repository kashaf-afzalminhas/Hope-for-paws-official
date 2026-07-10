import React, { useState } from 'react';
import { FaPaw, FaHeart, FaHandsHelping } from 'react-icons/fa';
import ContactCat from '../assets/CAT-CU.png';
import { API_BASE_URL } from '../config';

const ContactUs = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [errors, setErrors] = useState({ email: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitError, setSubmitError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitError('');
    setIsLoading(true);

    if (!validateEmail(formData.email)) {
      setErrors({ email: 'Please enter a valid email address.' });
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setIsSubmitted(true);
        setFormData({ name: '', email: '', message: '' });
        setTimeout(() => setIsSubmitted(false), 5000);
      } else {
        const errorData = await response.json();
        setSubmitError(errorData.error || 'Failed to send message. Please try again.');
      }
    } catch (error) {
      console.error('Submission error:', error);
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="py-12 sm:py-16 bg-gradient-to-b from-[#2c1810] to-[#000000] text-white relative">
      <div className="max-w-6xl mx-auto px-4 flex flex-col items-center lg:block">
        <div className="text-center mb-10">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            <span className="text-[#6b493d]">Connect</span> With Compassion
          </h2>
          <p className="text-lg sm:text-xl text-[#ffd8b8]">
            Where Loving Hearts Meet Furry Souls
          </p>
          <div className="flex justify-center gap-4 mt-6 text-[#6b493d]">
            <FaPaw className="w-8 h-8 animate-bounce" />
            <FaHeart className="w-8 h-8 animate-pulse" />
            <FaHandsHelping className="w-8 h-8 animate-bounce" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center w-full">
          {/* Left Section */}
          <div className="space-y-6 relative z-10">
            <div className="bg-[#ffffff08] p-6 rounded-2xl backdrop-blur-sm">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <FaHandsHelping className="text-[#6b493d]" />
                Collaboration Hub
              </h3>
              <p className="text-[#ffd8b8] mb-4">
                Whether you're an adopter, veterinarian, or NGO representative, 
                let's create pawsitive change together!
              </p>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <FaPaw className="text-[#6b493d]" />
                  <span>📍 Based in Lahore, Serving Nationwide</span>
                </div>
                <div className="flex items-center gap-3">
                  <FaHeart className="text-[#6b493d]" />
                  <span>24/7 Rescue Support Network</span>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="bg-[#fff7f0] text-[#2c1810] p-8 rounded-2xl shadow-2xl relative z-10">
            <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-[#6b493d] p-4 rounded-full shadow-lg">
                <FaPaw className="w-8 h-8 text-white" />
              </div>
            </div>
            
            {/* Success Message */}
            {isSubmitted && (
              <div className="mb-4 p-4 bg-green-100 border border-green-400 text-green-700 rounded-lg flex items-center gap-2">
                <FaHeart className="text-green-600" />
                <span className="font-semibold">Message sent successfully!</span>
              </div>
            )}

            {/* Error Message */}
            {submitError && (
              <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                <span className="font-semibold">Error: </span>{submitError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Your Name"
                value={formData.name}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-white border border-[#ffd8b8] focus:ring-2 focus:ring-[#6b493d] outline-none"
                required
                disabled={isLoading}
              />
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-white border border-[#ffd8b8] focus:ring-2 focus:ring-[#6b493d] outline-none"
                required
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-600">{errors.email}</p>}
              <textarea
                name="message"
                placeholder="How can we collaborate to help animals?"
                value={formData.message}
                onChange={handleChange}
                className="w-full p-3 rounded-lg bg-white border border-[#ffd8b8] focus:ring-2 focus:ring-[#6b493d] outline-none"
                rows="5"
                required
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-[#6b493d] text-white py-3 rounded-lg font-semibold hover:bg-[#a07855] transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <FaPaw /> Send Message
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Cat Image Positioning */}
        <div className="hidden lg:flex justify-center lg:absolute lg:-bottom-28 lg:left-6 lg:max-w-xl">
          <img 
            src={ContactCat} 
            alt="Cat" 
            className="w-full h-auto object-cover lg:ml-24 lg:mb-0" 
          />
        </div>
      </div>

      {/* Decorative Background Elements */}
      <div className="hidden lg:block absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-20 right-20 w-24 h-24 bg-[#6b493d33] rounded-full blur-xl"></div>
        <div className="absolute bottom-40 left-10 w-32 h-32 bg-[#a0785533] rounded-full blur-xl"></div>
      </div>
    </section>
  );
};

export default ContactUs;
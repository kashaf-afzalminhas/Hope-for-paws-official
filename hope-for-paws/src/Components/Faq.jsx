import React, { useState, useEffect } from "react";

const FAQPage = () => {
  const [faqs, setFaqs] = useState([]); // Initialize faqs as an empty array
  const [error, setError] = useState(null); // Error state for handling fetch issues

  useEffect(() => {
    // Fetch FAQs from the backend API
    const fetchFAQs = async () => {
      try {
        const response = await fetch("http://localhost:3000/faqRoutes");
        if (!response.ok) {
          throw new Error("Failed to fetch FAQs");
        }
        const data = await response.json();
        console.log("Fetched FAQs:", data); // Log the fetched data
        setFaqs(data); // Set the fetched data to faqs state
      } catch (err) {
        console.error("Error fetching FAQs:", err); // Log the error
        setError(err.message); // Set the error message
      }
    };

    fetchFAQs();
  }, []);

  const toggleFAQ = (index) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  const [activeIndex, setActiveIndex] = useState(null);

  if (error) {
    return <p>Error: {error}</p>; // Display error if fetch fails
  }

  return (
    <div>
      <div className="faq-page" style={{ backgroundColor: "#F8F4ED", padding: "40px" }}>
        <h1 className="faq-title" style={{ color: "#6b493d", fontSize: "48px", fontWeight: "bold", textAlign: "center", marginBottom: "30px" }}>
          Frequently Asked Questions
        </h1>
        <div className="faq-container" style={{ maxWidth: "800px", margin: "0 auto" }}>
          {faqs.map((faq, index) => (
            <div
              key={faq._id || index}
              className="faq-item"
              style={{
                marginBottom: "20px",
                padding: "20px",
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)",
              }}
            >
              <h3
                onClick={() => toggleFAQ(index)}
                style={{
                  cursor: "pointer",
                  color: activeIndex === index ? "#6b493d" : "#000",
                  fontSize: "24px",
                  marginBottom: "10px",
                  fontWeight: "bold",
                }}
              >
                {faq.question}
              </h3>
              {activeIndex === index && (
                <p style={{ color: "#a07855", fontSize: "18px", paddingLeft: "10px", transition: "max-height 0.4s ease-in-out" }}>
                  {faq.answer}
                </p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FAQPage;
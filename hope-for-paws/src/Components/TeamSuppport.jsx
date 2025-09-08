import React, { useState } from 'react';
import DocImage from '../assets/Doc.jpeg';
import VetConnect from '../assets/vc.jpg'
import Huraira from '../assets/Huraira.jpeg';
import ibraheem from '../assets/ibraheem.jpeg';
import rahima from '../assets/Rahima.jpeg';
import avator from '../assets/avatar.png';
import { useNavigate } from 'react-router-dom';
import { getCurrentUserId } from '../lib/utils';
import { getConversationBetweenUsers } from '../Main/api';

export const PersonCard = ({ name, role, image, summary, details, contact, className, userId }) => {
  const [activeAccordion, setActiveAccordion] = useState(null);
  const navigate = useNavigate();
  const user =
    JSON.parse(localStorage.getItem('user')) ||
    JSON.parse(sessionStorage.getItem('user'));
  const currentUserId = getCurrentUserId(user);

  const handleStartConversation = async (targetUserId) => {
    if (!user) {
      navigate('/signin');
      return;
    }
    try {
      await getConversationBetweenUsers(currentUserId, targetUserId);
    } catch (_) {
      // ignore and navigate anyway
    } finally {
      navigate(`/chat/${targetUserId}`);
    }
  };

  const toggleAccordion = (value) => {
    setActiveAccordion(activeAccordion === value ? null : value);
  };

  return (
    <div className={`rounded-xl shadow-sm hover:shadow-md transition-all duration-300 ${className}`}>
      <div className="p-4">
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="relative">
            <img 
              src={image} 
              alt={name} 
              className="w-20 h-20 rounded-full object-cover shadow-sm ring-2 ring-[#6b493d]/10"
            />
            {role.includes("Ambassador") && (
              <div className="absolute -bottom-1 -right-1 bg-[#6b493d] text-white p-1 rounded-full">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            )}
          </div>

          <div className="text-center sm:text-left">
            <h3 className="text-xl font-semibold text-[#6b493d]">{name}</h3>
            <p className="text-[#a07855]">{role}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        {summary && (
          <p className="text-sm text-gray-700 mb-3">{summary}</p>
        )}
        
        {details && (
          <div className="w-full">
            {details.education?.length > 0 && (
              <div className="border-b border-[#c9a280]">
                <button
                  onClick={() => toggleAccordion('education')}
                  className="w-full py-2 flex items-center text-sm font-medium text-[#6b493d]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                  </svg>
                  Education
                  <svg className={`w-4 h-4 ml-auto transition-transform ${activeAccordion === 'education' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeAccordion === 'education' && (
                  <div className="pb-2">
                    <ul className="pl-6 space-y-1 list-disc text-xs text-gray-700">
                      {details.education.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {details.experience?.length > 0 && (
              <div className="border-b border-[#c9a280]">
                <button
                  onClick={() => toggleAccordion('experience')}
                  className="w-full py-2 flex items-center text-sm font-medium text-[#6b493d]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Experience
                  <svg className={`w-4 h-4 ml-auto transition-transform ${activeAccordion === 'experience' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeAccordion === 'experience' && (
                  <div className="pb-2">
                    <ul className="pl-6 space-y-1 list-disc text-xs text-gray-700">
                      {details.experience.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
            
            {details.achievements?.length > 0 && (
              <div className="border-b border-[#c9a280]">
                <button
                  onClick={() => toggleAccordion('achievements')}
                  className="w-full py-2 flex items-center text-sm font-medium text-[#6b493d]"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Achievements
                  <svg className={`w-4 h-4 ml-auto transition-transform ${activeAccordion === 'achievements' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {activeAccordion === 'achievements' && (
                  <div className="pb-2">
                    <ul className="pl-6 space-y-1 list-disc text-xs text-gray-700">
                      {details.achievements.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
      
      {userId && (
        <div className="px-4 pb-3 flex items-center gap-2">
          <button
            onClick={() => navigate(`/profile/public/${userId}`)}
            className="px-3 py-1.5 bg-white text-[#6b493d] rounded-full hover:bg-[#f8f4ed] transition-all border border-[#6b493d] text-xs font-medium"
          >
            View Profile
          </button>
          {currentUserId && userId !== currentUserId && (
            <button
              onClick={() => handleStartConversation(userId)}
              className="px-3 py-1.5 bg-[#6b493d] text-white rounded-full hover:bg-[#5a3c32] transition-all text-xs font-medium"
            >
              Chat
            </button>
          )}
        </div>
      )}
      
      {contact && (
        <div className="px-4 py-3 border-t border-[#c9a280] text-xs text-gray-600 space-y-1.5">
          {contact.phone && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#6b493d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <span>{contact.phone}</span>
            </div>
          )}
          
          {contact.email && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#6b493d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <a href={`mailto:${contact.email}`} className="text-[#6b493d] hover:text-[#a07855] hover:underline">
                {contact.email}
              </a>
            </div>
          )}
          
          {contact.website && (
            <div className="flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-[#6b493d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              <a href={contact.website} target="_blank" rel="noopener noreferrer" className="text-[#6b493d] hover:text-[#a07855] hover:underline">
                Visit Website
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const AmbassadorCollaboratorsSection = () => {
  const navigate = useNavigate();
  
  const teamMembers = [
    {
      name: "Fahad Ansari",
      role: "Ambassador & Executive Director",
      image: DocImage,
      summary: "Experienced veterinarian with expertise in small animal practice and community outreach.",
      details: {
        education: ["Doctor of Veterinary Medicine (Final Year)"],
        experience: [
          "Executive Director & Organizer at Vet Connect",
          "Co-Author of Veterinary Capsule (For Public Service Commission Exam)",
          "Former HR International Veterinary Students Association",
          "Veterinary camp organizer"
        ]
      },
      contact: {
        phone: "+92 308 8676335",
        email: "vetconnect3@gmail.com"
      },
      userId: "680913742171d4429a686d33"
    },
       {
      name: "Dr.Rahima Khan",
      role: "DVM",
      image: rahima, // Empty for avatar
      summary: "Online veterinary consultations",
      details: {
        education: [
          "Doctor of Veterinary Medicine (DVM)"
        ],
        experience: [
          "2 years pet practice experience"
        ]
      },
      contact: {
        phone: "+923207557341"
      },
      userId: "6895d332d294378b1f10a059"
    },
        {
      name: "Dr.Ibraheem Saeed",
      role: "Doctor of Veterinary Medicine (DVM)",
      image: ibraheem, // Add image path or leave empty for avatar
      summary: "Experienced veterinarian with 1 year of professional practice",
      details: {
        education: ["Doctor of Veterinary Medicine (DVM)"],
        experience: ["1 year of professional veterinary practice"]
      },
      contact: {
        phone: "03358745668"
      },
      userId: "6895e2bc313adc023d1be0ad"
    },
    {
      name: "Dr. Asfa",
      role: "DVM, MPhil",
      image: avator, // Empty for avatar
      summary: "Online veterinary consultations for emergency/rescue cases",
      details: {
        education: [
          "Doctor of Veterinary Medicine (DVM)",
          "Master of Philosophy (MPhil)"
        ],
        experience: [
          "5 years pet practice experience",
          "Former HR - International Veterinary Students Association",
          "Emergency case specialist"
        ]
      },
      contact: {
        phone: "03072736096"
      }
    },

    {
      name: "Vet Connect",
      role: "Government University Affiliated",
      image: VetConnect,
      summary: "Leading veterinary healthcare and education platform in Pakistan.",
      details: {
        experience: [
          "Led by Executive Director Fahad Ansari",
          "Physical presence in Dera Ismail Khan",
          "Remote operations in 6-8 cities across Pakistan"
        ],
        achievements: [
          "Veterinary healthcare programs",
          "Veterinary camps",
          "Veterinary education platforms",
          "Free online classes and webinars",
          "Mentorship programs",
          "Digital learning platforms",
          "Published 'Veterinary Capsule' (2024-25 edition)",
          "First platform to unite veterinarians digitally in Pakistan"
        ]
      },
      contact: {
        email: "vetconnect3@gmail.com"
      }
    },
    {
      name: "Huraira Animal Shelter",
      role: "ISO-Certified Animal Welfare Organization",
      image: Huraira,
      summary: "Pakistan's first and largest institution dedicated to animal welfare, providing comprehensive care and rehabilitation services.",
      details: {
        experience: [
          "Founded in 2008, operating nationwide",
          "ISO-certified and internationally accredited",
          "Affiliated with World Animal Friends, UK",
          "24/7 operational shelters and hospitals",
          "Over 300 team members including veterinarians and support staff"
        ],
        achievements: [
          "Pakistan's largest animal welfare team",
          "State-of-the-art medical facilities including digital X-ray, ultrasound, and ICU",
          "Nationwide TNVR (Trap-Neuter-Vaccinate-Return) program",
          "Free medical camps in rural areas",
          "Weekly pet market visits for free treatment",
          "Regular awareness seminars at schools and universities",
          "24/7 rescue and emergency response teams"
        ],
        facilities: [
          "Advanced medical technology",
          "Dental care and physiotherapy",
          "Surgical and orthopedic procedures",
          "Nutritionally balanced food",
          "Dedicated play areas and toys",
          "Clean and comfortable environments"
        ]
      },
      contact: {
        phone: "0312-2281433",
        email: "Managerkhi@hurairaanimallovers.com",
        location: "Karachi, Sindh"
      }
    },
   
  ];

  return (
    <section className="py-16 px-4 bg-[#f5f3ed]">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-center text-[#6b493d] mb-2">
          Our Ambassador & Collaborators
        </h2>
        <p className="text-center text-[#a07855] mb-10 max-w-2xl mx-auto">
          Working together to improve animal healthcare and welfare across communities
        </p>
        
        {/* Original 3 cards display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {teamMembers.slice(0, 3).map((member, index) => (
            <PersonCard
              key={index}
              {...member}
              className="md:col-span-1 bg-white border border-[#c9a280] hover:border-[#6b493d] transition-colors duration-300"
            />
          ))}
        </div>

        {/* See More button */}
        {teamMembers.length > 3 && (
          <div className="text-center mt-8">
            <button
              onClick={() => navigate('/team', { state: { allMembers: teamMembers } })}
              className="bg-[#6b493d] text-white px-6 py-2 rounded-full hover:bg-[#a07855] transition-colors duration-300"
            >
              See More Team Members
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default AmbassadorCollaboratorsSection;
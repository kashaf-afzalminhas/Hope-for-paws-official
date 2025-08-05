// import React, { useState } from 'react';
// import SearchBar from '../Main/SearchBar';
// import clinicsData from '../assets/clinics.json'; // Import the clinics JSON file
// import dog from '../assets/Images/download.jpg';

// function Clinics() {
//   const [clinics] = useState(clinicsData.clinics); // Initial list of clinics
//   const [filteredClinics, setFilteredClinics] = useState([]);

  
//   const [query, setQuery] = useState("");
//   const [selectedClinic, setSelectedClinic] = useState(null);

//   // Handle search input
//   const handleSearch = (searchQuery) => {
//     setQuery(searchQuery);
//     if (!searchQuery) {
//       setFilteredClinics([]); // Reset to show all clinics when query is empty
//     } else {
//       const filtered = clinics.filter((clinic) =>
//         clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
//         clinic.location.toLowerCase().includes(searchQuery.toLowerCase())
//       );
//       setFilteredClinics(filtered);
//     }
//   };

//   // Clinics to display based on search query
//   const clinicsToDisplay = query ? filteredClinics : clinics;

//   const handleViewMore = (index) => {
//     setSelectedClinic(selectedClinic === index ? null : index);
//   };

//   return (
//     <div className="p-8 bg-white">
      
//       {/* Search Bar */}
//       <SearchBar
//         onSearch={handleSearch}
//         placeholder="Search clinics..."
//       />

//       {/* Display heading when there are search results */}
//       {query && filteredClinics.length > 0 && (
//         <h2 className="flex flex-col items-center text-2xl font-semibold mt-6 mb-4 text-[#6b493d]">
//           Search Results for "{query}"
//         </h2>
//       )}

//       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//         {clinicsToDisplay.map((clinic, index) => (
//           <div
//             key={index}
//             className={`bg-white text-amber-950 shadow-md rounded-lg overflow-hidden p-5 relative
//                         transition-all duration-300 ease-in-out
//                         ${selectedClinic === index ? 'md:row-span-2' : ''}`}
//             style={{
//               height: selectedClinic === index ? 'auto' : 'auto',
//               gridRow: selectedClinic === index ? 'span 2' : 'span 1'
//             }}
//           >
//             {/* Clinic Image */}
//             <div className="flex justify-center mb-4">
//               <img src={dog}
//                alt="Clinic" 
//                className="w-48 h-32 object-cover rounded-lg"
//                />
//             </div>

//             <div className="text-center space-y-3">
//               {/* Clinic Name */}
//               <h2 className="text-amber-950 text-xl font-bold">{clinic.name}</h2>
//               {/* Clinic Location */}
//               <p className="text-amber-950 text-sm">
//                 <strong>Location:</strong> {clinic.location}
//               </p>
//               {/* View More Button */}
//               <button
//                 onClick={() => handleViewMore(index)}
//                 className="mt-3 bg-amber-900 text-white py-2 px-4 rounded-full hover:bg-amber-950 transition duration-200"
//               >
//                 {selectedClinic === index ? "View Less" : "View More"}
//               </button>
//             </div>

//             {/* Display extra information if "View More" is clicked */}
//             {selectedClinic === index && (
//               <div className="mt-6 p-6 bg-brown-100 rounded-lg shadow-md text-amber-950">
//                 {/* Services Offered */}
//                 <h3 className="text-xl font-semibold text-brown-800 mb-4">Services Offered</h3>
//                 <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 list-disc list-inside">
//                   {clinic.services_offered.map((service, i) => (
//                     <li key={i} className="text-sm bg-brown-200 p-2 rounded shadow hover:bg-brown-300 transition">
//                       {service}
//                     </li>
//                   ))}
//                 </ul>

//                 {/* Veterinarians */}
//                 <h3 className="text-xl font-semibold text-brown-800 mt-6 mb-4">Veterinarians</h3>
//                 <ul className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//                   {clinic.veterinarians.map((vet, i) => (
//                     <li key={i} className="p-3 bg-brown-200 rounded-lg shadow hover:bg-brown-300 transition">
//                       <strong className="block text-brown-800">{vet.name}</strong>
//                       <p className="text-sm italic text-brown-600">{vet.specialization}</p>
//                     </li>
//                   ))}
//                 </ul>

//                 {/* Contact Information */}
//                 <h3 className="text-xl font-semibold text-brown-800 mt-6 mb-2">Contact</h3>
//                 <p className="text-sm">
//                   <strong>Phone:</strong> {clinic.contact.phone}
//                 </p>
//                 {clinic.contact.email && (
//                   <p className="text-sm">
//                     <strong>Email:</strong> {clinic.contact.email}
//                   </p>
//                 )}
//               </div>
//             )}
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// export default Clinics;

import React, { useState } from 'react';
import SearchBar from './SearchBar';
import ZVCImage from '../assets/ZVC.jpeg';
import RLHimage from '../assets/RLH.jpeg';
import FPCimage from '../assets/FPC.jpeg';
import P360image from '../assets/P360.jpeg';
import MPHimage from '../assets/MPH.jpeg';
import PCNCimage from '../assets/PCNC.jpeg';
import JVCimage from '../assets/JVC.jpeg';
import DPHimage from '../assets/DPH.jpeg';
import HPCimage from '../assets/HPC.jpeg';
import MPCimage from '../assets/MPC.jpeg';
import KPVCMimage from '../assets/KPVC.jpeg';


const clinicsData = {
  "clinics": [
    {
      "name": "Zia Vet Clinic",
      "location": "DHA Phase - I & 24-F, Main Boulevard Khayaban-E- Firdosi, Johar town,Lahore.",
      "image": ZVCImage,
      "veterinarians": [
        {
          "name": "Dr. Ziaullah Mughal",
          "specialization": "Veterinary Surgeon DVM, M.Phil, PhD, Cert Rad (RVC) Cert Av Orth (EU), RVMP"
        },
        {
          "name": "Dr. Ahtisham Qamar",
          "specialization": "Veterinary Surgeon DVM, M.Phil, Cert Int Med (RVC) CPD Surgery (MY), RVMP"
        },
        {
          "name": "Dr. Hira Zia",
          "specialization": "Veterinary Surgeon DVM, M.Phil, Cert Orthodontics (EU), RVMP"
        },
        {
          "name": "Dr. Ali Qaisar",
          "specialization": "Veterinary Surgeon DVM, M.Phil, CPD (RVC), RVMP"
        },
        {
          "name": "Dr. Aleem Khan",
          "specialization": "Veterinary Physician DVM, M.Phil, RVMP"
        },
        {
          "name": "Dr. Sohaib Safdar",
          "specialization": "Veterinary Physician DVM, M.Phil, RVMP"
        },
        {
          "name": "Dr. Waseem Ijaz",
          "specialization": "Veterinary Physician DVM, M.Phil, RVMP"
        },
        {
          "name": "Dr. Shahzaib Shafai",
          "specialization": "Veterinary Physician DVM, NAVLE (CVMA), RVMP"
        },
        {
          "name": "Dr. Amara Mushtaq",
          "specialization": "Veterinary Physician DVM, M.Phil, RVMP"
        },
        {
          "name": "Dr. Mujtaba Zafar",
          "specialization": "Veterinary Physician DVM, RVMP"
        },
        {
          "name": "Dr. Quart Ul Ain",
          "specialization": "Veterinary Physician DVM, NAVLE (CVMA), RVMP"
        },
        {
          "name": "Dr. Zaryab Ali Khan",
          "specialization": "Veterinary Physician DVM, M. Phil, RVMP"
        }
      ],
      "services_offered": [
        "Wellness Examination",
        "Dental Care",
        "Exotic Animals Care",
        "Vaccination Services",
        "Deworming Services",
        "Surgical Procedures",
        "Neutering & Spaying",
        "Laboratory Testing",
        "Digital X-Rays",
        "Ultrasound Diagnostics",
        "ECG & ECO",
        "MRI & CT Scans",
        "Diet Management",
        "Pet Food",
        "Grooming Services",
        "Micro Chipping",
        "International Travel Documentation"      
      ],
      "contact": {
        "phone": "DHA Lahore: +924235742427 JT Lahore:+924235220750",
        "email": "ziavets@gmail.com"
      }
    },
    {
      "name": "Zia Vet Clinic",
      "location": " Zulfiqar Commercial Av. Phase - VIII, DHA, Karachi.",
      "image": ZVCImage,
      "veterinarians": [
        {
          "name": "Dr. Ziaullah Mughal",
          "specialization": "Veterinary Surgeon DVM, M.Phil, PhD, Cert Rad (RVC) Cert Av Orth (EU), RVMP"
        },
        {
          "name": "Dr. Ahtisham Qamar",
          "specialization": "Veterinary Surgeon DVM, M.Phil, Cert Int Med (RVC) CPD Surgery (MY), RVMP"
        },
        {
          "name": "Dr. Hira Zia",
          "specialization": "Veterinary Surgeon DVM, M.Phil, Cert Orthodontics (EU), RVMP"
        },
        {
          "name": "Dr. Ali Qaisar",
          "specialization": "Veterinary Surgeon DVM, M.Phil, CPD (RVC), RVMP"
        },
        {
          "name": "Dr. Aleem Khan",
          "specialization": "Veterinary Physician DVM, M.Phil, RVMP"
        },
        {
          "name": "Dr. Sohaib Safdar",
          "specialization": "Veterinary Physician DVM, M.Phil, RVMP"
        },
        {
          "name": "Dr. Waseem Ijaz",
          "specialization": "Veterinary Physician DVM, M.Phil, RVMP"
        },
        {
          "name": "Dr. Shahzaib Shafai",
          "specialization": "Veterinary Physician DVM, NAVLE (CVMA), RVMP"
        },
        {
          "name": "Dr. Amara Mushtaq",
          "specialization": "Veterinary Physician DVM, M.Phil, RVMP"
        },
        {
          "name": "Dr. Mujtaba Zafar",
          "specialization": "Veterinary Physician DVM, RVMP"
        },
        {
          "name": "Dr. Quart Ul Ain",
          "specialization": "Veterinary Physician DVM, NAVLE (CVMA), RVMP"
        },
        {
          "name": "Dr. Zaryab Ali Khan",
          "specialization": "Veterinary Physician DVM, M. Phil, RVMP"
        }
      ],
      "services_offered": [
        "Wellness Examination",
        "Dental Care",
        "Exotic Animals Care",
        "Vaccination Services",
        "Deworming Services",
        "Surgical Procedures",
        "Neutering & Spaying",
        "Laboratory Testing",
        "Digital X-Rays",
        "Ultrasound Diagnostics",
        "ECG & ECO",
        "MRI & CT Scans",
        "Diet Management",
        "Pet Food",
        "Grooming Services",
        "Micro Chipping",
        "International Travel Documentation"      
      ],
      "contact": {
        "phone": "+923139999759",
        "email": "ziavets@gmail.com"
      }
    },
    {
      "name": "Round Lake Animal Hospital",
      "location": "DHA Phase-6, Sector-E (Extension-2), Lahore, Pakistan 54792",
      "image": RLHimage,
      "veterinarians": [
        ],
      "services_offered": [ 
        "Hospitalization",
        "Surgery & Operations",
        "Laser Treatment",
        "Vaccinations",
        "Grooming",
        "Boarding",
        "Training",
        "Dental care",
        "Veterinary Laboratory",
        "Pets Transportation",
        "Pets mart",
        "Bird market",
        "Equines Services",
        "Ruminants Services",
        "Poultry",
        "Goat & Sheep Services"
      ],
      "contact": {
        "phone": "042111500600",
        "email": "info@roundlakeanimalhospital.com.pk"
      }
   },
   {
    "name": "Fahad Pets Clinic",
    "location": "Street No. 13, Plaza 238, J Block Phase 6 DHA, Lahore, Pakistan",
    "image": FPCimage,
    "veterinarians": [
      {
        "name": "Dr. Muhammad Fahad Aziz",
        "specialization": "Pets' Practitioner"
      }
    ],
    "services_offered": [
      "Surgery",
      "Dentistry",
      "Reproduction",
      "Laboratory",
      "X-Ray",
      "Ultrasound",
      "Pet Food"
    ],
    "contact": {
      "phone": "0336 7450682",
      "email": "fahadpetsclinic@gmail.com"
    }
  },    
  {
    "name": "Pet 360",
    "location": "105 G, DHA Phase 1, Lahore, Pakistan",
    "image": P360image,
    "veterinarians": [
      {
        "name": "Dr. Inam Ul Hassan Awan",
        "specialization": "Head vet, Senior Small Animal Veterinary Surgeon"
      },
      {
        "name": "Dr. Salman Haider",
        "specialization": "Small Animal Veterinarian"
      },
      {
        "name": "Dr. Muhammad Azeem",
        "specialization": "Small Animal Vet, RVMP, DVM"
      },
      {
        "name": "Muhammad Talha Aslam",
        "specialization": "DVM, Small Animal Veterinarian"
      },
      {
        "name": "Hussain Niazi",
        "specialization": "DVM, Small Animal Veterinarian"
      }
    ],
    "services_offered": [
      "Preventative Care",
      "Diagnostics",
      "Surgery",
      "Dental Care",
      "Emergency Services",
      "Nutrition and Weight Management"
    ],
    "contact": {
      "phone": "0300 3714015",
      "email": "info@pet360.pk"
    }
  },    
  {
    "name": "My Pet Hospital - MPH",
    "location": "Shop number 3, Plot G-21/16, Opposite Bacha Party, Clifton, Karachi, Pakistan",
    "image": MPHimage,
    "veterinarians": [
      {
        "name": "Dr. Hafiz Muhammad Sajid",
        "specialization": "DVM"
      },
      {
        "name": "Dr. Usman Saleem",
        "specialization": "DVM, Small Animal Physician & Surgeon"
      },
      {
        "name": "Dr. Muammad Furqan",
        "specialization": "Senior Veterinary Officer"
      },
      {
        "name": "Dr. Farrukh Aslam",
        "specialization": "Senior Veterinary Officer"
      },
      {
        "name": "Dr. Muhammad Afzal",
        "specialization": "Veterinary Officer"
      },
      {
        "name": "Dr. Muneeb Zafar",
        "specialization": "Junior Veterinary Officer"
      }
    ],
    "services_offered": [
      "Preventive Care",
      "Emergency and Critical Care",
      "Surgery",
      "Dentistry",
      "Diagnostic Imaging",
      "Grooming",
      "Boarding",
      "OPD",
      "Vaccination"
    ],
    "contact": {
      "phone": "0310 7383663"
    }
  },  
  {
    "name": "Pets Care N Cure",
    "location": "Nishat Lane 2, D.H.A Phase 6 Ittehad Commercial Area, Phase 6 Defence Housing Authority, Karachi",
    "image": PCNCimage,
    "veterinarians": [
      {
        "name": "Dr. Osama",
        "specialization": "Veterinary Doctor"
      },
      {
        "name": "Dr. Arsalan",
        "specialization": "Veterinary Doctor"
      },
      {
        "name": "Dr. Sagheer",
        "specialization": "Veterinary Surgeon"
      },
      {
        "name": "Dr. Zaitulla",
        "specialization": "Veterinary Doctor"
      }
    ],
    "services_offered": [
      "Vaccination",
      "General examination",
      "Ultrasonography",
      "Dental Scaling",
      "Radiology",
      "Microchipping",
      "Soft tissue surgeries",
      "Orthopedic surgeries",
      "Isolation ward",
      "Diagnostic lab",
      "Clinical admissions",
      "Boarding facility",
      "Reproductive exam",
      "Pets Grooming",
      "Pet Accessories"
    ],
    "contact": {
      "phone": "0302 8281181",
      "email": "contact@petscarencure.pk"
    }
  },
  {
    "name": "Junaid Veterinary Clinic",
    "location": "Branch 1: Street#9 Redex Road, Koriyan Wala Bridge, near Pepsi Factory, Faisalabad, 38000.",
    "image": JVCimage,
    "veterinarians": [
      {
        "name": "Dr. Junaid Babar",
        "specialization": "Veterinarian"
      }
    ],
    "services_offered": [
      "Diagnosis & Treatment",
      "Deworming",
      "Lab Tests",
      "Ultrasound",
      "Vaccination",
      "Stud Services for Cats",
      "Spaying and Neutering",
      "Major & Minor Surgeries",
      "Avian Treatment",
      "Grooming",
      "Pet Boarding"
    ],
    "contact": {
      "phone": "+92 334 1938914 / +92 305 2499877",
      "email": "junaidbabar21@gmail.com"
    }
  },
  {
    "name": "Junaid Veterinary Clinic",
    "location": "Branch 2: Shop#28 Gulberg Road, Jinnah Colony, Faisalabad, 38000.",
    "image": JVCimage,
    "veterinarians": [
      {
        "name": "Dr. Junaid Babar",
        "specialization": "Veterinarian"
      }
    ],
    "services_offered": [
      "Diagnosis & Treatment",
      "Deworming",
      "Lab Tests",
      "Ultrasound",
      "Vaccination",
      "Stud Services for Cats",
      "Spaying and Neutering",
      "Major & Minor Surgeries",
      "Avian Treatment",
      "Grooming",
      "Pet Boarding"
    ],
    "contact": {
      "phone": "+92 334 1938914 / +92 305 2499877",
      "email": "junaidbabar21@gmail.com"
    }
  },
  {
    "name": "Doctor Pet Hospital",
    "location": "Plaza 15 Marina Commercial Opposite Mini Golf Club Main Corniche Road Phase 4, Bahria Town, Rawalpindi, 46220, Pakistan; Islamabad (Online Consultations)",
    "image": DPHimage,
    "veterinarians": [
      {
        "name": "Dr. Ali Usman",
        "specialization": "DVM, Head Veterinarian"
      }
    ],
    "services_offered": [
      "Microchipping",
      "Medicine/ treatment",
      "Vaccination and Wellness Care",
      "Surgery",
      "Dental Care",
      "Laboratory",
      "Pet Pharmacy",
      "Boarding and Cattery",
      "Pet Grooming",
      "Pet Food Mart"
    ],
    "contact": {
      "phone": "0300-616-7374 / (051) 5148545"
    }
  },
  {
    "name": "Dr. Hafeez Pets Clinic",
    "location": "Super Market, Adjacent to Qayyum Stadium, Peshawar, Pakistan",
    "image": HPCimage,
    "veterinarians": [
      {
        "name": "Dr. Hafeez",
        "specialization": "Veterinarian"
      },
      {
        "name": "Dr. Fahim Ullah",
        "specialization": "Small Animals Veterinarian, DVM"
      }
    ],
    "services_offered": [
      "Pets Consultation",
      "Pets Accessories",
      "Major and Minor Surgeries",
      "Grooming",
      "Nail cutting",
      "Tooth scaling",
      "Dental surgeries"
    ],
    "contact": {
      "phone": "0340 1565823",
      "email": "hafeezkhandawar2499@gmail.com"
    }
  },
  {
    "name": "Multan Pet's Clinic",
    "location": "Hassan Parwana Road, Main Road Near Bohar Gate and PSO Petrol Pump, Multan, Pakistan",
    "image": MPCimage,
    "veterinarians": [
      {
        "name": "Dr. Rafi Ullah",
        "specialization": "Veterinary Doctor"
      }
    ],
    "services_offered": [
      "Modern delivery rooms",
      "IPD",
      "OPD",
      "24/7 emergency services",
      "Operation theatre",
      "Pharmacy",
      "Diagnostic laboratory",
      "Nursery",
      "X-ray facilities"
    ],
    "contact": {
      "phone": "0300 9634645",
      "email": "saadullahrajpoot@gmail.com"
    }
  },
  {
    "name": "Khan Pets & Veterinary Clinic Multan",
    "location": "F-41 (Back of Faysal Bank), T-Chowk Shah Rukn-e-Alam Colony, Multan, Pakistan",
    "image": KPVCMimage,
    "veterinarians": [
      {
        "name": "Dr. Aakash Khan",
        "specialization": "Veterinary Physician and Surgeon D.V.M (UVAS), R.V.M.P (Pak)"
      }
    ],
    "services_offered": [
      "Grooming",
      "Deworming",
      "Vaccinations",
      "Exotic animals",
      "Ultrasonography",
      "Gas Anesthesia Facility",
      "Major and Minor Surgeries",
      "Equipped with all Lab Tests",
      "Disease Diagnosis & Treatments",
      "International Travel Documentation"
    ],
    "contact": {
      "phone": "0340 7026839",
      "email": "vetaakash@icloud.com"
    }
  }
                
  ]
};

function Clinics() {
  const [clinics] = useState(clinicsData.clinics);
  const [filteredClinics, setFilteredClinics] = useState([]);
  const [query, setQuery] = useState("");
  const [selectedClinic, setSelectedClinic] = useState(null);

  const handleSearch = (searchQuery) => {
    setQuery(searchQuery);
    if (!searchQuery) {
      setFilteredClinics([]);
    } else {
      const filtered = clinics.filter((clinic) =>
        clinic.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        clinic.location.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredClinics(filtered);
    }
  };

  const clinicsToDisplay = query ? filteredClinics : clinics;

  const handleViewMore = (index) => {
    setSelectedClinic(index);
  };

  const ExpandedClinicCard = ({ clinic, onClose }) => (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 overflow-y-auto p-4">
      <div className="bg-white text-amber-950 rounded-xl shadow-lg mx-auto max-w-4xl w-full relative p-5">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 hover:bg-amber-100 rounded-full text-2xl z-50"
        >
          ×
        </button>
        
        {/* Clinic Card Header */}
        <div className="bg-brown-50 p-5 border-b border-brown-200">
          <div className="flex items-center space-x-4">
            <img 
              src={clinic.image || dog} 
              alt="Clinic" 
              className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-md"
            />
            <div>
              <h2 className="text-2xl font-bold text-amber-950">{clinic.name}</h2>
              <p className="text-sm text-amber-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-amber-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {clinic.location}
              </p>
            </div>
          </div>
        </div>

        {/* Clinic Details Content */}
        <div className="mt-6 space-y-6 p-5">
          {/* Services Section */}
          <div>
            <h3 className="text-xl font-semibold text-brown-800 mb-4 border-b pb-2">
              Services Offered
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {clinic.services_offered.map((service, i) => (
                <div 
                  key={i} 
                  className="bg-brown-50 text-brown-800 px-3 py-2 rounded-md text-sm text-center hover:bg-brown-100 transition"
                >
                  {service}
                </div>
              ))}
            </div>
          </div>

          {/* Veterinarians Section */}
          <div>
            <h3 className="text-xl font-semibold text-brown-800 mb-4 border-b pb-2">
              Our Veterinarians
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {clinic.veterinarians.map((vet, i) => (
                <div 
                  key={i} 
                  className="bg-brown-100 p-4 rounded-lg shadow-sm hover:shadow-md transition"
                >
                  <h4 className="font-bold text-brown-800 mb-1">{vet.name}</h4>
                  <p className="text-sm text-brown-600 italic">
                    {vet.specialization}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-xl font-semibold text-brown-800 mb-4 border-b pb-2">
              Contact Information
            </h3>
            <div className="bg-brown-50 p-4 rounded-lg">
              <p className="mb-2">
                <strong className="text-brown-700">Phone:</strong>{' '}
                <a href={`tel:${clinic.contact.phone}`} className="text-amber-900 hover:underline">
                  {clinic.contact.phone}
                </a>
              </p>
              {clinic.contact.email && (
                <p>
                  <strong className="text-brown-700">Email:</strong>{' '}
                  <a href={`mailto:${clinic.contact.email}`} className="text-amber-900 hover:underline">
                    {clinic.contact.email}
                  </a>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl bg-white">
      {/* Page Header */}
      <div className="text-center mb-10">
        <h1 className="text-4xl font-extrabold text-[#6b493d] mb-4">
          Veterinary Clinics & Healthcare
        </h1>
        <p className="text-xl text-[#a07855] max-w-2xl mx-auto">
          Discover top-rated veterinary clinics, skilled professionals, and comprehensive animal healthcare services.
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-8 px-4 sm:px-6 lg:px-8">
        <SearchBar
          onSearch={handleSearch}
          placeholder="Search clinics by name or location..."
        />
      </div>

      {/* Search Results Heading */}
      {query && filteredClinics.length > 0 && (
        <h2 className="text-2xl font-semibold text-center text-[#6b493d] mb-6">
          Search Results for "{query}"
        </h2>
      )}

      {/* No Results Handling */}
      {clinicsToDisplay.length === 0 && (
        <div className="text-center py-10 bg-brown-100 rounded-lg">
          <p className="text-xl text-brown-700">
            No clinics found. Please try a different search.
          </p>
        </div>
      )}

      {/* Clinics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {clinicsToDisplay.map((clinic, index) => (
          <div
            key={index}
            className="bg-white text-amber-950 shadow-md rounded-lg overflow-hidden transition-all duration-300 ease-in-out"
          >
            {/* Clinic Card Header */}
            <div className="bg-brown-50 p-5 border-b border-brown-200">
              <div className="flex items-center space-x-4">
                <img 
                  src={clinic.image || dog} 
                  alt="Clinic" 
                  className="w-20 h-20 object-cover rounded-full border-4 border-white shadow-md"
                />
                <div>
                  <h2 className="text-2xl font-bold text-[#6b493d]">{clinic.name}</h2>
                  <p className="text-sm text-[#a07855] flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-[#6b493d]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 616 0z" />
                    </svg>
                    {clinic.location}
                  </p>
                </div>
              </div>
            </div>

            {/* Clinic Card Body */}
            <div className="p-5">
              <div className="text-center mb-4">
                <button
                  onClick={() => handleViewMore(index)}
                  className="px-6 py-2 bg-amber-900 text-white rounded-full hover:bg-amber-950 transition duration-300"
                >
                  View Clinic Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Expanded Clinic Modal */}
      {selectedClinic !== null && (
        <ExpandedClinicCard 
          clinic={clinicsToDisplay[selectedClinic]} 
          onClose={() => setSelectedClinic(null)}
        />
      )}
    </div>
  );
}

export default Clinics;